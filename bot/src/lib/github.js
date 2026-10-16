// ZENOVA SHOP - GitHub API Wrapper
// Tao/xoa may qua GitHub Actions
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
  userAgent: 'zenova-shop-bot/8.0'
});

const tag = (id) => `zenova-storage-${id}`;
const branch = (id) => `zenova-state-${id}`;

export async function dispatchCreate(inputs) {
  if (!/^[a-z0-9\-]+$/.test(inputs.machine_id)) {
    throw new Error('Ten may chi duoc chua a-z, 0-9, dau gach');
  }
  logger.cmd(`Dispatch tao may: ${inputs.machine_id} | owner: ${inputs.owner_discord_id}`);
  await octokit.actions.createWorkflowDispatch({
    owner: cfg.owner,
    repo: cfg.repo,
    workflow_id: cfg.workflow,
    ref: cfg.branch,
    inputs
  });
  logger.ok(`Da dispatch: ${inputs.machine_id}`);
}

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
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    logger.dbg(`getManifest fail: ${e.message}`);
    return null;
  }
}

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

export async function isMachineOwner(discordUserId, machineId) {
  const manifest = await getManifest(machineId);
  if (!manifest) return false;
  return manifest.ownerDiscordId === discordUserId;
}

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

export async function cancelRun(runId) {
  await octokit.actions.cancelWorkflowRun({
    owner: cfg.owner,
    repo: cfg.repo,
    run_id: runId
  });
  logger.ok(`Da cancel run ${runId}`);
}

export async function deleteMachine(machineId, requesterId, isAdmin = false) {
  if (!isAdmin) {
    const owned = await isMachineOwner(requesterId, machineId);
    if (!owned) {
      throw new Error('Ban khong phai chu cua may nay');
    }
  }
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
  } catch (e) {
    logger.dbg(`Delete release fail: ${e.message}`);
  }
  try {
    await octokit.git.deleteRef({
      owner: cfg.owner,
      repo: cfg.repo,
      ref: `heads/${branch(machineId)}`
    });
  } catch (e) {
    logger.dbg(`Delete branch fail: ${e.message}`);
  }
  logger.ok(`Da xoa may: ${machineId}`);
}

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
          `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/jobs/${job.id}/logs`,
          {
            headers: {
              Authorization: `Bearer ${process.env.GH_TOKEN}`,
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