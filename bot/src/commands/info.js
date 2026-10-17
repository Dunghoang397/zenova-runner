import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listMachines, listRecentRuns } from '../lib/github.js';

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Thông tin bot');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const [machines, runs] = await Promise.all([listMachines(), listRecentRuns(5)]);
  const activeRuns = runs.filter(r => r.status === 'in_progress' || r.status === 'queued');
  const embed = new EmbedBuilder()
    .setTitle('🤖 Zenova Bot Info')
    .setColor(0x8b5cf6)
    .addFields(
      { name: '📊 Tổng máy', value: String(machines.length), inline: true },
      { name: '🟢 Đang chạy', value: String(activeRuns.length), inline: true },
      { name: '⏱️ Uptime', value: `${Math.floor(process.uptime() / 60)} phút`, inline: true },
      { name: '💾 RAM', value: `${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true },
      { name: '📦 Node', value: process.version, inline: true }
    )
    .setTimestamp();
  await interaction.editReply({ embeds: [embed] });
}
