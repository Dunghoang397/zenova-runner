// ZENOVA SHOP - /status - Trang thai he thong (ADMIN)
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { listMachines, listActiveRuns } from '../lib/github.js';
import { formatBytes, COLORS } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('[ADMIN] Trang thai he thong'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }]
      });
    }

    await showStatus(interaction);
  },

  async handleComponent(interaction, rest) {
    // deferUpdate CHI 1 LAN
    await interaction.deferUpdate();

    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'Chi Admin', description: 'Khong co quyen.' }],
        components: []
      });
    }

    if (rest[0] === 'view') {
      await showStatus(interaction);
    }
  }
};

async function showStatus(interaction) {
  try {
    const [machines, runs] = await Promise.all([listMachines(), listActiveRuns()]);
    const totalSize = machines.reduce((s, m) => s + m.totalSize, 0);
    const totalChunks = machines.reduce((s, m) => s + m.chunks, 0);

    const embed = new EmbedBuilder()
      .setTitle('ZENOVA - SYSTEM STATUS')
      .setColor(COLORS.info)
      .addFields(
        { name: 'Run dang chay', value: '**' + runs.length + '**', inline: true },
        { name: 'May co backup', value: '**' + machines.length + '**', inline: true },
        { name: 'Tong chunks', value: '**' + totalChunks + '**', inline: true },
        { name: 'Tong dung luong', value: '**' + formatBytes(totalSize) + '**', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop | System Status' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('status:view')
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('danhsach:refresh')
        .setLabel('Danh sach')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription('`' + e.message + '`')]
    });
  }
}