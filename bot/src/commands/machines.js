import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listMachines, getStateJson } from '../lib/github.js';

export const data = new SlashCommandBuilder()
  .setName('machines')
  .setDescription('Xem tất cả máy')
  .addIntegerOption(opt => opt.setName('limit').setDescription('Số máy hiển thị').setRequired(false));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const limit = interaction.options.getInteger('limit') || 10;
  const machines = await listMachines();
  if (machines.length === 0) {
    return interaction.editReply({ content: '📭 Không có máy nào.' });
  }
  const embed = new EmbedBuilder()
    .setTitle(`📋 Danh sách máy (${Math.min(limit, machines.length)}/${machines.length})`)
    .setColor(0x38bdf8);
  for (const m of machines.slice(0, limit)) {
    const s = await getStateJson(m.id);
    const status = s?.ready ? '🟢' : '🟡';
    const owner = s?.ownerDiscordId ? `<@${s.ownerDiscordId}>` : 'Không rõ';
    embed.addFields({
      name: `${status} ${m.id}`,
      value: `👤 ${owner} | 🌐 ${s?.tailscaleIp || 'N/A'}`,
      inline: false
    });
  }
  await interaction.editReply({ embeds: [embed] });
}
