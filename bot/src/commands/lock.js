import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Khoa/mo kenh')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addBooleanOption(o => o.setName('unlock').setDescription('Mo kenh?')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const unlock = interaction.options.getBoolean('unlock') || false;
    const everyone = interaction.guild.roles.everyone;

    try {
      await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: unlock ? null : false });
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(unlock ? COLORS.success : COLORS.warning)
        .setDescription(unlock ? 'Da mo kenh.' : 'Da khoa kenh.')] });
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};