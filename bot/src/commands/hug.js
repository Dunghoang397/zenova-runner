import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Om ai do')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const embed = new EmbedBuilder()
      .setColor(COLORS.pink)
      .setDescription('**' + interaction.user.username + '** om **' + user.username + '** that chat!')
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};