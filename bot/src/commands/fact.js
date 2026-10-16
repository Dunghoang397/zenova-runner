import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('fact').setDescription('Su that thu vi'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
      const data = await res.json();
      const embed = new EmbedBuilder()
        .setTitle('Su that thu vi')
        .setColor(COLORS.info)
        .setDescription(data.text)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong lay duoc fact.' });
    }
  }
};