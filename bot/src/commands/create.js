// ZENOVA - /create v19 (progress live + DM full info)
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
  return '`' + '\u2588'.repeat(filled) + '\u2591'.repeat(empty) + '` **' + Math.round(pct) + '%**';
}

function getStepInfo(state) {
  if (!state) return { step: 'Waiting for workflow', pct: 5 };
  if (state.tailscaleIp && state.tailscaleIp !== '?' && state.user) return { step: 'Ready to connect', pct: 100 };
  if (state.ready === true) return { step: 'Ready', pct: 100 };
  const s = state.step || state.status || '';
  const steps = {
    'init': { step: '1/5 - Initializing', pct: 15 },
    'starting': { step: '1/5 - Initializing', pct: 15 },
    'tailscale_done': { step: '2/5 - Tailscale connected', pct: 40 },
    'installing': { step: '3/5 - Installing system', pct: 60 },
    'ready-soon': { step: '4/5 - Almost ready', pct: 90 }
  };
  return steps[s] || { step: 'Processing', pct: 30 };
}

export default {
  data: new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new Windows VM (1 user 1 machine)'),

  async execute(interaction) {
    if (!isMember(interaction)) {
      return interaction.reply({
        embeds: [{ color: COLORS.danger, title: 'No Permission', description: 'You need role **AI-STV Member**.' }],
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
              title: 'You already have a machine',
              description: 'You own **`' + existing.id + '`** (created ' + ageH + 'h ' + ageM + 'm ago).\n\n**Rule: 1 user 1 machine.**\nDelete with `/delete` first.'
            }],
            ephemeral: true
          });
        }
      } catch (e) {}
    }

    const modal = new ModalBuilder()
      .setCustomId('create:modal')
      .setTitle('Create Machine - Zenova');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('machine_name')
          .setLabel('Machine name (a-z, 0-9, dash)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(32)
          .setPlaceholder('e.g. my-machine-01')
      )
    );

    await interaction.showModal(modal);
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'modal') {
      const machineName = interaction.fields.getTextInputValue('machine_name').toLowerCase().replace(/[^a-z0-9\-]/g, '-');
      if (!/^[a-z0-9\-]+$/.test(machineName)) {
        return interaction.reply({ content: 'Invalid name.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('SELECT WINDOWS VERSION')
        .setColor(COLORS.primary)
        .setDescription('```\n+-----------------------------------------+\n|    ZENOVA  -  SELECT WINDOWS            |\n+-----------------------------------------+\n```\n' +
          '**Machine:** `' + machineName + '`\n' +
          '**Duration:** `6 hours`\n' +
          '**Mode:** `Lite (fix lag)`\n\n' +
          '**Choose Windows version:**')
        .setFooter({ text: 'Step 2/2' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('create:win:' + machineName + ':windows-2025').setLabel('Windows 2025').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('create:win:' + machineName + ':windows-2022').setLabel('Windows 2022').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('create:cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      return;
    }

    if (action === 'cancel') {
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.dark).setDescription('Cancelled.')],
        components: []
      });
      return;
    }

    if (action === 'win') {
      const machineName = rest[1];
      const windows = rest[2];
      const startTime = Date.now();
      await interaction.deferUpdate();

      const buildEmbed = (state) => {
        const info = getStepInfo(state);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const lines = [
          '**Machine:** `' + machineName + '`',
          '**Windows:** `' + windows + '`',
          '**Elapsed:** `' + elapsed + 's`',
          '',
          progressBar(info.pct),
          '',
          '**Step:** ' + info.step
        ];
        if (state?.tailscaleIp && state.tailscaleIp !== '?') {
          lines.push('');
          lines.push('**IP:** `' + state.tailscaleIp + '`');
          if (state?.user) lines.push('**User:** `' + state.user + '`');
        }
        lines.push('');
        lines.push('_DM will be sent when ready_');

        return new EmbedBuilder()
          .setTitle('CREATING MACHINE')
          .setColor(state?.ready || (state?.tailscaleIp && state?.user) ? COLORS.success : COLORS.warning)
          .setDescription('```\n+-----------------------------------------+\n|    ZENOVA  -  PROCESSING                 |\n+-----------------------------------------+\n```\n' + lines.join('\n'))
          .setFooter({ text: 'Do not turn off bot' })
          .setTimestamp();
      };

      await interaction.editReply({ embeds: [buildEmbed(null)], components: [] });

      try {
        await dispatchCreate({
          machine_id: machineName,
          owner_discord_id: interaction.user.id,
          duration: '6h00m',
          drive_letter: 'X',
          vhd_size_gb: '45',
          windows_image: windows,
          windows_mode: 'lite',
          vdd_resolution: '1920x1080@60',
          auto_save_interval_min: '15',
          auto_restart: true,
          keep_session: true,
          enable_duckdns: true,
          choco_packages: ''
        });
        logger.ok('Dispatched: ' + machineName);
      } catch (e) {
        logger.err('Dispatch fail: ' + e.message);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Error').setDescription('`' + e.message + '`')]
        });
      }

      const progressTimer = setInterval(async () => {
        try {
          const { getStateWithFallback } = await import('../lib/github.js');
          const state = await getStateWithFallback(machineName);
          await interaction.editReply({ embeds: [buildEmbed(state)] }).catch(() => {});
        } catch {}
      }, 4000);

      waitForWorkflowCompletion(machineName, 900000, 2000).then(async (result) => {
        clearInterval(progressTimer);
        const dmChannel = await interaction.user.createDM().catch(() => null);

        if (result.success && result.manifest) {
          const m = result.manifest;
          const totalMin = m.durationMinutes || 360;
          const startDate = m.startUtc ? new Date(m.startUtc) : new Date();
          const endDate = new Date(startDate.getTime() + totalMin * 60000);
          const elapsed = Math.round((Date.now() - startTime) / 1000);

          // ═══ EMBED ĐẦY ĐỦ THÔNG TIN ═══
          const successEmbed = new EmbedBuilder()
            .setTitle('MACHINE READY')
            .setColor(COLORS.success)
            .setDescription('```\n+-----------------------------------------+\n|    ZENOVA  -  READY                      |\n+-----------------------------------------+\n```\n' +
              'Machine **' + machineName + '** is ready!' +
              (result.fromLog ? '\n_(Info from workflow log fallback)_' : ''))
            .addFields(
              { name: 'Machine', value: '`' + machineName + '`', inline: true },
              { name: 'Windows', value: '`' + (m.windowsImage || windows) + '`', inline: true },
              { name: 'Mode', value: '`' + (m.windowsMode || 'lite') + '`', inline: true },
              { name: 'IP (Tailscale)', value: '`' + (m.tailscaleIp || '?') + '`', inline: true },
              { name: 'DuckDNS', value: m.duckdnsHost ? '`' + m.duckdnsHost + '`' : '`not set`', inline: true },
              { name: 'Port', value: '`3389`', inline: true },
              { name: 'User', value: '`' + (m.user || 'runneradmin') + '`', inline: true },
              { name: 'Password', value: '`' + (m.password || '(secret)') + '`', inline: true },
              { name: 'Duration', value: '`' + totalMin + ' min`', inline: true },
              { name: 'Expires', value: '<t:' + Math.floor(endDate.getTime() / 1000) + ':R>', inline: true },
              { name: 'Creation time', value: elapsed + 's', inline: true },
              { name: 'How to connect', value: '**1.** Install **Tailscale**: https://tailscale.com/download\n**2.** Login with same account\n**3.** Open `mstsc` (Windows) or **Microsoft Remote Desktop** (Mac)\n**4.** Connect to `' + (m.tailscaleIp || '?') + ':3389`\n**5.** User: `' + (m.user || 'runneradmin') + '` | Pass: `' + (m.password || '(secret)') + '`', inline: false },
              { name: 'Web Panel', value: 'http://' + (m.tailscaleIp || '?') + ':8080/', inline: false },
              { name: 'Auto-save', value: 'Every 15 min | Auto-restart on expiry', inline: false }
            )
            .setFooter({ text: 'Zenova v19 | ' + new Date().toLocaleString('en-US') })
            .setTimestamp();

          try { await interaction.editReply({ embeds: [successEmbed], components: [] }); } catch {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [successEmbed] }); logger.ok('DM sent to ' + interaction.user.tag); } catch {}
          }
        } else {
          const failEmbed = new EmbedBuilder()
            .setTitle('CREATION FAILED')
            .setColor(COLORS.danger)
            .setDescription('Error: `' + (result.error || 'Unknown') + '`')
            .addFields(
              { name: 'Machine', value: '`' + machineName + '`', inline: true },
              { name: 'Last step', value: result.lastState ? '`' + (result.lastState.step || result.lastState.status || '?') + '`' : '`no state`', inline: true },
              { name: 'Check', value: '[GitHub Actions](https://github.com/' + process.env.GH_OWNER + '/' + process.env.GH_REPO + '/actions)' }
            )
            .setTimestamp();
          try { await interaction.editReply({ embeds: [failEmbed], components: [] }); } catch {}
          if (dmChannel) {
            try { await dmChannel.send({ embeds: [failEmbed] }); } catch {}
          }
        }
      }).catch(async (e) => {
        clearInterval(progressTimer);
        logger.err('Wait fail: ' + e.message);
        try {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('System Error').setDescription('`' + e.message + '`')]
          });
        } catch {}
      });
      return;
    }
  }
};