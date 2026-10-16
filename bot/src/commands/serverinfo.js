import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Thong tin server'),

  async execute(interaction) {
    await interaction.deferReply();
    const g = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(`Server: ${g.name}`)
      .setColor(COLORS.primary)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Thanh vien', value: `${g.memberCount}`, inline: true },
        { name: 'Kenh', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Role', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Boosts', value: `${g.premiumSubscriptionCount || 0}`, inline: true },
        { name: 'Tao luc', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};