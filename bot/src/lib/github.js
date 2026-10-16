// ZENOVA SHOP - GitHub API Wrapper
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
  userAgent: 'zenova-shop-bot/9.0'
});

const tag = (id) => `zenova-storage-${id}`;
const branch = (id) => `zenova-state-${id}`;

// ─── Dispatch workflow ───
export async function dispatchCreate(inputs) {
  if (!/^[a-z0-9\-]+$/.test(inputs.machine_id)) {
    throw new Error('Ten may chi duoc chua a-z, 0-9, dau gach');
  }
  logger.cmd('Dispatch tao may: ' + inputs.machine_id);
  await octokit.actions.createWorkflowDispatch({
    owner: cfg.owner,
    repo: cfg.repo,
    workflow_id: cfg.workflow,
    ref: cfg.branch,
    inputs
  });
  logger.ok('Da dispatch: ' + inputs.machine_id);
}

// ─── List machines ───
export async function listMachines() {
  const { data: releases } = await octokit.repos.listReleases({
    owner: cfg.owner,
    repo: cfg.repo,
    per_page: 100
  });
  return releases
    .filter(r => r.tag_name.startsWith('zenova-storage-'))
    .map(r => ({
      id: r.tag_name.replace('zenova-storage-', ''),
      tag: r.tag_name,
      releaseId: r.id,
      created: r.created_at,
      updated: r.updated_at,
      chunks: r.assets.filter(a => a.name.startsWith('zenova-drive')).length,
      totalSize: r.assets.filter(a => a.name.startsWith('zenova-drive')).reduce((s, a) => s + a.size, 0),
      url: r.html_url
    }));
}

// ─── Get manifest ───
export async function getManifest(machineId) {
  try {
    const { data: rel } = await octokit.repos.getReleaseByTag({
      owner: cfg.owner,
      repo: cfg.repo,
      tag: tag(machineId)
    });
    const mf = rel.assets.find(a => a.name === 'drive-manifest.json');
    if (!mf) return null;
    const res = await fetch(mf.browser_download_url, {
      headers: { Authorization: 'Bearer ' + process.env.GH_TOKEN }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    logger.dbg('getManifest fail: ' + e.message);
    return null;
  }
}

// ─── Get user's machine ───
export async function getUserMachine(discordUserId) {
  const machines = await listMachines();
  for (const m of machines.slice(0, 30)) {
    const manifest = await getManifest(m.id);
    if (manifest?.ownerDiscordId === discordUserId) {
      return { ...m, manifest };
    }
  }
  return null;
}

// ─── Check owner ───
export async function isMachineOwner(discordUserId, machineId) {
  const manifest = await getManifest(machineId);
  if (!manifest) return false;
  return manifest.ownerDiscordId === discordUserId;
}

// ─── List active runs ───
export async function listActiveRuns() {
  const { data } = await octokit.actions.listWorkflowRuns({
    owner: cfg.owner,
    repo: cfg.repo,
    workflow_id: cfg.workflow,
    per_page: 50
  });
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

// ─── List recent runs ───
export async function listRecentRuns(limit = 15) {
  const { data } = await octokit.actions.listWorkflowRuns({
    owner: cfg.owner,
    repo: cfg.repo,
    workflow_id: cfg.workflow,
    per_page: limit
  });
  return (data.workflow_runs || []).map(r => ({
    id: r.id,
    number: r.run_number,
    status: r.status,
    conclusion: r.conclusion,
    started: r.run_started_at || r.created_at,
    url: r.html_url
  }));
}

// ─── Wait for workflow complete + get info ───
export async function waitForWorkflowCompletion(machineId, maxWaitMs = 300000, intervalMs = 15000) {
  const startTime = Date.now();
  const initialRuns = await listRecentRuns(5);
  const initialRunId = initialRuns[0]?.id;

  logger.info('Cho workflow bat dau (run cu: ' + initialRunId + ')...');

  let newRun = null;

  // Cho run moi xuat hien (toi da 60 giay)
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const runs = await listRecentRuns(5);
    if (runs[0] && runs[0].id !== initialRunId) {
      newRun = runs[0];
      logger.info('Workflow moi bat dau: run #' + newRun.number);
      break;
    }
  }

  if (!newRun) {
    logger.warn('Khong tim thay run moi');
    return { success: false, error: 'Workflow khong bat dau' };
  }

  // Cho run hoan thanh
  while (Date.now() - startTime < maxWaitMs) {
    const runs = await listRecentRuns(5);
    const currentRun = runs.find(r => r.id === newRun.id);

    if (!currentRun) {
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
    }

    logger.info('Run #' + currentRun.number + ' status: ' + currentRun.status + ' / ' + (currentRun.conclusion || '...'));

    if (currentRun.status === 'completed') {
      if (currentRun.conclusion === 'success') {
        // Đợi thêm 10s cho state file được ghi
        await new Promise(r => setTimeout(r, 10000));

        // Lấy manifest
        const manifest = await getManifest(machineId);

        if (manifest) {
          return {
            success: true,
            manifest,
            runUrl: currentRun.url,
            runNumber: currentRun.number
          };
        } else {
          return {
            success: true,
            manifest: null,
            runUrl: currentRun.url,
            runNumber: currentRun.number
          };
        }
      } else {
        return {
          success: false,
          error: 'Workflow ' + currentRun.conclusion,
          runUrl: currentRun.url,
          runNumber: currentRun.number
        };
      }
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return { success: false, error: 'Timeout cho workflow' };
}

// ─── Delete machine + trigger workflow cleanup ───
export async function deleteMachine(machineId, requesterId, isAdmin = false) {
  if (!isAdmin) {
    const owned = await isMachineOwner(requesterId, machineId);
    if (!owned) {
      throw new Error('Ban khong phai chu cua may nay');
    }
  }

  // Buoc 1: Trigger workflow cancel + save
  try {
    const runs = await listActiveRuns();
    // Tim run cua may nay (khong co cach map truc tiep, cancel tat ca)
    for (const r of runs) {
      try {
        await octokit.actions.cancelWorkflowRun({
          owner: cfg.owner,
          repo: cfg.repo,
          run_id: r.id
        });
        logger.info('Cancelled run ' + r.number);
      } catch {}
    }

    // Doi 10s cho save cuoi
    await new Promise(r => setTimeout(r, 10000));
  } catch (e) {
    logger.dbg('Cancel runs fail: ' + e.message);
  }

  // Buoc 2: Xoa release
  try {
    const { data: rel } = await octokit.repos.getReleaseByTag({
      owner: cfg.owner,
      repo: cfg.repo,
      tag: tag(machineId)
    });
    await octokit.repos.deleteRelease({
      owner: cfg.owner,
      repo: cfg.repo,
      release_id: rel.id
    });
    logger.info('Deleted release ' + tag(machineId));
  } catch (e) {
    logger.dbg('Delete release fail: ' + e.message);
  }

  // Buoc 3: Xoa branch state
  try {
    await octokit.git.deleteRef({
      owner: cfg.owner,
      repo: cfg.repo,
      ref: 'heads/' + branch(machineId)
    });
    logger.info('Deleted branch ' + branch(machineId));
  } catch (e) {
    logger.dbg('Delete branch fail: ' + e.message);
  }

  logger.ok('Da xoa may: ' + machineId);
}

// ─── Cancel run ───
export async function cancelRun(runId) {
  await octokit.actions.cancelWorkflowRun({
    owner: cfg.owner,
    repo: cfg.repo,
    run_id: runId
  });
  logger.ok('Cancelled run ' + runId);
}

// ─── Get log ───
export async function getRunLogTail(runId, lines = 80) {
  try {
    const { data: jobs } = await octokit.actions.listJobsForWorkflowRun({
      owner: cfg.owner,
      repo: cfg.repo,
      run_id: runId
    });
    const logs = [];
    for (const job of jobs.jobs || []) {
      try {
        const res = await fetch(
          'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/actions/jobs/' + job.id + '/logs',
          {
            headers: {
              Authorization: 'Bearer ' + process.env.GH_TOKEN,
              Accept: 'application/vnd.github+json'
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
    return logs.join('\n\n') || '(khong co log)';
  } catch (e) {
    return 'Loi: ' + e.message;
  }
}