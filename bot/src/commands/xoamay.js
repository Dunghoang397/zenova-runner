// ZENOVA SHOP - /xoamay - Xoa may + trigger GitHub cleanup
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import { deleteMachine, getUserMachine, isMachineOwner, listMachines } from '../lib/github.js';
import { logger } from '../lib/logger.js';
import { isMember, isAdmin } from '../lib/security.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('xoamay')
    .setDescription('Xoa may cua ban (tu dong save + cleanup)')
    .addStringOption(o => o
      .setName('ten')
      .setDescription('Ten may can xoa')
      .setRequired(true)
      .setAutocomplete(true)
    ),

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
        embeds: [{
          color: COLORS.danger,
          title: 'Khong co quyen',
          description: 'Ban can role **AI-STV Member** de dung lenh nay.'
        }]
      });
    }

    const ten = interaction.options.getString('ten');

    // Check ownership
    if (!isAdmin(interaction)) {
      const owned = await isMachineOwner(interaction.user.id, ten);
      if (!owned) {
        return interaction.editReply({
          embeds: [{
            color: COLORS.danger,
            title: 'Khong co quyen',
            description: 'May `' + ten + '` khong phai cua ban.'
          }]
        });
      }
    }

    // Hien panel confirm
    const embed = new EmbedBuilder()
      .setTitle('XAC NHAN XOA MAY')
      .setColor(COLORS.danger)
      .setDescription(
        '```\n' +
        '┌─────────────────────────────────────────┐\n' +
        '│    ZENOVA SHOP  •  XOA MAY              │\n' +
        '└─────────────────────────────────────────┘\n' +
        '```\n' +
        '**May:** `' + ten + '`\n\n' +
        '**Quy trinh xoa:**\n' +
        '1. Bot se **dung workflow** dang chay\n' +
        '2. **Luu toan bo du lieu** (backup cuoi)\n' +
        '3. **Xoa release** + branch state\n' +
        '4. Xoa vinh vien khoi GitHub\n\n' +
        '⚠️ **Khong the hoan tac!**'
      )
      .setFooter({ text: 'Nhan "Xoa" de xac nhan' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('xoamay:confirm:' + ten)
        .setLabel('Xoa vinh vien')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('xoamay:cancel')
        .setLabel('Huy')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0];

    if (action === 'cancel') {
      await interaction.update({
        embeds: [new EmbedBuilder().setColor(COLORS.dark).setDescription('Da huy xoa may.')],
        components: []
      });
      return;
    }

    if (action === 'confirm') {
      const ten = rest[1];
      await interaction.deferUpdate();

      // Hien "dang xoa"
      await interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(COLORS.warning)
          .setTitle('DANG XOA MAY...')
          .setDescription(
            '```\n' +
            '┌─────────────────────────────────────────┐\n' +
            '│    ZENOVA SHOP  •  DANG XU LY            │\n' +
            '└─────────────────────────────────────────┘\n' +
            '```\n' +
            'May: `' + ten + '`\n\n' +
            '⏳ **Vui long doi 30-60 giay...**\n\n' +
            'Dang thuc hien:\n' +
            '1. Dung workflow dang chay\n' +
            '2. Luu backup cuoi cung\n' +
            '3. Xoa release + branch\n\n' +
            '*Vui long khong tat bot*'
          )
          .setFooter({ text: 'Zenova Shop' })
          .setTimestamp()],
        components: []
      });

      try {
        await deleteMachine(ten, interaction.user.id, isAdmin(interaction));
        logger.ok('User ' + interaction.user.tag + ' da xoa may: ' + ten);

        const success = new EmbedBuilder()
          .setTitle('XOA MAY THANH CONG!')
          .setColor(COLORS.success)
          .setDescription(
            '```\n' +
            '┌─────────────────────────────────────────┐\n' +
            '│    ZENOVA SHOP  •  DA XOA               │\n' +
            '└─────────────────────────────────────────┘\n' +
            '```\n' +
            '**May ' + ten + ' da duoc xoa hoan toan.**'
          )
          .addFields(
            { name: 'Da thuc hien', value: '✅ Dung workflow\n✅ Luu backup cuoi\n✅ Xoa release\n✅ Xoa branch', inline: false }
          )
          .setFooter({ text: 'Zenova Shop | Co the tao may moi bang /taomay' })
          .setTimestamp();

        await interaction.editReply({ embeds: [success], components: [] });

        // DM user
        try {
          const dm = await interaction.user.createDM();
          await dm.send({ embeds: [success] });
        } catch (e) {
          logger.dbg('DM fail: ' + e.message);
        }
      } catch (e) {
        logger.err('Xoa may fail: ' + e.message);
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle('Loi xoa may')
            .setDescription('`' + e.message + '`')],
          components: []
        });
      }
      return;
    }
  }
};