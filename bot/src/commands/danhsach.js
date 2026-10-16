// ZENOVA SHOP - /danhsach - Xem toan bo may (ADMIN)
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { listMachines, listActiveRuns } from '../lib/github.js';
import { COLORS, formatBytes, timeAgo, machineStatusEmoji } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('danhsach')
    .setDescription('[ADMIN] Danh sach toan bo may'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{
          color: COLORS.danger,
          title: 'Chi Admin',
          description: 'Lenh nay chi danh cho role **AI-STV Admin** hoac owner server.'
        }],
        ephemeral: true
      });
    }
    await interaction.deferReply();
    await refresh(interaction);
  },

  async handleComponent(interaction, rest) {
    await interaction.deferUpdate();

    if (!isAdmin(interaction)) {
      return interaction.editReply({ content: 'Chi Admin', ephemeral: true });
    }
    if (rest[0] === 'refresh') {
      await interaction.deferUpdate();
      await refresh(interaction, true);
    }
  }
};

async function refresh(interaction, isUpdate = false) {
  try {
    const [machines, runs] = await Promise.all([listMachines(), listActiveRuns()]);

    const embed = new EmbedBuilder()
      .setTitle('ZENOVA - DANH SACH MAY')
      .setColor(COLORS.primary)
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop | Admin Panel' });

    const desc = [];

    if (runs.length) {
      desc.push(`**Dang chay: ${runs.length}**`);
      runs.slice(0, 8).forEach(r => {
        desc.push(`${machineStatusEmoji(r.status)} \`Run #${r.number}\` - [log](${r.url})`);
      });
    }

    if (machines.length) {
      desc.push('');
      desc.push(`**Co backup: ${machines.length}**`);
      machines.slice(0, 10).forEach(m => {
        desc.push(`PC \`${m.id}\` - ${m.chunks} chunks (${formatBytes(m.totalSize)}) - ${timeAgo(m.updated)}`);
      });
    }

    if (!runs.length && !machines.length) {
      desc.push('Chua co may nao.');
    }

    embed.setDescription(desc.join('\n'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('danhsach:refresh')
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('stop:manage')
        .setLabel('Quan ly stop')
        .setEmoji('🛑')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('status:view')
        .setLabel('Status')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [{ color: COLORS.danger, title: 'Loi', description: `\`${e.message}\`` }],
      components: []
    });
  }
}