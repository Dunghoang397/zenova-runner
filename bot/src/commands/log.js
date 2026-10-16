// ZENOVA SHOP - /log - Xem log cac run (ADMIN)
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder
} from 'discord.js';
import { listRecentRuns, getRunLogTail } from '../lib/github.js';
import { COLORS, machineStatusEmoji } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('[ADMIN] Xem log cac run gan day'),

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

    if (rest[0] === 'select-run') {
      const runId = parseInt(interaction.values[0], 10);
      await interaction.deferUpdate();

      const logText = await getRunLogTail(runId, 100);
      const truncated = logText.length > 1800
        ? '...' + logText.slice(-1800)
        : logText;

      const embed = new EmbedBuilder()
        .setTitle(`Log run #${runId}`)
        .setColor(COLORS.dark)
        .setDescription(`\`\`\`\n${truncated}\n\`\`\``)
        .setFooter({ text: `Tong ${logText.length} ky tu - chi hien thi 1800 cuoi` });

      await interaction.editReply({ embeds: [embed], components: [] });
    }
  }
};

async function showMenu(interaction) {
  try {
    const runs = await listRecentRuns(15);

    if (!runs.length) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(COLORS.info).setDescription('Chua co run nao.')]
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Chon run de xem log')
      .setColor(COLORS.primary)
      .setDescription('Chon tu menu ben duoi.');

    const select = new StringSelectMenuBuilder()
      .setCustomId('log:select-run')
      .setPlaceholder('Chon run')
      .addOptions(runs.slice(0, 25).map(r => {
        const emoji = r.conclusion ? machineStatusEmoji(r.conclusion) : machineStatusEmoji(r.status);
        return {
          label: `Run #${r.number}`,
          description: `${emoji} ${r.conclusion || r.status} | ${new Date(r.started).toLocaleString('vi-VN')}`,
          value: `${r.id}`
        };
      }));

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription(`\`${e.message}\``)]
    });
  }
}