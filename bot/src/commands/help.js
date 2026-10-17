import { SlashCommandBuilder } from 'discord.js';
import { helpEmbed } from '../ui/embeds.js';

export const data = new SlashCommandBuilder().setName('help').setDescription('📖 Danh sách lệnh');

export async function execute(i) {
  await i.deferReply({ ephemeral: true });
  await i.editReply({ embeds: [helpEmbed()] });
}
