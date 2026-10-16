// ZENOVA SHOP - /ping - Kiem tra do tre bot
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Kiem tra do tre bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Dang do...', fetchReply: true });
    const rtt = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = interaction.client.ws.ping;

    const quality = rtt < 100 ? 'Tot' : rtt < 300 ? 'On' : 'Cham';
    const color = rtt < 200 ? 0x10b981 : 0xf59e0b;

    const embed = new EmbedBuilder()
      .setTitle('Pong!')
      .setColor(color)
      .addFields(
        { name: 'RTT', value: `\`${rtt}ms\``, inline: true },
        { name: 'WebSocket', value: `\`${ws}ms\``, inline: true },
        { name: 'Chat luong', value: quality, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop' });

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};