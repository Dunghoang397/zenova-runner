import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder().setName('serverstats').setDescription('Thong ke server'),

  async execute(interaction) {
    await interaction.deferReply();
    const g = interaction.guild;
    const members = await g.members.fetch();
    const bots = members.filter(m => m.user.bot).size;
    const humans = members.size - bots;
    const online = members.filter(m => m.presence?.status !== 'offline').size;

    const embed = new EmbedBuilder()
      .setTitle('Thong ke: ' + g.name)
      .setColor(COLORS.primary)
      .setThumbnail(g.iconURL())
      .addFields(
        { name: 'Thanh vien', value: '**' + members.size + '** (' + humans + ' nguoi, ' + bots + ' bot)', inline: true },
        { name: 'Online', value: '**' + online + '**', inline: true },
        { name: 'Kenh', value: '**' + g.channels.cache.size + '**', inline: true },
        { name: 'Role', value: '**' + g.roles.cache.size + '**', inline: true },
        { name: 'Emoji', value: '**' + g.emojis.cache.size + '**', inline: true },
        { name: 'Boost', value: '**' + (g.premiumSubscriptionCount || 0) + '** (Lv.' + g.premiumTier + ')', inline: true }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};