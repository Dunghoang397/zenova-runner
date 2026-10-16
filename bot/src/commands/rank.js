import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, xpToLevel, xpForNextLevel } from '../lib/xp.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Xem cap do XP')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung')),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    const u = getUser(user.id);
    const level = xpToLevel(u.xp);
    const progress = xpForNextLevel(u.xp);

    const bar = '█'.repeat(Math.floor((progress.current / progress.needed) * 10)) + '░'.repeat(10 - Math.floor((progress.current / progress.needed) * 10));

    const embed = new EmbedBuilder()
      .setTitle(`Rank: ${user.username}`)
      .setColor(COLORS.primary)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Level', value: `**${level}**`, inline: true },
        { name: 'XP', value: `${u.xp}`, inline: true },
        { name: 'Tin nhan', value: `${u.messages || 0}`, inline: true },
        { name: 'Tien do', value: `\`${bar}\` ${progress.current}/${progress.needed}`, inline: false }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};