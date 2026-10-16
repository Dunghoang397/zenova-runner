import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Tat ai do')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const embed = new EmbedBuilder()
      .setColor(COLORS.danger)
      .setDescription('**' + interaction.user.username + '** tat **' + user.username + '** mot phat!')
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};