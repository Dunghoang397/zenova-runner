// ZENOVA SHOP - GitHub API v17 ULTRA FAST
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
  userAgent: 'zenova-shop-bot/17.0'
});

const tag = (id) => `zenova-storage-${id}`;
const branch = (id) => `zenova-state-${id}`;

async function ghApi(path, options = {}) {
  const url = 'https://api.github.com' + path;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + process.env.GH_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'zenova-shop-bot/17.0',
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
    throw new Error('Machine ID only a-z, 0-9, dash');
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

export async function getStateJson(machineId) {
  try {
    const rel = await ghApi('/repos/' + cfg.owner + '/' + cfg.repo + '/releases/tags/' + tag(machineId));
    const stateAsset = rel.assets.find(a => a.name === 'state.json');
    if (!stateAsset) return null;
    const url = stateAsset.browser_download_url + '?t=' + Date.now() + '&r=' + Math.random();
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + process.env.GH_TOKEN,
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    data._fetchedAt = Date.now();
    return data;
  } catch (e) {
    logger.dbg('getStateJson: ' + e.message);
    return null;
  }
}

export async function getManifest(machineId) {
  return getStateJson(machineId);
}

export async function getUserMachine(discordUserId) {
  const machines = await listMachines();
  for (const m of machines.slice(0, 30)) {
    const state = await getStateJson(m.id);
    if (state?.ownerDiscordId === discordUserId && state?.ready) {
      return { ...m, manifest: state };
    }
  }
  return null;
}

export async function isMachineOwner(discordUserId, machineId) {
  const state = await getStateJson(machineId);
  if (!state) return false;
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
      url: r.html_url
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
    url: r.html_url
  }));
}

// ═══ POLL 2.5S (SIÊU NHANH) ═══
export async function waitForWorkflowCompletion(machineId, maxWaitMs = 900000, intervalMs = 2500, onProgress = null) {
  const startTime = Date.now();
  logger.info('Poll state.json (2.5s): ' + machineId);

  await new Promise(r => setTimeout(r, 3000));

  let attempt = 0;
  const maxAttempts = Math.floor(maxWaitMs / intervalMs);
  let lastLogAt = 0;
  let bestState = null;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    try {
      const state = await getStateJson(machineId);

      if (state?.tailscaleIp && state.tailscaleIp !== '?') bestState = state;

      if (onProgress) {
        try { await onProgress({ attempt, maxAttempts, state, elapsed: Date.now() - startTime }); } catch {}
      }

      if (state && state.ready === true && state.tailscaleIp && state.tailscaleIp !== '?') {
        logger.ok('READY (' + attempt + ', ' + Math.round((Date.now() - startTime) / 1000) + 's)');
        return { success: true, manifest: state, attempts: attempt, elapsed: Date.now() - startTime };
      }

      if (attempt - lastLogAt >= 25) {
        logger.info('Poll ' + attempt + '/' + maxAttempts + ' | ' + (state?.step || 'waiting') + ' | ' + Math.round((Date.now() - startTime) / 1000) + 's');
        lastLogAt = attempt;
      }
    } catch (e) {
      logger.dbg('Poll fail: ' + e.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }

  if (bestState) {
    logger.warn('TIMEOUT but have state with IP');
    return { success: true, manifest: bestState, attempts: attempt, elapsed: Date.now() - startTime, fallback: true };
  }

  return { success: false, error: 'Timeout ' + (maxWaitMs / 1000) + 's', lastState: bestState };
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
          logs.push('=== ' + job.name + ' (' + job.status + ') ===\n' + txt.split('\n').slice(-lines).join('\n'));
        }
      } catch (e) {}
    }
    return logs.join('\n\n') || '(no log)';
  } catch (e) {
    return 'Error: ' + e.message;
  }
}