import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { addCase } from '../lib/moderation.js';
import { logger } from '../lib/logger.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick thanh vien')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Ly do').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Khong co ly do';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.editReply({ content: 'Khong tim thay member.' });
    if (!member.kickable) return interaction.editReply({ content: 'Khong the kick user nay.' });

    try {
      await member.kick(`${interaction.user.tag}: ${reason}`);
      addCase(interaction.guild.id, { type: 'kick', userId: user.id, modId: interaction.user.id, reason });
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.danger)
        .setTitle('Da kick')
        .addFields(
          { name: 'User', value: user.tag, inline: true },
          { name: 'Mod', value: interaction.user.tag, inline: true },
          { name: 'Ly do', value: reason, inline: false }
        )] });
      logger.ok(`Kick ${user.tag} boi ${interaction.user.tag}`);
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};