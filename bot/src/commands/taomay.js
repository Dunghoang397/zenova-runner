// ZENOVA SHOP - /taomay v14 ULTRA (progress bar + live update)
import {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import { dispatchCreate, getUserMachine, waitForWorkflowCompletion } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

function progressBar(pct) {
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  return '`' + '▰'.repeat(filled) + '▱'.repeat(empty) + '` **' + Math.round(pct) + '%**';
}

function timelineStep(state) {
  const s = state?.status || 'starting';
  const ready = state?.ready === true;
  return [
    ready ? '**[1/5]** ' + String.fromCharCode(9989) + ' Khoi tao workflow' : '**[1/5]** ' + String.fromCharCode(128993) + ' Khoi tao workflow',
    ready ? '**[2/5]** ' + String.fromCharCode(9989) + ' Cai dat Windows + Lite' : '**[2/5]** ' + String.fromCharCode(128993) + ' Cai dat Windows + Lite',
    ready ? '**[3/5]** ' + String.fromCharCode(9989) + ' Cau hinh RDP + Firewall' : '**[3/5]** ' + String.fromCharCode(128993) + ' Cau hinh RDP + Firewall',
    ready ? '**[4/5]** ' + String.fromCharCode(9989) + ' Ket noi Tailscale' : '**[4/5]** ' + String.fromCharCode(128993) + ' Ket noi Tailscale',
    ready ? '**[5/5]** ' + String.fromCharCode(9989) + ' Tao User + Publish State' : '**[5/5]** ' + String.fromCharCode(128993) + ' Tao User + Publish State'
  ].join('\n');
}

export default {
  data: new SlashCommandBuilder()
    .setName('taomay')
    .setDescription('Tao may ao Windows moi (1 nguoi 1 may)'),

  async execute(interaction) {
    if (!isMember(interaction)) {
      return interaction.reply({
        embeds: [{
          color: COLORS.danger,
          title: 'Khong co quyen',
          description: 'Ban can role **AI-STV Member** de dung lenh nay.'
        }],
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
          '**Thoi luong:** `6 gio`\n' +
          '**Do phan giai:** `1920x1080@60`\n\n' +
          'Chon phien ban Windows:'
        )
        .setFooter({ text: 'Buoc 2/2' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('taomay:win:' + machineName + ':windows-2022').setLabel('Windows 2022').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('taomay:win:' + machineName + ':windows-2025').setLabel('Windows 2025').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('taomay:cancel').setLabel('Huy').setStyle(ButtonStyle.Danger)
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
      const startTime = Date.now();

      await interaction.deferUpdate();

      const buildEmbed = (pct, status, attempts) => new EmbedBuilder()
        .setTitle('DANG TAO MAY')
        .setColor(COLORS.warning)
        .setDescription(
          '```\n' +
          '+-----------------------------------------+\n' +
          '|    ZENOVA SHOP  -  PROCESSING            |\n' +
          '+-----------------------------------------+\n' +
          '```'
        )
        .addFields(
          { name: 'Ten may', value: '`' + machineName + '`', inline: true },
          { name: 'Windows', value: '`' + windows + '`', inline: true },
          { name: 'Thoi gian', value: '`' + Math.floor((Date.now() - startTime) / 1000) + 's`', inline: true },
          { name: 'Tien do', value: progressBar(pct), inline: false },
          { name: 'Cac buoc', value: timelineStep({ status, ready: pct >= 100 }), inline: false },
          { name: 'Trang thai', value: status || 'Dang xu ly...', inline: false }
        )
        .setFooter({ text: 'Bot se DM khi xong' })
        .setTimestamp();

      await interaction.editReply({ embeds: [buildEmbed(5, 'Gui lenh den GitHub...')], components: [] });

      try {
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
        logger.ok('Da dispatch: ' + machineName);
      } catch (e) {
        logger.err('Dispatch fail: ' + e.message);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription('`' + e.message + '`')]
        });
      }

      // Progress updates moi 30s
      let progressTimer = null;
      let lastPct = 5;

      progressTimer = setInterval(async () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(95, 5 + (elapsed / 300) * 90);
        lastPct = pct;
        try {
          await interaction.editReply({ embeds: [buildEmbed(pct, 'Dang setup Windows + Tailscale...')] });
        } catch {}
      }, 30000);

      // Cho state.json
      waitForWorkflowCompletion(machineName, 600000, 8000).then(async (result) => {
        if (progressTimer) clearInterval(progressTimer);

        const user = interaction.user;
        const dmChannel = await user.createDM().catch(() => null);

        if (result.success && result.manifest) {
          const m = result.manifest;
          const totalMin = m.durationMinutes || 360;
          const startDate = m.startUtc ? new Date(m.startUtc) : new Date();
          const endDate = new Date(startDate.getTime() + totalMin * 60000);

          const successEmbed = new EmbedBuilder()
            .setTitle('TAO MAY THANH CONG')
            .setColor(COLORS.success)
            .setDescription(
              '```\n' +
              '+-----------------------------------------+\n' +
              '|    ZENOVA SHOP  -  SAN SANG              |\n' +
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
              { name: 'Thoi gian tao', value: Math.round((Date.now() - startTime) / 1000) + 's', inline: true },
              { name: 'Cach ket noi', value: '1. Cai **Tailscale**\n2. Mo `mstsc` nhap `' + (m.tailscaleIp || '?') + ':3389`\n3. User: `' + (m.user || 'runneradmin') + '`\n4. Pass: `' + (m.password || '(secret)') + '`', inline: false }
            )
            .setFooter({ text: 'Zenova Shop v14 | ' + new Date().toLocaleString('vi-VN') })
            .setTimestamp();

          try { await interaction.editReply({ embeds: [successEmbed], components: [] }); } catch (e) {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [successEmbed] }); logger.ok('DM thanh cong'); } catch (e) {}
          }
        } else {
          const failEmbed = new EmbedBuilder()
            .setTitle('TAO MAY THAT BAI')
            .setColor(COLORS.danger)
            .setDescription('Loi: `' + (result.error || 'Khong ro') + '`')
            .setTimestamp();
          try { await interaction.editReply({ embeds: [failEmbed], components: [] }); } catch (e) {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [failEmbed] }); } catch (e) {}
          }
        }
      }).catch(async (e) => {
        if (progressTimer) clearInterval(progressTimer);
        logger.err('Wait fail: ' + e.message);
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