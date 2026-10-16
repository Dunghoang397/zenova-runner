// ZENOVA SHOP - /infomay - Xem thong tin may
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import { getUserMachine } from '../lib/github.js';
import { COLORS, formatBytes, timeAgo } from '../ui/embeds.js';
import { isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('infomay')
    .setDescription('Xem thong tin may cua ban'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isMember(interaction)) {
      return interaction.editReply({
        embeds: [{
          color: COLORS.danger,
          title: 'Khong co quyen',
          description: 'Ban can role **AI-STV Member** de dung lenh nay.'
        }]
      });
    }

    const machine = await getUserMachine(interaction.user.id);

    if (!machine) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.info)
          .setTitle('BAN CHUA CO MAY')
          .setDescription(
            '```\n' +
            '┌─────────────────────────────────────────┐\n' +
            '│    ZENOVA SHOP  •  CHUA CO MAY          │\n' +
            '└─────────────────────────────────────────┘\n' +
            '```\n' +
            'Ban chua tao may nao.\n\n' +
            'Dung `/taomay` de bat dau!'
          )]
      });
    }

    const m = machine.manifest;
    const totalSize = m?.chunks?.reduce((s, c) => s + c.size, 0) || 0;
    const totalMin = m?.durationMinutes || 360;
    const startDate = m?.startUtc ? new Date(m.startUtc) : new Date(machine.created);
    const endDate = new Date(startDate.getTime() + totalMin * 60000);
    const remainMs = Math.max(0, endDate.getTime() - Date.now());
    const remainH = Math.floor(remainMs / 3600000);
    const remainM = Math.floor((remainMs % 3600000) / 60000);

    let remainText = 'Da het han';
    if (remainMs > 0) remainText = remainH + 'h ' + remainM + 'm';

    const ip = m?.tailscaleIp || '?';
    const user = m?.user || 'runneradmin';
    const pass = m?.password || '(secret)';

    const embed = new EmbedBuilder()
      .setTitle('THONG TIN MAY: ' + machine.id)
      .setColor(COLORS.primary)
      .setDescription(
        '```\n' +
        '┌─────────────────────────────────────────┐\n' +
        '│    ZENOVA SHOP  •  MAY CUA BAN           │\n' +
        '└─────────────────────────────────────────┘\n' +
        '```'
      )
      .addFields(
        { name: '📛 Ten may', value: '`' + machine.id + '`', inline: true },
        { name: '🪟 Windows', value: '`' + (m?.windowsImage || m?.osBuild || '?') + '`', inline: true },
        { name: '⏳ Con lai', value: '`' + remainText + '`', inline: true },
        { name: '🌐 IP Tailscale', value: '`' + ip + '`', inline: true },
        { name: '👤 User', value: '`' + user + '`', inline: true },
        { name: '🔐 Pass', value: '`' + pass + '`', inline: true },
        { name: '💾 Backup', value: '`' + formatBytes(totalSize) + '` (' + machine.chunks + ' chunks)', inline: true },
        { name: '🕐 Tao luc', value: timeAgo(machine.created), inline: true },
        { name: '📅 Ket thuc', value: '<t:' + Math.floor(endDate.getTime() / 1000) + ':R>', inline: true },
        { name: '📡 Cach ket noi', value: '1. Cai **Tailscale**: https://tailscale.com/download\n2. Dang nhap cung tai khoan\n3. Mo `mstsc` → nhap `' + ip + ':3389`\n4. User: `' + user + '`\n5. Pass: `' + pass + '`', inline: false }
      )
      .setFooter({ text: 'Zenova Shop | Xoa may bang /xoamay' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('infomay:refresh')
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('infomay:copy-ip')
        .setLabel('Copy IP')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'refresh') {
      await interaction.deferUpdate();
      const machine = await getUserMachine(interaction.user.id);
      if (!machine) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.info).setDescription('Ban khong con may nao.')],
          components: []
        });
      }

      const m = machine.manifest;
      const totalSize = m?.chunks?.reduce((s, c) => s + c.size, 0) || 0;
      const totalMin = m?.durationMinutes || 360;
      const startDate = m?.startUtc ? new Date(m.startUtc) : new Date(machine.created);
      const endDate = new Date(startDate.getTime() + totalMin * 60000);
      const remainMs = Math.max(0, endDate.getTime() - Date.now());
      const remainH = Math.floor(remainMs / 3600000);
      const remainM = Math.floor((remainMs % 3600000) / 60000);
      let remainText = remainMs > 0 ? remainH + 'h ' + remainM + 'm' : 'Da het han';

      const ip = m?.tailscaleIp || '?';
      const user = m?.user || 'runneradmin';
      const pass = m?.password || '(secret)';

      const embed = new EmbedBuilder()
        .setTitle('THONG TIN MAY: ' + machine.id)
        .setColor(COLORS.primary)
        .setDescription(
          '```\n' +
          '┌─────────────────────────────────────────┐\n' +
          '│    ZENOVA SHOP  •  MAY CUA BAN           │\n' +
          '└─────────────────────────────────────────┘\n' +
          '```'
        )
        .addFields(
          { name: '📛 Ten may', value: '`' + machine.id + '`', inline: true },
          { name: '🪟 Windows', value: '`' + (m?.windowsImage || m?.osBuild || '?') + '`', inline: true },
          { name: '⏳ Con lai', value: '`' + remainText + '`', inline: true },
          { name: '🌐 IP Tailscale', value: '`' + ip + '`', inline: true },
          { name: '👤 User', value: '`' + user + '`', inline: true },
          { name: '🔐 Pass', value: '`' + pass + '`', inline: true },
          { name: '💾 Backup', value: '`' + formatBytes(totalSize) + '` (' + machine.chunks + ' chunks)', inline: true },
          { name: '🕐 Tao luc', value: timeAgo(machine.created), inline: true },
          { name: '📅 Ket thuc', value: '<t:' + Math.floor(endDate.getTime() / 1000) + ':R>', inline: true },
          { name: '📡 Cach ket noi', value: '1. Cai **Tailscale**: https://tailscale.com/download\n2. Dang nhap cung tai khoan\n3. Mo `mstsc` → nhap `' + ip + ':3389`\n4. User: `' + user + '`\n5. Pass: `' + pass + '`', inline: false }
        )
        .setFooter({ text: 'Zenova Shop | Xoa may bang /xoamay' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    if (action === 'copy-ip') {
      await interaction.deferUpdate();
      const machine = await getUserMachine(interaction.user.id);
      const ip = machine?.manifest?.tailscaleIp || '?';
      await interaction.followUp({ content: '📋 IP: `' + ip + '`', ephemeral: true });
    }
  }
};