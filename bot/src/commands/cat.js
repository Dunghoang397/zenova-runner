import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('cat').setDescription('Anh meo ngau nhien'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      const embed = new EmbedBuilder()
        .setTitle('Meo ne!')
        .setColor(COLORS.primary)
        .setImage(data[0].url)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong lay duoc anh meo.' });
    }
  }
};