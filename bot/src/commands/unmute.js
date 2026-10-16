import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Bo timeout')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.editReply({ content: 'Khong tim thay member.' });

    try {
      await member.timeout(null);
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.success)
        .setDescription(`Da bo timeout cho ${user.tag}.`)] });
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};