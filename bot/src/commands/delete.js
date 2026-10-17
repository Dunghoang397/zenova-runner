// ZENOVA - /delete
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { deleteMachine, isMachineOwner, listMachines } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete your machine')
    .addStringOption(o => o.setName('name').setDescription('Machine name').setRequired(true).setAutocomplete(true)),

  async autocomplete(interaction) {
    try {
      const focused = interaction.options.getFocused().toLowerCase();
      const machines = await listMachines();
      let visible = machines;
      if (!isAdmin(interaction)) {
        visible = [];
        for (const m of machines) {
          const owned = await isMachineOwner(interaction.user.id, m.id);
          if (owned) visible.push(m);
        }
      }
      const filtered = visible.filter(m => m.id.includes(focused)).slice(0, 25);
      await interaction.respond(filtered.map(m => ({ name: m.id, value: m.id })));
    } catch {
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    if (!isMember(interaction)) {
      return interaction.editReply({
        embeds: [{ color: COLORS.danger, title: 'No Permission', description: 'Need role **AI-STV Member**.' }]
      });
    }

    const name = interaction.options.getString('name');
    if (!isAdmin(interaction)) {
      const owned = await isMachineOwner(interaction.user.id, name);
      if (!owned) {
        return interaction.editReply({
          embeds: [{ color: COLORS.danger, title: 'No Permission', description: '`' + name + '` is not your machine.' }]
        });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('CONFIRM DELETE')
      .setColor(COLORS.danger)
      .setDescription(
        '```\n' +
        '+-----------------------------------------+\n' +
        '|    ZENOVA  -  DELETE MACHINE            |\n' +
        '+-----------------------------------------+\n' +
        '```\n' +
        '**Machine:** `' + name + '`\n\n' +
        '**Process:**\n' +
        '1. Cancel running workflow\n' +
        '2. Save final data\n' +
        '3. Delete release + branch\n\n' +
        '**This cannot be undone!**'
      )
      .setFooter({ text: 'Click Delete to confirm' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('delete:confirm:' + name).setLabel('Delete Forever').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('delete:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
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
      const name = rest[1];
      await interaction.deferUpdate();

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(COLORS.warning).setTitle('DELETING...').setDescription('Machine: `' + name + '`\n\n**Please wait 30-60s...**')],
        components: []
      });

      try {
        await deleteMachine(name, interaction.user.id, isAdmin(interaction));
        logger.ok('Deleted: ' + name);

        const success = new EmbedBuilder()
          .setTitle('DELETED')
          .setColor(COLORS.success)
          .setDescription('Machine **' + name + '** has been deleted.')
          .setFooter({ text: 'Create new with /create' })
          .setTimestamp();

        await interaction.editReply({ embeds: [success], components: [] });
        try { const dm = await interaction.user.createDM(); await dm.send({ embeds: [success] }); } catch {}
      } catch (e) {
        logger.err('Delete fail: ' + e.message);
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Error').setDescription('`' + e.message + '`')],
          components: []
        });
      }
    }
  }
};