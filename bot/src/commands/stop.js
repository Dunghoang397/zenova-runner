// ZENOVA SHOP - /stop
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { listActiveRuns, cancelRun } from '../lib/github.js';
import { COLORS, machineStatusEmoji } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('[ADMIN] Huy run dang chay'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }]
      });
    }
    await showMenu(interaction);
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'manage') {
      await interaction.deferReply({ ephemeral: true });
      if (!isAdmin(interaction)) {
        return interaction.editReply({
          embeds: [{ color: COLORS.danger, title: 'Chi Admin', description: 'Khong co quyen.' }]
        });
      }
      await showMenu(interaction);
      return;
    }

    if (action === 'select-run') {
      await interaction.deferUpdate();
      const runId = interaction.values[0];
      try {
        await cancelRun(parseInt(runId, 10));
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.success).setTitle('Da cancel').setDescription('Run **#' + runId + '** da duoc huy.')],
          components: []
        });
      } catch (e) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription('`' + e.message + '`')],
          components: []
        });
      }
    }
  }
};

async function showMenu(interaction) {
  try {
    const runs = await listActiveRuns();
    if (!runs.length) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(COLORS.info).setDescription('Khong co run nao dang chay.')]
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('Quan ly run')
      .setColor(COLORS.danger)
      .setDescription('Co **' + runs.length + '** run dang chay.');

    const select = new StringSelectMenuBuilder()
      .setCustomId('stop:select-run')
      .setPlaceholder('Chon run can dung')
      .addOptions(runs.slice(0, 25).map(r => ({
        label: 'Run #' + r.number,
        description: machineStatusEmoji(r.status) + ' ' + r.status,
        value: String(r.id)
      })));

    await interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
  } catch (e) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription('`' + e.message + '`')]
    });
  }
}