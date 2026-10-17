import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listMachines, getStateJson } from '../lib/github.js';
import { logger } from '../lib/logger.js';

export const data = new SlashCommandBuilder()
  .setName('mymachine')
  .setDescription('Xem máy của bạn');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  const userId = interaction.user.id;
  const machines = await listMachines();
  
  let userMachine = null;
  for (const m of machines) {
    const state = await getStateJson(m.id);
    if (state && state.ownerDiscordId === userId) {
      userMachine = { id: m.id, state };
      break;
    }
  }
  
  if (!userMachine) {
    return interaction.editReply({
      content: '❌ Bạn chưa có máy nào. Dùng `/create` để tạo.'
    });
  }
  
  const s = userMachine.state;
  const embed = new EmbedBuilder()
    .setTitle(`🖥️ Máy của ${interaction.user.username}`)
    .setColor(s.ready ? 0x10b981 : 0xf59e0b)
    .addFields(
      { name: '🏷️ Tên máy', value: userMachine.id, inline: true },
      { name: '📊 Trạng thái', value: s.ready ? '✅ Sẵn sàng' : '⏳ Đang khởi tạo', inline: true },
      { name: '🌐 IP', value: s.tailscaleIp || 'N/A', inline: true },
      { name: '👤 User', value: s.user || 'runneradmin', inline: true },
      { name: '🔐 Pass', value: s.password || '(secret)', inline: true },
      { name: '🖥️ RDP', value: s.tailscaleIp ? `${s.tailscaleIp}:3389` : 'N/A', inline: false }
    )
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
}
