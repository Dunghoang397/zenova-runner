import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout thanh vien')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Phut (1-10080)').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption(o => o.setName('reason').setDescription('Ly do').setMaxLength(500)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'Khong co ly do';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.editReply({ content: 'Khong tim thay member.' });

    try {
      await member.timeout(minutes * 60000, `${interaction.user.tag}: ${reason}`);
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('Da timeout')
        .addFields(
          { name: 'User', value: user.tag, inline: true },
          { name: 'Thoi gian', value: `${minutes} phut`, inline: true },
          { name: 'Ly do', value: reason, inline: false }
        )] });
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};