// ZENOVA - /info
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUserMachine } from '../lib/github.js';
import { COLORS, formatBytes, timeAgo } from '../ui/embeds.js';
import { isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('View your machine info'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!isMember(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'No Permission', description: 'Need role **AI-STV Member**.' }]
      });
    }
    await showInfo(interaction);
  },

  async handleComponent(interaction, rest) {
    await interaction.deferUpdate();
    if (rest[0] === 'refresh') await showInfo(interaction);
  }
};

async function showInfo(interaction) {
  try {
    const machine = await getUserMachine(interaction.user.id);
    if (!machine) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(COLORS.info).setTitle('NO MACHINE').setDescription('Create one with `/create`')],
        components: []
      });
    }

    const m = machine.manifest;
    const totalMin = m?.durationMinutes || 360;
    const startDate = m?.startUtc ? new Date(m.startUtc) : new Date(machine.created);
    const endDate = new Date(startDate.getTime() + totalMin * 60000);
    const remainMs = Math.max(0, endDate.getTime() - Date.now());
    const remainH = Math.floor(remainMs / 3600000);
    const remainM = Math.floor((remainMs % 3600000) / 60000);
    const remainText = remainMs > 0 ? remainH + 'h ' + remainM + 'm' : 'Restarting...';

    const ip = m?.tailscaleIp || '?';
    const user = m?.user || 'runneradmin';
    const pass = m?.password || '(secret)';
    const pct = Math.max(0, Math.min(100, (remainMs / (totalMin * 60000)) * 100));
    const filled = Math.round(pct / 5);
    const bar = '`' + '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled) + '`';

    const embed = new EmbedBuilder()
      .setTitle('MACHINE: ' + machine.id)
      .setColor(COLORS.primary)
      .setDescription('```\n+-----------------------------------------+\n|    ZENOVA  -  YOUR MACHINE               |\n+-----------------------------------------+\n```')
      .addFields(
        { name: 'Machine', value: '`' + machine.id + '`', inline: true },
        { name: 'Windows', value: '`' + (m?.windowsImage || '?') + '`', inline: true },
        { name: 'Mode', value: '`' + (m?.windowsMode || 'lite') + '`', inline: true },
        { name: 'Remaining', value: '`' + remainText + '`', inline: true },
        { name: 'Progress', value: bar + ' ' + Math.round(pct) + '%', inline: false },
        { name: 'IP (Tailscale)', value: '`' + ip + '`', inline: true },
        { name: 'DuckDNS', value: m?.duckdnsHost ? '`' + m.duckdnsHost + '`' : '`not set`', inline: true },
        { name: 'User', value: '`' + user + '`', inline: true },
        { name: 'Password', value: '`' + pass + '`', inline: true },
        { name: 'Created', value: timeAgo(machine.created), inline: true },
        { name: 'Expires', value: '<t:' + Math.floor(endDate.getTime() / 1000) + ':R>', inline: true },
        { name: 'How to connect', value: '1. Install **Tailscale**\n2. Open `mstsc` or **Microsoft Remote Desktop**\n3. Connect to `' + ip + ':3389`\n4. User: `' + user + '` | Pass: `' + pass + '`', inline: false },
        { name: 'Web Panel', value: 'http://' + ip + ':8080/', inline: false }
      )
      .setFooter({ text: 'Zenova v17 | Delete with /delete' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('info:refresh').setLabel('Refresh').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Error').setDescription('`' + e.message + '`')],
      components: []
    });
  }
}