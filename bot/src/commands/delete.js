import { SlashCommandBuilder } from 'discord.js';
import { deleteMachine, getStateJson, octokit } from '../lib/github.js';
import { successEmbed, errorEmbed, loadingEmbed } from '../ui/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('🗑️ Xoá máy (force stop)')
  .addStringOption(o => o.setName('machine_id').setDescription('Tên máy').setRequired(true))
  .addStringOption(o => o.setName('confirm').setDescription('Gõ lại tên').setRequired(true));

export async function execute(i) {
  try {
    await i.deferReply({ ephemeral: true });
    const uid = i.user.id;
    const mid = i.options.getString('machine_id').toLowerCase().trim();
    const cf = i.options.getString('confirm').toLowerCase().trim();
    if (cf !== mid) return i.editReply({ embeds: [errorEmbed('Không khớp', cf + ' vs ' + mid)] });
    const state = await getStateJson(mid);
    if (!state) return i.editReply({ embeds: [errorEmbed('Không tồn tại', mid)] });
    if (state.ownerDiscordId !== uid) return i.editReply({ embeds: [errorEmbed('Không phải chủ', '')] });
    await i.editReply({ embeds: [loadingEmbed('Đang xoá', 'Force stop...')] });
    try {
      const rel = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
        owner: process.env.GH_OWNER, repo: process.env.GH_REPO, tag: 'zenova-storage-' + mid
      });
      const uploadUrl = rel.data.upload_url.replace(/\{.*\}/, '') + '?name=FORCE_STOP';
      await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.GH_TOKEN,
          'Content-Type': 'application/octet-stream',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: 'STOP'
      });
    } catch (e) { console.log('FORCE_STOP fail:', e.message); }
    try {
      const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs?per_page=50', {
        owner: process.env.GH_OWNER, repo: process.env.GH_REPO
      });
      for (const run of data.workflow_runs) {
        if ((run.display_title || '').toLowerCase().includes(mid.toLowerCase()) && ['in_progress','queued','waiting'].includes(run.status)) {
          await octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel', {
            owner: process.env.GH_OWNER, repo: process.env.GH_REPO, run_id: run.id
          });
        }
      }
    } catch (e) { console.log('Cancel fail:', e.message); }
    await deleteMachine(mid, uid, true);
    await i.editReply({ embeds: [successEmbed('Đã xoá', mid)] });
  } catch (e) {
    try { await i.editReply({ embeds: [errorEmbed('Lỗi', e.message)] }); } catch {}
  }
}