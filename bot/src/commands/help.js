import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../ui/embeds.js';
import { isAdmin, isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Huong dan su dung Zenova Shop Bot'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const admin = isAdmin(interaction);
    const member = isMember(interaction);

    const embed = new EmbedBuilder()
      .setTitle('ZENOVA SHOP v13 - HUONG DAN')
      .setColor(COLORS.primary)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription(
        '```\n' +
        '+----------------------------------------------+\n' +
        '|          ZENOVA SHOP  -  HELP                |\n' +
        '+----------------------------------------------+\n' +
        '```\n' +
        '**Bot da tinh nang**: May ao, Moderation, Economy, Fun, XP'
      )
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop v13.0 ULTIMATE' });

    // MAY AO
    embed.addFields({
      name: '🖥️ May ao (Member)',
      value: member
        ? '`/taomay` Tao may\n`/xoamay` Xoa may\n`/infomay` Xem thong tin may'
        : 'Ban can role **AI-STV Member**',
      inline: false
    });

    // MODERATION
    if (admin) {
      embed.addFields({
        name: '🛡️ Moderation (Admin)',
        value: [
          '`/warn` `/warnings` - Canh cao',
          '`/kick` `/ban` - Kick/Ban',
          '`/mute` `/unmute` - Timeout',
          '`/purge` - Xoa tin nhan',
          '`/slowmode` `/lock` - Quan ly kenh'
        ].join('\n'),
        inline: false
      });

      embed.addFields({
        name: '⚙️ Admin may ao',
        value: '`/danhsach` `/stop` `/log` `/status` `/setlog` `/setwelcome` `/givexp` `/resetxp`',
        inline: false
      });
    }

    // ECONOMY
    embed.addFields({
      name: '💰 Economy',
      value: [
        '`/daily` `/work` - Kiem tien',
        '`/balance` `/pay` - Vi & Chuyen tien',
        '`/gamble` - Danh bac',
        '`/leaderboard` - BXH giau co'
      ].join('\n'),
      inline: false
    });

    // FUN
    embed.addFields({
      name: '🎮 Fun',
      value: '`/fun` `/dice` `/coinflip` `/8ball` `/avatar` `/poll` `/meme` `/quote`',
      inline: false
    });

    // UTILITY
    embed.addFields({
      name: '🔧 Utility',
      value: '`/ping` `/uptime` `/botinfo` `/serverinfo` `/rank` `/top`',
      inline: false
    });

    embed.addFields({
      name: '📏 Luat choi',
      value: '- **1 nguoi 1 may**\n- **Thoi gian: 6h** (mac dinh)\n- **Windows:** 2022/2025\n- **+1 XP/phut chat**',
      inline: false
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}`),
      new ButtonBuilder().setLabel('Actions').setStyle(ButtonStyle.Link).setURL(`https://github.com/${process.env.GH_OWNER}/${process.env.GH_REPO}/actions`)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};