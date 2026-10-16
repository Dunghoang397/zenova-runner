import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { addWarning, getWarnings } from '../lib/moderation.js';
import { logger } from '../lib/logger.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Canh cao thanh vien')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Ly do').setRequired(false).setMaxLength(500)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Khong co ly do';

    if (user.bot) return interaction.editReply({ content: 'Khong the warn bot.', ephemeral: true });

    const warn = addWarning(interaction.guild.id, user.id, interaction.user.id, reason);
    const all = getWarnings(interaction.guild.id, user.id);

    const embed = new EmbedBuilder()
      .setTitle('Da canh cao')
      .setColor(COLORS.warning)
      .addFields(
        { name: 'User', value: user.toString(), inline: true },
        { name: 'Mod', value: interaction.user.toString(), inline: true },
        { name: 'Ly do', value: reason, inline: false },
        { name: 'Tong warn', value: String(all.length), inline: true },
        { name: 'Ma warn', value: warn.id, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    try {
      const dm = await user.createDM();
      await dm.send({ embeds: [new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('Ban da bi canh cao')
        .addFields(
          { name: 'Server', value: interaction.guild.name, inline: true },
          { name: 'Ly do', value: reason, inline: false },
          { name: 'Tong warn', value: String(all.length), inline: true }
        )] });
    } catch {}

    logger.ok(`Warn ${user.tag} boi ${interaction.user.tag}`);
  }
};