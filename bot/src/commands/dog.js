import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('dog').setDescription('Anh cho ngau nhien'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      const embed = new EmbedBuilder()
        .setTitle('Cho ne!')
        .setColor(COLORS.primary)
        .setImage(data.message)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong lay duoc anh cho.' });
    }
  }
};