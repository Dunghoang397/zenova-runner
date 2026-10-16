// ZENOVA SHOP - /fun - Menu giai tri
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  StringSelectMenuBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Menu tro choi giai tri'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('ZENOVA - GIAI TRI')
      .setColor(0x8b5cf6)
      .setDescription(
        '```\n' +
        '+----------------------------------------------+\n' +
        '|           ZENOVA SHOP - FUN                  |\n' +
        '+----------------------------------------------+\n' +
        '```\n' +
        'Chon mot tro choi tu menu ben duoi:\n\n' +
        '- **Tung xuc xac** - Do xuc xac 1-6\n' +
        '- **Tung xu** - Sap/Ngua\n' +
        '- **Bong ma 8ball** - Hoi bat ky dieu gi\n' +
        '- **Avatar** - Xem avatar ai do\n' +
        '- **Poll** - Tao binh chon\n' +
        '- **Meme** - Random meme vui\n' +
        '- **Quote** - Random cau noi hay\n' +
        '- **Top** - Bang xep hang XP'
      )
      .setFooter({ text: 'Prompt by ALB SCRIPT | Zenova Shop' })
      .setTimestamp();

    const select = new StringSelectMenuBuilder()
      .setCustomId('fun:select')
      .setPlaceholder('Chon tro choi')
      .addOptions([
        { label: 'Tung xuc xac', value: 'dice', description: 'Do xuc xac 1-6', emoji: '🎲' },
        { label: 'Tung xu', value: 'coinflip', description: 'Sap hay Ngua?', emoji: '🪙' },
        { label: 'Bong ma 8ball', value: '8ball', description: 'Hoi bat ky', emoji: '🎱' },
        { label: 'Tao poll', value: 'poll', description: 'Binh chon nhanh', emoji: '📊' },
        { label: 'Random meme', value: 'meme', description: 'Cuoi xa stress', emoji: '😂' },
        { label: 'Random quote', value: 'quote', description: 'Cau noi truyen cam hung', emoji: '💬' },
        { label: 'Top XP', value: 'top', description: 'Bang xep hang', emoji: '🏆' }
      ]);

    const row1 = new ActionRowBuilder().addComponents(select);

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fun:dice')
        .setLabel('Tung xuc xac')
        .setEmoji('🎲')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('fun:coinflip')
        .setLabel('Tung xu')
        .setEmoji('🪙')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('fun:8ball')
        .setLabel('8ball')
        .setEmoji('🎱')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('fun:meme')
        .setLabel('Meme')
        .setEmoji('😂')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('fun:quote')
        .setLabel('Quote')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  },

  async handleComponent(interaction, rest) {
    const action = rest[0] || interaction.values?.[0];

    const hints = {
      dice: 'Dung `/dice` de tung xuc xac!',
      coinflip: 'Dung `/coinflip` de tung xu!',
      '8ball': 'Dung `/8ball <cau hoi>` de hoi bong ma!',
      poll: 'Dung `/poll` de tao binh chon!',
      meme: 'Dung `/meme` de xem meme!',
      quote: 'Dung `/quote` de nhan quote!',
      top: 'Dung `/top` de xem bang xep hang!'
    };

    if (hints[action]) {
      return interaction.reply({ content: hints[action], ephemeral: true });
    }
  }
};