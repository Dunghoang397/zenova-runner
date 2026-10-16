// ZENOVA SHOP - Discord Channel Logger
import { EmbedBuilder } from 'discord.js';

let logChannelId = process.env.LOG_CHANNEL_ID || null;

export function setLogChannel(id) {
  logChannelId = id;
}

export function getLogChannel() {
  return logChannelId;
}

export async function logToChannel(client, type, title, description, fields = []) {
  if (!logChannelId) return;
  try {
    const channel = await client.channels.fetch(logChannelId);
    if (!channel) return;

    const colors = {
      info: 0x3b82f6,
      success: 0x10b981,
      warning: 0xf59e0b,
      error: 0xef4444,
      machine: 0x8b5cf6,
      xp: 0xfacc15
    };

    const icons = {
      info: 'i',
      success: 'OK',
      warning: '!!',
      error: 'XX',
      machine: 'PC',
      xp: 'XP'
    };

    const embed = new EmbedBuilder()
      .setTitle((icons[type] || '>>') + ' ' + title)
      .setColor(colors[type] || 0x3b82f6)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop Logger' });

    if (fields.length) embed.addFields(fields);

    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Log channel fail:', e.message);
  }
}