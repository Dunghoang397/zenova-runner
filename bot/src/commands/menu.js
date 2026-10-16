// ZENOVA SHOP - /menu - Control Panel
import {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import {
  dispatchCreate, getUserMachine, isMachineOwner, deleteMachine
} from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS, formatDuration } from '../ui/embeds.js';
import {
  buildZenovaPanel, buildCreatePanel, buildDeletePanel,
  buildInfoPanel, buildHelpPanel
} from '../ui/zenova_panel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Zenova Shop - Mo bang dieu khien'),

  async execute(interaction) {
    if (!isMember(interaction)) {
      return interaction.reply({
        embeds: [{
          color: COLORS.danger,
          title: 'Khong co quyen',
          description: 'Ban can role **AI-STV Member** de dung Zenova Shop.'
        }],
        ephemeral: true
      });
    }

    const { embed, components } = buildZenovaPanel(interaction.user, isAdmin(interaction));
    await interaction.reply({ embeds: [embed], components, ephemeral: false });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    // Refresh - quay ve panel chinh
    if (action === 'refresh') {
      const { embed, components } = buildZenovaPanel(interaction.user, isAdmin(interaction));
      return interaction.update({ embeds: [embed], components });
    }

    // Back - quay ve panel chinh
    if (action === 'back') {
      const { embed, components } = buildZenovaPanel(interaction.user, isAdmin(interaction));
      return interaction.update({ embeds: [embed], components });
    }

    // Help
    if (action === 'help') {
      const { embed, components } = buildHelpPanel();
      return interaction.update({ embeds: [embed], components });
    }

    // Create - hien panel chon Windows
    if (action === 'create' && !rest[1]) {
      // Check 1 user 1 may
      if (!isAdmin(interaction)) {
        const existing = await getUserMachine(interaction.user.id);
        if (existing) {
          const ageMin = (Date.now() - new Date(existing.created).getTime()) / 60000;
          const ageH = Math.floor(ageMin / 60);
          const ageM = Math.floor(ageMin % 60);
          return interaction.reply({
            embeds: [{
              color: COLORS.warning,
              title: 'Ban da co may',
              description:
                `Ban dang so huu may **\`${existing.id}\`** (tao ${ageH}h ${ageM}m truoc).\n\n` +
                `**Luat: 1 nguoi 1 may.**\n` +
                `Muon tao may moi, ban phai:\n` +
                `1. Xoa may cu truoc (nhan **Xoa may**)\n` +
                `2. Hoac cho may cu het han`
            }],
            ephemeral: true
          });
        }
      }

      const { embed, components } = buildCreatePanel();
      return interaction.update({ embeds: [embed], components });
    }

    // Create win2022/win2025 - mo modal
    if (action === 'create' && (rest[1] === 'win2022' || rest[1] === 'win2025')) {
      const windows = rest[1] === 'win2022' ? 'windows-2022' : 'windows-2025';

      const modal = new ModalBuilder()
        .setCustomId(`zenova:modal:create:${windows}`)
        .setTitle('Tao may - Zenova Shop');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('machine_name')
            .setLabel('Ten may (a-z, 0-9, gach ngang)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(32)
            .setPlaceholder('vd: zenova-01, may-cua-toi')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('duration')
            .setLabel('Thoi gian (mac dinh: 6h00m)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(10)
            .setPlaceholder('vd: 6h00m, 3h, 1h')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('resolution')
            .setLabel('Do phan giai (mac dinh: 1920x1080@60)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(20)
            .setPlaceholder('vd: 1920x1080@60, 2560x1440@60')
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('packages')
            .setLabel('App cai them (chi admin)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setMaxLength(200)
            .setPlaceholder('vd: googlechrome 7zip notepadplusplus')
        )
      );

      await interaction.showModal(modal);
      return;
    }

    // Delete - hien panel xoa
    if (action === 'delete' && !rest[1]) {
      const machine = await getUserMachine(interaction.user.id);
      if (!machine) {
        const { embed, components } = buildDeletePanel(null);
        return interaction.update({ embeds: [embed], components });
      }
      const { embed, components } = buildDeletePanel(machine.id);
      return interaction.update({ embeds: [embed], components });
    }

    // Delete ask - tu info panel
    if (action === 'delete' && rest[1] === 'ask') {
      const machineId = rest[2];
      const owned = isAdmin(interaction) || await isMachineOwner(interaction.user.id, machineId);
      if (!owned) {
        return interaction.reply({
          embeds: [{
            color: COLORS.danger,
            title: 'Khong co quyen',
            description: `May \`${machineId}\` khong phai cua ban.`
          }],
          ephemeral: true
        });
      }
      const { embed, components } = buildDeletePanel(machineId);
      return interaction.update({ embeds: [embed], components });
    }

    // Delete confirm
    if (action === 'delete' && rest[1] === 'confirm') {
      const machineId = rest[2];

      const owned = isAdmin(interaction) || await isMachineOwner(interaction.user.id, machineId);
      if (!owned) {
        return interaction.reply({
          embeds: [{
            color: COLORS.danger,
            title: 'Khong co quyen',
            description: 'Ban khong phai chu may nay.'
          }],
          ephemeral: true
        });
      }

      await interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle('Dang xoa...')
          .setDescription(`Dang xoa may **\`${machineId}\`**...`)],
        components: []
      });

      try {
        await deleteMachine(machineId, interaction.user.id, isAdmin(interaction));
        logger.ok(`User ${interaction.user.tag} da xoa may: ${machineId}`);

        const success = new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('Da xoa may')
          .setDescription(
            `May **\`${machineId}\`** da bi xoa hoan toan.\n\n` +
            `Ban co the tao may moi bang nut **Tao may**.`
          )
          .setTimestamp()
          .setFooter({ text: 'Zenova Shop' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('zenova:create')
            .setLabel('Tao may moi')
            .setEmoji('🚀')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('zenova:back')
            .setLabel('Menu')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({ embeds: [success], components: [row] });
      } catch (e) {
        logger.err(`Xoa may fail: ${e.message}`);
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Loi')
            .setDescription(`\`${e.message}\``)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('zenova:back')
                .setLabel('Menu')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }
      return;
    }

    // Info
    if (action === 'info') {
      const machine = await getUserMachine(interaction.user.id);
      if (!machine) {
        return interaction.update({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle('Ban chua co may')
            .setDescription('Hay dung **Tao may** de bat dau.')],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('zenova:create')
                .setLabel('Tao may')
                .setEmoji('🚀')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('zenova:back')
                .setLabel('Menu')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
            )
          ]
        });
      }

      let remainText = '?';
      const m = machine.manifest;
      if (m?.startUtc && m?.durationMinutes) {
        const end = new Date(m.startUtc).getTime() + m.durationMinutes * 60000;
        remainText = formatDuration(Math.max(0, end - Date.now()));
      }

      const { embed, components } = buildInfoPanel(machine, remainText);
      return interaction.update({ embeds: [embed], components });
    }

    // Modal create
    if (action === 'modal' && rest[1] === 'create') {
      const windows = rest[2];
      const machineName = interaction.fields.getTextInputValue('machine_name').toLowerCase().replace(/[^a-z0-9\-]/g, '-');
      const durationInput = interaction.fields.getTextInputValue('duration') || '6h00m';
      const resolutionInput = interaction.fields.getTextInputValue('resolution') || '1920x1080@60';
      const packagesInput = interaction.fields.getTextInputValue('packages') || '';

      if (!/^[a-z0-9\-]+$/.test(machineName)) {
        return interaction.reply({
          content: 'Ten may khong hop le (chi a-z, 0-9, gach ngang).',
          ephemeral: true
        });
      }

      const validDurations = ['1h', '3h', '5h00m', '6h00m'];
      const duration = validDurations.includes(durationInput) ? durationInput : '6h00m';

      const validRes = ['1920x1080@60', '1920x1080@120', '2560x1440@60', '3840x2160@60'];
      const resolution = validRes.includes(resolutionInput) ? resolutionInput : '1920x1080@60';

      const packages = isAdmin(interaction) ? packagesInput : '';

      await interaction.deferReply({ ephemeral: true });

      try {
        await dispatchCreate({
          machine_id: machineName,
          duration,
          run_mode: 'normal',
          auto_restart: true,
          drive_letter: 'X',
          vhd_size_gb: '45',
          windows_image: windows,
          fixed_password: '',
          vdd_resolution: resolution,
          choco_packages: packages,
          optimize_windows: true,
          lite_windows: true,
          auto_save_interval_min: '15',
          owner_discord_id: interaction.user.id
        });

        const success = new EmbedBuilder()
          .setTitle('Da gui lenh tao may!')
          .setColor(COLORS.success)
          .setDescription(
            '```\n' +
            '+----------------------------------------------+\n' +
            '|        MAY DANG DUOC KHOI DONG               |\n' +
            '+----------------------------------------------+\n' +
            '```\n' +
            `May **\`${machineName}\`** se san sang sau **1-2 phut**.`
          )
          .addFields(
            { name: 'Windows', value: `\`${windows}\``, inline: true },
            { name: 'Thoi luong', value: `\`${duration}\``, inline: true },
            { name: 'Do phan giai', value: `\`${resolution}\``, inline: true },
            { name: 'Chu may', value: `${interaction.user}`, inline: true },
            { name: 'Packages', value: packages || '*(khong co)*', inline: false }
          )
          .setFooter({ text: 'Zenova Shop | Dung nut Info de xem trang thai' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('zenova:info')
            .setLabel('Xem may')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('zenova:back')
            .setLabel('Menu')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({ embeds: [success], components: [row] });
        logger.ok(`User ${interaction.user.tag} (${interaction.user.id}) tao may: ${machineName}`);
      } catch (e) {
        logger.err(`Tao may fail: ${e.message}`);
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Loi tao may')
            .setDescription(`\`${e.message}\``)]
        });
      }
      return;
    }
  }
};