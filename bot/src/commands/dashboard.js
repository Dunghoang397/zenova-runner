import { SlashCommandBuilder } from 'discord.js';
import { listMachines, listRecentRuns, getStateJson } from '../lib/github.js';
import { dashboardEmbed, errorEmbed } from '../ui/embeds.js';

export const data = new SlashCommandBuilder().setName('dashboard').setDescription('📊 Dashboard admin');

export async function execute(i) {
  try {
    await i.deferReply({ ephemeral: true });
    const [machines, runs] = await Promise.all([listMachines(), listRecentRuns(10)]);
    const activeRuns = runs.filter(r => ['in_progress','queued'].includes(r.status));
    const enriched = [];
    for (const m of machines.slice(0, 20)) {
      const s = await getStateJson(m.id);
      enriched.push({ id: m.id, state: s });
    }
    const embed = dashboardEmbed(enriched, activeRuns);
    await i.editReply({ embeds: [embed] });
  } catch (e) {
    try { await i.editReply({ embeds: [errorEmbed('Lỗi', e.message)] }); } catch {}
  }
}
