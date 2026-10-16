// ZENOVA SHOP - /taomay
import {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import { dispatchCreate, getUserMachine, waitForWorkflowCompletion } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('taomay')
    .setDescription('Tao may ao Windows moi (1 nguoi 1 may)'),

  async execute(interaction) {
    if (!isMember(interaction)) {
      return interaction.reply({
        embeds: [{ color: COLORS.danger, title: 'Khong co quyen', description: 'Can role **AI-STV Member**.' }],
        ephemeral: true
      });
    }

    if (!isAdmin(interaction)) {
      try {
        const existing = await getUserMachine(interaction.user.id);
        if (existing) {
          const ageMin = (Date.now() - new Date(existing.created).getTime()) / 60000;
          const ageH = Math.floor(ageMin / 60);
          const ageM = Math.floor(ageMin % 60);
          return interaction.reply({
            embeds: [{
              color: COLORS.warning,
              title: 'Ban da co may',
              description: 'Ban dang so huu may **`' + existing.id + '`** (tao ' + ageH + 'h ' + ageM + 'm truoc).\n\n**Luat: 1 nguoi 1 may.**\nXoa may cu bang `/xoamay` truoc.'
            }],
            ephemeral: true
          });
        }
      } catch (e) {
        logger.err('Check may fail: ' + e.message);
      }
    }

    const modal = new ModalBuilder()
      .setCustomId('taomay:modal')
      .setTitle('Tao may - Zenova Shop');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('machine_name')
          .setLabel('Ten may (a-z, 0-9, gach ngang)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(32)
          .setPlaceholder('vd: zenova-01')
      )
    );

    await interaction.showModal(modal);
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'modal') {
      const machineName = interaction.fields.getTextInputValue('machine_name').toLowerCase().replace(/[^a-z0-9\-]/g, '-');

      if (!/^[a-z0-9\-]+$/.test(machineName)) {
        return interaction.reply({ content: 'Ten may khong hop le.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('CHON PHIEN BAN WINDOWS')
        .setColor(COLORS.primary)
        .setDescription(
          '```\n' +
          '+-----------------------------------------+\n' +
          '|    ZENOVA SHOP  -  CHON WINDOWS         |\n' +
          '+-----------------------------------------+\n' +
          '```\n' +
          '**Ten may:** `' + machineName + '`\n' +
          '**Thoi luong:** `6 gio` (mac dinh)\n' +
          '**Do phan giai:** `1920x1080@60`\n\n' +
          'Chon phien ban Windows:'
        )
        .setFooter({ text: 'Zenova Shop | Buoc 2/2' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('taomay:win:' + machineName + ':windows-2022').setLabel('Windows 2022').setEmoji('🪟').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('taomay:win:' + machineName + ':windows-2025').setLabel('Windows 2025').setEmoji('🪟').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('taomay:cancel').setLabel('Huy').setEmoji('❌').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      return;
    }

    if (action === 'cancel') {
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.dark).setDescription('Da huy tao may.')],
        components: []
      });
      return;
    }

    if (action === 'win') {
      const machineName = rest[1];
      const windows = rest[2];

      await interaction.deferUpdate();

      const creating = new EmbedBuilder()
        .setTitle('DANG TAO MAY...')
        .setColor(COLORS.warning)
        .setDescription(
          '```\n' +
          '+-----------------------------------------+\n' +
          '|    ZENOVA SHOP  -  DANG XU LY            |\n' +
          '+-----------------------------------------+\n' +
          '```\n' +
          '**Ten may:** `' + machineName + '`\n' +
          '**Windows:** `' + windows + '`\n' +
          '**Thoi luong:** `6 gio`\n\n' +
          '⏳ Vui long doi 1-3 phut...\n\n' +
          'Bot dang:\n' +
          '1. Gui lenh tao may den GitHub\n' +
          '2. Cho Windows khoi dong\n' +
          '3. Lay thong tin ket noi (IP Tailscale)\n\n' +
          '*Se thong bao qua tin nhan rieng khi xong*'
        )
        .setFooter({ text: 'Zenova Shop' })
        .setTimestamp();

      await interaction.editReply({ embeds: [creating], components: [] });

      try {
        // CHI GUI NHUNG INPUT WORKFLOW CO
        await dispatchCreate({
          machine_id: machineName,
          owner_discord_id: interaction.user.id,
          duration: '6h00m',
          drive_letter: 'X',
          vhd_size_gb: '45',
          windows_image: windows,
          vdd_resolution: '1920x1080@60',
          auto_save_interval_min: '15'
        });
        logger.ok('Workflow dispatched cho may: ' + machineName);
      } catch (e) {
        logger.err('Dispatch fail: ' + e.message);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi gui lenh').setDescription('`' + e.message + '`')]
        });
      }

      // Poll workflow trong background
      waitForWorkflowCompletion(machineName, 300000, 15000).then(async (result) => {
        const user = interaction.user;
        const dmChannel = await user.createDM().catch(() => null);

        if (result.success && result.manifest) {
          const m = result.manifest;
          const totalMin = m.durationMinutes || 360;
          const startDate = m.startUtc ? new Date(m.startUtc) : new Date();
          const endDate = new Date(startDate.getTime() + totalMin * 60000);

          const successEmbed = new EmbedBuilder()
            .setTitle('TAO MAY THANH CONG!')
            .setColor(COLORS.success)
            .setDescription(
              '```\n' +
              '+-----------------------------------------+\n' +
              '|    ZENOVA SHOP  -  SAN SANG KET NOI      |\n' +
              '+-----------------------------------------+\n' +
              '```\n' +
              'May **' + machineName + '** da san sang!'
            )
            .addFields(
              { name: 'Ten may', value: '`' + machineName + '`', inline: true },
              { name: 'Windows', value: '`' + (m.windowsImage || windows) + '`', inline: true },
              { name: 'Thoi luong', value: '`' + totalMin + ' phut`', inline: true },
              { name: 'IP Tailscale', value: '`' + (m.tailscaleIp || '?') + '`', inline: true },
              { name: 'User', value: '`' + (m.user || 'runneradmin') + '`', inline: true },
              { name: 'Pass', value: '`' + (m.password || '(secret)') + '`', inline: true },
              { name: 'Ket thuc', value: '<t:' + Math.floor(endDate.getTime() / 1000) + ':R>', inline: true },
              { name: 'Cach ket noi', value: '1. Cai **Tailscale**\n2. Mo `mstsc` nhap `' + (m.tailscaleIp || '?') + ':3389`\n3. User: `' + (m.user || 'runneradmin') + '`\n4. Pass: `' + (m.password || '(secret)') + '`', inline: false }
            )
            .setFooter({ text: 'Zenova Shop | ' + new Date().toLocaleString('vi-VN') })
            .setTimestamp();

          try { await interaction.editReply({ embeds: [successEmbed], components: [] }); } catch (e) {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [successEmbed] }); logger.ok('DM thanh cong'); } catch (e) {}
          }
        } else {
          const failEmbed = new EmbedBuilder()
            .setTitle('TAO MAY THAT BAI')
            .setColor(COLORS.danger)
            .setDescription('Loi: `' + (result.error || 'Khong ro') + '`' + (result.runUrl ? '\n[Xem log](' + result.runUrl + ')' : ''))
            .setTimestamp();
          try { await interaction.editReply({ embeds: [failEmbed], components: [] }); } catch (e) {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [failEmbed] }); } catch (e) {}
          }
        }
      }).catch(async (e) => {
        logger.err('Wait workflow fail: ' + e.message);
        try {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi he thong').setDescription('`' + e.message + '`')]
          });
        } catch (e2) {}
      });

      return;
    }
  }
};