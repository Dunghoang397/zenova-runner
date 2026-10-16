import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('joke').setDescription('Truyen cuoi'),

  async execute(interaction) {
    await interaction.deferReply();
    try {
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await res.json();
      const embed = new EmbedBuilder()
        .setTitle('Truyen cuoi')
        .setColor(COLORS.gold)
        .setDescription(data.setup + '\n\n||' + data.punchline + '||')
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong lay duoc truyen cuoi.' });
    }
  }
};