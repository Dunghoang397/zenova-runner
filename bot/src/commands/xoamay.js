// ZENOVA SHOP - /xoamay v12 FINAL
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { deleteMachine, isMachineOwner, listMachines } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xoamay')
    .setDescription('Xoa may cua ban')
    .addStringOption(o => o.setName('ten').setDescription('Ten may can xoa').setRequired(true).setAutocomplete(true)),

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
        embeds: [{ color: COLORS.danger, title: 'Khong co quyen', description: 'Can role **AI-STV Member**.' }]
      });
    }

    const ten = interaction.options.getString('ten');
    if (!isAdmin(interaction)) {
      const owned = await isMachineOwner(interaction.user.id, ten);
      if (!owned) {
        return interaction.editReply({
          embeds: [{ color: COLORS.danger, title: 'Khong co quyen', description: 'May `' + ten + '` khong phai cua ban.' }]
        });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('XAC NHAN XOA MAY')
      .setColor(COLORS.danger)
      .setDescription(
        '```\n' +
        '+-----------------------------------------+\n' +
        '|    ZENOVA SHOP  -  XOA MAY              |\n' +
        '+-----------------------------------------+\n' +
        '```\n' +
        '**May:** `' + ten + '`\n\n' +
        '**Quy trinh:**\n' +
        '1. Dung workflow dang chay\n' +
        '2. Luu du lieu\n' +
        '3. Xoa release + branch\n\n' +
        '**Khong the hoan tac!**'
      )
      .setFooter({ text: 'Nhan Xoa de xac nhan' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('xoamay:confirm:' + ten).setLabel('Xoa vinh vien').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('xoamay:cancel').setLabel('Huy').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'cancel') {
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.dark).setDescription('Da huy.')],
        components: []
      });
      return;
    }

    if (action === 'confirm') {
      const ten = rest[1];
      await interaction.deferUpdate();

      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle('DANG XOA...')
          .setDescription('May: `' + ten + '`\n\n**Vui long doi 30-60s...**')],
        components: []
      });

      try {
        await deleteMachine(ten, interaction.user.id, isAdmin(interaction));
        logger.ok('User ' + interaction.user.tag + ' da xoa may: ' + ten);

        const success = new EmbedBuilder()
          .setTitle('XOA MAY THANH CONG!')
          .setColor(COLORS.success)
          .setDescription('May **' + ten + '** da duoc xoa hoan toan.')
          .setFooter({ text: 'Co the tao may moi bang /taomay' })
          .setTimestamp();

        await interaction.editReply({ embeds: [success], components: [] });
        try { const dm = await interaction.user.createDM(); await dm.send({ embeds: [success] }); } catch {}
      } catch (e) {
        logger.err('Xoa may fail: ' + e.message);
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(COLORS.danger).setTitle('Loi').setDescription('`' + e.message + '`')],
          components: []
        });
      }
    }
  }
};