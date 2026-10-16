import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Hon ai do')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const embed = new EmbedBuilder()
      .setColor(COLORS.pink)
      .setDescription('**' + interaction.user.username + '** hon **' + user.username + '**!')
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};