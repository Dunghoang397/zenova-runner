// ZENOVA - /list
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { listMachines, listActiveRuns } from '../lib/github.js';
import { COLORS, formatBytes, timeAgo } from '../ui/embeds.js';
import { isAdmin } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('[ADMIN] List all machines'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'Admin Only', description: 'Need **AI-STV Admin** role.' }]
      });
    }
    await showList(interaction);
  },

  async handleComponent(interaction, rest) {
    await interaction.deferUpdate();
    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'Admin Only', description: 'No permission.' }],
        components: []
      });
    }
    if (rest[0] === 'refresh') {
      await showList(interaction);
    }
  }
};

async function showList(interaction) {
  try {
    const [machines, runs] = await Promise.all([listMachines(), listActiveRuns()]);

    const embed = new EmbedBuilder()
      .setTitle('ALL MACHINES')
      .setColor(COLORS.primary)
      .setTimestamp()
      .setFooter({ text: 'Zenova v17 | Admin Panel' });

    const desc = [];
    if (runs.length) {
      desc.push('**Running: ' + runs.length + '**');
      runs.slice(0, 8).forEach(r => {
        desc.push('\uD83D\uDD25 `Run #' + r.number + '` - [log](' + r.url + ')');
      });
    }
    if (machines.length) {
      desc.push('');
      desc.push('**With backup: ' + machines.length + '**');
      machines.slice(0, 10).forEach(m => {
        desc.push('\uD83D\uDCBE `' + m.id + '` - ' + timeAgo(m.updated));
      });
    }
    if (!runs.length && !machines.length) desc.push('No machines.');

    embed.setDescription(desc.join('\n'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('list:refresh').setLabel('Refresh').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [{ color: COLORS.danger, title: 'Error', description: '`' + e.message + '`' }],
      components: []
    });
  }
}