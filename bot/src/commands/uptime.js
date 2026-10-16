// ZENOVA SHOP - /uptime - Thoi gian bot chay
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Xem bot da chay bao lau'),

  async execute(interaction) {
    const uptimeMs = interaction.client.uptime;
    const days = Math.floor(uptimeMs / 86400000);
    const hours = Math.floor((uptimeMs % 86400000) / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const seconds = Math.floor((uptimeMs % 60000) / 1000);

    const parts = [];
    if (days) parts.push(`${days} ngay`);
    if (hours) parts.push(`${hours} gio`);
    if (minutes) parts.push(`${minutes} phut`);
    if (seconds) parts.push(`${seconds} giay`);

    const embed = new EmbedBuilder()
      .setTitle('Bot Uptime')
      .setColor(0x3b82f6)
      .setDescription(`**${parts.join(' ') || '0 giay'}**`)
      .addFields(
        { name: 'Bat dau', value: `<t:${Math.floor((Date.now() - uptimeMs) / 1000)}:R>`, inline: true },
        { name: 'Tong', value: `\`${Math.floor(uptimeMs / 1000)}s\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop' });

    await interaction.reply({ embeds: [embed] });
  }
};