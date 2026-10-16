import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shorturl')
    .setDescription('Rut gon link')
    .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const url = interaction.options.getString('url');
    try {
      const res = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url));
      const short = await res.text();
      const embed = new EmbedBuilder()
        .setTitle('Link rut gon')
        .setColor(COLORS.success)
        .setDescription('**Goc:** ' + url + '\n**Rut gon:** ' + short)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong rut gon duoc.' });
    }
  }
};