// ZENOVA - /transfer (pass machine)
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { transferOwnership, getStateJson } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer your machine to another user')
    .addStringOption(o => o.setName('machine').setDescription('Machine name').setRequired(true).setMaxLength(32))
    .addUserOption(o => o.setName('user').setDescription('New owner').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!isMember(interaction)) {
      return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'No Permission', description: 'Need **AI-STV Member**.' }] });
    }

    const machineName = interaction.options.getString('machine').toLowerCase().trim();
    const targetUser = interaction.options.getUser('user');
    const admin = isAdmin(interaction);

    if (targetUser.bot) return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'Invalid', description: 'Cannot transfer to bot.' }] });
    if (targetUser.id === interaction.user.id) return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'Invalid', description: 'Cannot transfer to yourself.' }] });

    const state = await getStateJson(machineName);
    if (!state) return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'Not Found', description: '`' + machineName + '` does not exist.' }] });

    if (!admin && state.ownerDiscordId && state.ownerDiscordId !== interaction.user.id) {
      return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'Not Yours', description: 'You do not own `' + machineName + '`.' }] });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) return interaction.editReply({ embeds: [{ color: COLORS.danger, title: 'Not Found', description: 'Target not in server.' }] });

    const embed = new EmbedBuilder()
      .setTitle('CONFIRM TRANSFER')
      .setColor(COLORS.warning)
      .setDescription('```\n+-----------------------------------------+\n|    ZENOVA  -  TRANSFER                   |\n+-----------------------------------------+\n```\n' +
        '**Machine:** `' + machineName + '`\n' +
        '**From:** ' + interaction.user.toString() + '\n' +
        '**To:** ' + targetUser.toString() + '\n\n' +
        '**Changes:**\n' +
        '- Ownership to ' + targetUser.username + '\n' +
        '- You lose access to `/info` and `/delete`\n' +
        '- **RDP credentials unchanged**')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('transfer:confirm:' + machineName + ':' + targetUser.id).setLabel('Confirm').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('transfer:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'cancel') {
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.dark).setDescription('Cancelled.')],
        components: []
      });
      return;
    }

    if (action === 'confirm') {
      const machineName = rest[1];
      const targetUserId = rest[2];
      const admin = isAdmin(interaction);

      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.warning).setTitle('TRANSFERRING...').setDescription('Machine: `' + machineName + '`')],
        components: []
      });

      try {
        const result = await transferOwnership(machineName, targetUserId, interaction.user.id, admin);
        logger.ok('Transfer: ' + machineName + ' -> ' + targetUserId);

        const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
        const targetName = targetUser ? targetUser.username : targetUserId;

        const success = new EmbedBuilder()
          .setTitle('TRANSFER SUCCESS')
          .setColor(COLORS.success)
          .setDescription('Machine **' + machineName + '** is now owned by **' + targetName + '**.')
          .addFields(
            { name: 'Machine', value: '`' + machineName + '`', inline: true },
            { name: 'Previous owner', value: result.previousOwner ? '<@' + result.previousOwner + '>' : '(none)', inline: true },
            { name: 'New owner', value: '<@' + result.newOwner + '>', inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [success], components: [] });

        try {
          const dm1 = await interaction.user.createDM();
          await dm1.send({ embeds: [new EmbedBuilder().setColor(COLORS.info).setTitle('Transferred').setDescription('You transferred **' + machineName + '** to **' + targetName + '**.')] });
        } catch {}

        if (targetUser) {
          try {
            const dm2 = await targetUser.createDM();
            await dm2.send({ embeds: [new EmbedBuilder()
              .setColor(COLORS.success)
              .setTitle('You received a machine!')
              .setDescription('**<@' + (result.previousOwner || '?') + '>** transferred **' + machineName + '** to you.')
              .addFields(
                { name: 'IP (Tailscale)', value: '`' + (result.state?.tailscaleIp || '?') + '`', inline: true },
                { name: 'User', value: '`' + (result.state?.user || 'runneradmin') + '`', inline: true },
                { name: 'Password', value: '`' + (result.state?.password || '(secret)') + '`', inline: true },
                { name: 'How to connect', value: '1. Install **Tailscale**\n2. Open `mstsc`\n3. Connect to `' + (result.state?.tailscaleIp || '?') + ':3389`', inline: false }
              )
              .setTimestamp()] });
          } catch {}
        }
      } catch (e) {
        logger.err('Transfer fail: ' + e.message);
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Failed').setDescription('`' + e.message + '`')], components: [] });
      }
    }
  }
};