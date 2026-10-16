import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Thong tin kenh')
    .addChannelOption(o => o.setName('channel').setDescription('Kenh')),

  async execute(interaction) {
    await interaction.deferReply();
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const typeName = {
      [ChannelType.GuildText]: 'Text',
      [ChannelType.GuildVoice]: 'Voice',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement',
      [ChannelType.GuildForum]: 'Forum',
      [ChannelType.GuildStageVoice]: 'Stage'
    }[channel.type] || 'Unknown';

    const embed = new EmbedBuilder()
      .setTitle('Channel: #' + channel.name)
      .setColor(COLORS.primary)
      .addFields(
        { name: 'ID', value: '`' + channel.id + '`', inline: true },
        { name: 'Type', value: typeName, inline: true },
        { name: 'Tao luc', value: '<t:' + Math.floor(channel.createdTimestamp / 1000) + ':R>', inline: true }
      )
      .setTimestamp();
    if ('topic' in channel && channel.topic) embed.addFields({ name: 'Topic', value: channel.topic, inline: false });
    if ('nsfw' in channel) embed.addFields({ name: 'NSFW', value: channel.nsfw ? 'Co' : 'Khong', inline: true });
    if ('rateLimitPerUser' in channel) embed.addFields({ name: 'Slowmode', value: channel.rateLimitPerUser + 's', inline: true });
    await interaction.editReply({ embeds: [embed] });
  }
};