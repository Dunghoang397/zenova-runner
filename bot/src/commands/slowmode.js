import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Dat slow mode cho kenh')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Giay (0 = tat)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.success)
        .setDescription(seconds === 0 ? 'Da tat slow mode.' : `Da dat slow mode ${seconds}s.`)] });
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};