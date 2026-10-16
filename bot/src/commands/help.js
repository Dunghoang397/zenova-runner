// ZENOVA SHOP - /help - Huong dan
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';
import { COLORS } from '../ui/embeds.js';
import { isAdmin, isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Huong dan su dung Zenova Shop Bot'),

  async execute(interaction) {
    const embed = buildHelp(interaction);
    const row = buildButtons();
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};

function buildHelp(interaction) {
  const admin = isAdmin(interaction);
  const member = isMember(interaction);

  const embed = new EmbedBuilder()
    .setTitle('ZENOVA SHOP - HUONG DAN')
    .setColor(COLORS.primary)
    .setThumbnail(interaction.client.user.displayAvatarURL())
    .setDescription(
      '```\n' +
      '+----------------------------------------------+\n' +
      '|          ZENOVA SHOP  -  HELP                |\n' +
      '+----------------------------------------------+\n' +
      '```'
    )
    .setTimestamp()
    .setFooter({ text: 'Zenova Shop v8.0' });

  embed.addFields({
    name: 'Lenh chinh',
    value: member
      ? '`/menu` - Mo **bang dieu khien Zenova** (Tao / Xoa / Info)'
      : 'Ban can role **AI-STV Member**',
    inline: false
  });

  embed.addFields({
    name: 'Giai tri',
    value: [
      '`/fun` - Menu tro choi',
      '`/dice` - Tung xuc xac',
      '`/coinflip` - Tung xu',
      '`/8ball` - Bong ma',
      '`/avatar` - Xem avatar',
      '`/poll` - Tao binh chon',
      '`/meme` - Random meme',
      '`/quote` - Random quote',
      '`/top` - BXH XP'
    ].join('\n'),
    inline: false
  });

  embed.addFields({
    name: 'Tien ich',
    value: [
      '`/ping` - Do tre bot',
      '`/uptime` - Bot chay bao lau',
      '`/botinfo` - Thong tin bot'
    ].join('\n'),
    inline: false
  });

  if (admin) {
    embed.addFields({
      name: 'Lenh Admin',
      value: [
        '`/danhsach` - Toan bo may',
        '`/stop` - Huy run',
        '`/log` - Xem log',
        '`/status` - Trang thai he thong',
        '`/setlog` - Dat kenh log',
        '`/setwelcome` - Dat kenh welcome',
        '`/givexp` - Cong XP',
        '`/resetxp` - Reset XP'
      ].join('\n'),
      inline: false
    });
  }

  embed.addFields({
    name: 'Luat choi',
    value: [
      '- **1 nguoi 1 may**',
      '- **Thoi gian mac dinh: 6 gio**',
      '- **Windows:** 2022 hoac 2025',
      '- **Chat +1 XP/phut**',
      '- **Member** chi xoa may cua minh'
    ].join('\n'),
    inline: false
  });

  return embed;
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('zenova:back')
      .setLabel('Mo Menu Zenova')
      .setEmoji('🏪')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel('GitHub')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}`),
    new ButtonBuilder()
      .setLabel('Actions')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}/actions`)
  );
}