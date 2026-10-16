import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { logger } from '../lib/logger.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Xoa hang loat tin nhan')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('So tin (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Chi xoa cua user')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    try {
      const messages = await interaction.channel.messages.fetch({ limit: amount });
      let toDelete = messages;
      if (user) toDelete = messages.filter(m => m.author.id === user.id);
      const deleted = await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.success)
        .setDescription(`Da xoa ${deleted.size} tin nhan${user ? ' cua ' + user.tag : ''}.`)] });
      logger.ok(`Purge ${deleted.size} boi ${interaction.user.tag}`);
    } catch (e) {
      await interaction.editReply({ content: `Loi: ${e.message}` });
    }
  }
};