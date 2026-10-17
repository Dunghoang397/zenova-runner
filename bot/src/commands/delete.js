import { SlashCommandBuilder } from 'discord.js';
import { deleteMachine, isMachineOwner } from '../lib/github.js';

export const data = new SlashCommandBuilder()
  .setName('delete')
  .setDescription('Xoá máy của bạn')
  .addStringOption(opt => opt.setName('machine_id').setDescription('Tên máy').setRequired(true));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  const machineId = interaction.options.getString('machine_id');
  const userId = interaction.user.id;
  
  const isOwner = await isMachineOwner(userId, machineId);
  if (!isOwner) {
    return interaction.editReply({ content: '❌ Bạn không phải chủ máy này.' });
  }
  
  await deleteMachine(machineId, userId, true);
  await interaction.editReply({ content: `✅ Đã xoá máy \`${machineId}\`` });
}
