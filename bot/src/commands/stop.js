// ZENOVA SHOP - /stop - Huy run dang chay (ADMIN)
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder
} from 'discord.js';
import { listActiveRuns, cancelRun } from '../lib/github.js';
import { COLORS, machineStatusEmoji } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('[ADMIN] Huy run dang chay'),

  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({
        embeds: [{ color: COLORS.danger, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }],
        ephemeral: true
      });
    }
    await interaction.deferReply({ ephemeral: true });
    await showMenu(interaction);
  },

  async handleComponent(interaction, rest) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'Chi Admin', ephemeral: true });
    }

    const action = rest[0];

    if (action === 'manage') {
      await interaction.deferReply({ ephemeral: true });
      await showMenu(interaction);
      return;
    }

    if (action === 'select-run') {
      const runId = interaction.values[0];
      await interaction.deferUpdate();
      try {
        await cancelRun(parseInt(runId, 10));
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('Da cancel')
            .setDescription(`Run **#${runId}** da duoc huy.\n\n**Luu y:** Cancel se **khong** save state tu dong.`)],
          components: []
        });
      } catch (e) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription(`\`${e.message}\``)],
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
      .setDescription(`Co **${runs.length}** run dang chay.\nChon run can dung tu menu ben duoi.`)
      .setFooter({ text: 'Cancel se KHONG save state' });

    const select = new StringSelectMenuBuilder()
      .setCustomId('stop:select-run')
      .setPlaceholder('Chon run can dung')
      .addOptions(runs.slice(0, 25).map(r => ({
        label: `Run #${r.number}`,
        description: `${machineStatusEmoji(r.status)} ${r.status} | Bat dau: ${new Date(r.started).toLocaleString('vi-VN')}`,
        value: `${r.id}`
      })));

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription(`\`${e.message}\``)]
    });
  }
}