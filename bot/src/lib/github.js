// ZENOVA - GitHub API v19
// FIX 5%: API asset endpoint + workflow log fallback + partialReady accept
import { Octokit } from '@octokit/rest';
import { logger } from './logger.js';

const cfg = {
  owner: process.env.GH_OWNER,
  repo: process.env.GH_REPO,
  branch: process.env.GH_BRANCH || 'main',
  workflow: process.env.GH_WORKFLOW || 'aistv-rdp.yml'
};

export const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
  userAgent: 'zenova-bot/19.0'
});

const tag = (id) => `zenova-storage-${id}`;
const branch = (id) => `zenova-state-${id}`;

async function ghApi(path, options = {}) {
  const url = 'https://api.github.com' + path;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + process.env.GH_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'zenova-bot/19.0',
    'Cache-Control': 'no-cache',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers, cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('HTTP ' + res.status + ': ' + txt.slice(0, 200));
  }
  if (res.status === 204) return null;
  return await res.json();
}

export async function dispatchCreate(inputs) {
  if (!/^[a-z0-9\-]+$/.test(inputs.machine_id)) {
    throw new Error('Machine ID: a-z, 0-9, dash only');
  }
  logger.cmd('Dispatch: ' + inputs.machine_id);
  await ghApi(
    '/repos/' + cfg.owner + '/' + cfg.repo + '/actions/workflows/' + cfg.workflow + '/dispatches',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: cfg.branch, inputs })
    }
  );
  logger.ok('Dispatched: ' + inputs.machine_id);
}

export async function listMachines() {
  const releases = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases?per_page=100');
  return releases
    .filter(r => r.tag_name.startsWith('zenova-storage-'))
    .map(r => ({
      id: r.tag_name.replace('zenova-storage-', ''),
      tag: r.tag_name,
      releaseId: r.id,
      created: r.created_at,
      updated: r.updated_at,
      url: r.html_url
    }));
}

// ═══════════════════════════════════════════════════════════════
// CHIẾN LƯỢC 1: ĐỌC STATE QUA API ASSET ENDPOINT (KHÔNG CACHE)
// ═══════════════════════════════════════════════════════════════
export async function getStateJson(machineId) {
  try {
    const rel = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/tags/' + tag(machineId));
    const stateAsset = rel.assets.find(a => a.name === 'state.json');
    if (!stateAsset) return null;

    // Đọc qua API asset endpoint — KHÔNG CACHE
    const res = await fetch(
      'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/releases/assets/' + stateAsset.id,
      {
        headers: {
          'Authorization': 'Bearer ' + process.env.GH_TOKEN,
          'Accept': 'application/octet-stream',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'zenova-bot/19.0',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        redirect: 'follow',
        cache: 'no-store'
      }
    );

    if (!res.ok) {
      logger.dbg('Asset fetch fail: ' + res.status);
      return null;
    }

    const data = await res.json();
    data._fetchedAt = Date.now();
    data._assetId = stateAsset.id;
    data._assetUpdatedAt = stateAsset.updated_at;
    return data;
  } catch (e) {
    logger.dbg('getStateJson: ' + e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CHIẾN LƯỢC 2: PARSE STATE TỪ WORKFLOW RUN LOG
// ═══════════════════════════════════════════════════════════════
async function getStateFromRunLog(machineId) {
  try {
    const runs = await listRecentRuns(5);
    if (!runs.length) return null;

    // Tìm run có display_title chứa machineId (nếu có)
    // Fallback: dùng run mới nhất
    let targetRun = runs[0];
    for (const r of runs) {
      const title = r.display_title || '';
      if (title.toLowerCase().includes(machineId.toLowerCase())) {
        targetRun = r;
        break;
      }
    }

    const logTail = await getRunLogTail(targetRun.id, 800);
    if (!logTail || logTail === '(no log)') return null;

    // Parse Tailscale IP (100.x.x.x)
    const ipMatch = logTail.match(/(?:Tailscale IP|IP Tailscale|IP)\s*[:=]\s*(100\.\d+\.\d+\.\d+)/i)
      || logTail.match(/\b(100\.\d+\.\d+\.\d+)\b/);
    if (!ipMatch) return null;
    const ip = ipMatch[1];

    // Parse user
    const userMatch = logTail.match(/(?:RDP_USER|User)\s*[:=]\s*(\w+)/i)
      || logTail.match(/user\s*[:=]\s*(\w+)/i);
    const user = userMatch ? userMatch[1] : 'runneradmin';

    // Parse password (nếu có trong log — nhưng thường bị mask)
    const passMatch = logTail.match(/(?:RDP_PASS|Pass)\s*[:=]\s*(\S+)/i)
      || logTail.match(/Pass\s*[:=]\s*(\S+)/i);
    let pass = passMatch ? passMatch[1] : '(secret)';
    // Nếu pass bị mask thành ***
    if (pass.includes('*') || pass === '***') pass = '(secret)';

    // Parse OS build
    const osMatch = logTail.match(/(?:OS Build|OS_BUILD)\s*[:=]\s*(\d+)/i);
    const osBuild = osMatch ? osMatch[1] : '?';

    // Parse Windows image
    const imgMatch = logTail.match(/(?:Windows|windows_image)\s*[:=]\s*(windows-\d+)/i);
    const windowsImage = imgMatch ? imgMatch[1] : 'windows-2025';

    // Verify ready signals
    const isReady = /SAN SANG KET NOI|READY|Ready|Ready to connect/i.test(logTail);
    if (!isReady) return null;

    logger.info('State from log: ' + machineId + ' | IP: ' + ip + ' | User: ' + user);

    return {
      machineId,
      ownerDiscordId: null,
      user,
      password: pass,
      tailscaleIp: ip,
      osBuild,
      windowsImage,
      windowsMode: 'lite',
      status: 'ready',
      step: 'ready',
      ready: true,
      partialReady: true,
      _fromLog: true,
      _runId: targetRun.id,
      _fetchedAt: Date.now()
    };
  } catch (e) {
    logger.dbg('getStateFromRunLog: ' + e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// HÀM CHÍNH: LẤY STATE VỚI NHIỀU CHIẾN LƯỢC FALLBACK
// ═══════════════════════════════════════════════════════════════
export async function getStateWithFallback(machineId) {
  // 1. Thử API asset (không cache)
  let state = await getStateJson(machineId);

  // 2. Nếu state đủ thông tin (IP + user + pass) → dùng luôn
  if (state && state.tailscaleIp && state.tailscaleIp !== '?'
      && state.user && state.user !== '?'
      && state.password && state.password !== '?') {
    return state;
  }

  // 3. Nếu state không đủ → fallback log
  const logState = await getStateFromRunLog(machineId);
  if (logState) {
    // Merge: giữ owner từ state nếu có
    if (state?.ownerDiscordId) logState.ownerDiscordId = state.ownerDiscordId;
    if (state?.duckdnsHost) logState.duckdnsHost = state.duckdnsHost;
    if (state?.durationMinutes) logState.durationMinutes = state.durationMinutes;
    if (state?.startUtc) logState.startUtc = state.startUtc;
    return logState;
  }

  // 4. Trả state raw (có thể chỉ có IP chưa có pass)
  return state;
}

export async function getManifest(machineId) {
  return getStateWithFallback(machineId);
}

export async function getUserMachine(discordUserId) {
  const machines = await listMachines();
  for (const m of machines.slice(0, 30)) {
    const state = await getStateWithFallback(m.id);
    if (!state) continue;
    if (state.ownerDiscordId === discordUserId) {
      return { ...m, manifest: state };
    }
  }
  return null;
}

export async function isMachineOwner(discordUserId, machineId) {
  const state = await getStateJson(machineId);
  if (!state) return false;
  if (!state.ownerDiscordId) return true;
  return state.ownerDiscordId === discordUserId;
}

export async function listActiveRuns() {
  const data = await ghApi(
    '/repos/' + cfg.owner + '/' + cfg.repo + '/actions/workflows/' + cfg.workflow + '/runs?per_page=50'
  );
  return (data.workflow_runs || [])
    .filter(r => ['in_progress', 'queued', 'waiting', 'requested'].includes(r.status))
    .map(r => ({
      id: r.id,
      number: r.run_number,
      status: r.status,
      started: r.run_started_at || r.created_at,
      url: r.html_url,
      display_title: r.display_title || ''
    }));
}

export async function listRecentRuns(limit = 20) {
  const data = await ghApi(
    '/repos/' + cfg.owner + '/' + cfg.repo + '/actions/workflows/' + cfg.workflow + '/runs?per_page=' + limit
  );
  return (data.workflow_runs || []).map(r => ({
    id: r.id,
    number: r.run_number,
    status: r.status,
    conclusion: r.conclusion,
    started: r.run_started_at || r.created_at,
    updated: r.updated_at,
    url: r.html_url,
    event: r.event,
    display_title: r.display_title || ''
  }));
}

// ═══════════════════════════════════════════════════════════════
// POLL — CHẤP NHẬN NHIỀU MỨC READY
// ═══════════════════════════════════════════════════════════════
export async function waitForWorkflowCompletion(machineId, maxWaitMs = 900000, intervalMs = 2000, onProgress = null) {
  const startTime = Date.now();
  logger.info('Poll state (2s, API+log): ' + machineId);

  await new Promise(r => setTimeout(r, 3000));

  let attempt = 0;
  const maxAttempts = Math.floor(maxWaitMs / intervalMs);
  let lastLogAt = 0;
  let bestState = null;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    try {
      const state = await getStateWithFallback(machineId);

      if (state && state.tailscaleIp && state.tailscaleIp !== '?') {
        bestState = state;
      }

      if (onProgress) {
        try { await onProgress({ attempt, maxAttempts, state, elapsed: Date.now() - startTime }); } catch {}
      }

      // MỨC 1: ready + IP + user (đủ để kết nối)
      if (state && state.tailscaleIp && state.tailscaleIp !== '?'
          && state.user && state.user !== '?') {
        logger.ok('READY (' + attempt + ', ' + Math.round((Date.now() - startTime) / 1000) + 's)');
        return { success: true, manifest: state, attempts: attempt, elapsed: Date.now() - startTime, fromLog: state._fromLog || false };
      }

      if (attempt - lastLogAt >= 20) {
        const s = state?.status || 'none';
        const step = state?.step || '-';
        const hasIp = state?.tailscaleIp && state.tailscaleIp !== '?' ? 'YES' : 'NO';
        logger.info('Poll ' + attempt + '/' + maxAttempts + ' | step:' + step + ' | IP:' + hasIp + ' | ' + Math.round((Date.now() - startTime) / 1000) + 's');
        lastLogAt = attempt;
      }
    } catch (e) {
      logger.dbg('Poll fail: ' + e.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  if (bestState) {
    logger.warn('TIMEOUT but have IP state');
    return { success: true, manifest: bestState, attempts: attempt, elapsed: Date.now() - startTime, fallback: true };
  }

  return { success: false, error: 'Timeout ' + (maxWaitMs / 1000) + 's', lastState: bestState };
}

// ═══════════════════════════════════════════════════════════════
// TRANSFER MACHINE
// ═══════════════════════════════════════════════════════════════
export async function transferOwnership(machineId, newOwnerId, requesterId, isAdmin = false) {
  const state = await getStateJson(machineId);
  if (!state) throw new Error('Machine not found: ' + machineId);

  if (!isAdmin) {
    if (state.ownerDiscordId && state.ownerDiscordId !== requesterId) {
      throw new Error('You are not the owner');
    }
  }

  if (state.ownerDiscordId === newOwnerId) {
    throw new Error('Already belongs to this user');
  }

  const newState = {
    ...state,
    ownerDiscordId: newOwnerId,
    previousOwnerId: state.ownerDiscordId || null,
    transferredUtc: new Date().toISOString(),
    transferredBy: requesterId
  };

  // Remove internal fields
  delete newState._fetchedAt;
  delete newState._assetId;
  delete newState._assetUpdatedAt;
  delete newState._fromLog;
  delete newState._runId;

  const rel = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/tags/' + tag(machineId));
  const stateAsset = rel.assets.find(a => a.name === 'state.json');
  if (!stateAsset) throw new Error('state.json missing');

  await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/assets/' + stateAsset.id, { method: 'DELETE' });

  const uploadUrl = rel.upload_url.replace(/\{.*\}/, '') + '?name=state.json';
  const jsonStr = JSON.stringify(newState, null, 2);
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.GH_TOKEN,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: jsonStr
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Upload fail: HTTP ' + res.status + ' ' + txt.slice(0, 200));
  }

  logger.ok(`Transferred ${machineId}: ${state.ownerDiscordId} -> ${newOwnerId}`);
  return { success: true, machineId, previousOwner: state.ownerDiscordId || null, newOwner: newOwnerId, state: newState };
}

export async function deleteMachine(machineId, requesterId, isAdmin = false) {
  if (!isAdmin) {
    const owned = await isMachineOwner(requesterId, machineId);
    if (!owned) throw new Error('Not your machine');
  }
  try {
    const runs = await listRecentRuns(20);
    const active = runs.filter(r => ['in_progress', 'queued'].includes(r.status));
    for (const r of active) {
      try { await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/actions/runs/' + r.id + '/cancel', { method: 'POST' }); } catch {}
    }
    await new Promise(r => setTimeout(r, 3000));
  } catch (e) {}
  try {
    const rel = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/tags/' + tag(machineId));
    await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/' + rel.id, { method: 'DELETE' });
  } catch (e) {}
  try {
    await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/git/refs/heads/' + branch(machineId), { method: 'DELETE' });
  } catch (e) {}
  logger.ok('Deleted: ' + machineId);
}

export async function cancelRun(runId) {
  await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/actions/runs/' + runId + '/cancel', { method: 'POST' });
}

export async function getRunLogTail(runId, lines = 80) {
  try {
    const jobs = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/actions/runs/' + runId + '/jobs');
    const logs = [];
    for (const job of jobs.jobs || []) {
      try {
        const res = await fetch(
          'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/actions/jobs/' + job.id + '/logs',
          {
            headers: {
              Authorization: 'Bearer ' + process.env.GH_TOKEN,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            },
            redirect: 'follow'
          }
        );
        if (res.ok) {
          const txt = await res.text();
          logs.push(txt);
        }
      } catch (e) {}
    }
    const fullLog = logs.join('\n');
    // Trả về N dòng cuối
    return fullLog.split('\n').slice(-lines).join('\n');
  } catch (e) {
    return 'Error: ' + e.message;
  }
}