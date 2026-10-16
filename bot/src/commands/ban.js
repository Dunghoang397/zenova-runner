import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { addCase } from '../lib/moderation.js';
import { logger } from '../lib/logger.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban thanh vien')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Ly do').setRequired(false).setMaxLength(500))
    .addIntegerOption(o => o.setName('days').setDescription('Xoa tin nhan (ngay)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Khong co ly do';
    const days = interaction.options.getInteger('days') || 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Khong tim thay member.' });
    if (!member.bannable) return interaction.editReply({ content: 'Khong the ban user nay.' });

    try {
      await member.ban({ reason: `${interaction.user.tag}: ${reason}`, deleteMessageSeconds: days * 86400 });
      addCase(interaction.guild.id, { type: 'ban', userId: user.id, modId: interaction.user.id, reason });
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.danger)
        .setTitle('Da ban')
        .addFields(
          { name: 'User', value: user.tag, inline: true },
          { name: 'Mod', value: interaction.user.tag, inline: true },
          { name: 'Ly do', value: reason, inline: false }
        )] });
      logger.ok(`Ban ${user.tag} boi ${interaction.user.tag}`);
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};