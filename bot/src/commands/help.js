// ZENOVA SHOP - /help v16
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../ui/embeds.js';
import { isAdmin, isMod, isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Huong dan theo role'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const admin = isAdmin(interaction);
    const mod = isMod(interaction);
    const member = isMember(interaction);

    let roleText = 'Everyone';
    let color = COLORS.info;
    if (admin) { roleText = 'ADMIN / Owner'; color = COLORS.danger; }
    else if (mod) { roleText = 'Mod'; color = COLORS.warning; }
    else if (member) { roleText = 'AI-STV Member'; color = COLORS.success; }

    const embed = new EmbedBuilder()
      .setTitle('ZENOVA SHOP v16 - HUONG DAN')
      .setColor(color)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription(
        '```\n' +
        '+----------------------------------------------+\n' +
        '|          ZENOVA SHOP  -  HELP v16            |\n' +
        '+----------------------------------------------+\n' +
        '```\n' +
        '**Role:** ' + roleText
      )
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop v16.0 FAST' });

    embed.addFields({
      name: 'Ai cung dung duoc',
      value: [
        '**Utility:** `/help` `/ping` `/uptime` `/botinfo` `/serverinfo` `/serverstats`',
        '**Info:** `/userinfo` `/roleinfo` `/channelinfo`',
        '**Fun:** `/fun` `/dice` `/coinflip` `/8ball` `/avatar` `/poll` `/meme` `/quote` `/cat` `/dog` `/joke` `/fact`',
        '**Social:** `/ship` `/hug` `/slap` `/pat` `/kiss`',
        '**Tool:** `/weather` `/shorturl`',
        '**Economy:** `/daily` `/work` `/balance` `/pay` `/gamble` `/leaderboard`',
        '**XP:** `/top` `/rank`'
      ].join('\n'),
      inline: false
    });

    if (member) {
      embed.addFields({
        name: 'AI-STV Member',
        value: '**May ao:** `/taomay` `/xoamay` `/infomay`',
        inline: false
      });
    }

    if (mod) {
      embed.addFields({
        name: 'Mod',
        value: '**Moderation:** `/warn` `/warnings` `/kick` `/ban` `/mute` `/unmute` `/purge` `/slowmode` `/lock` `/unlock`',
        inline: false
      });
    }

    if (admin) {
      embed.addFields({
        name: 'ADMIN / Owner',
        value: [
          '**Quan ly:** `/danhsach` `/status` `/stop` `/log` `/addtime`',
          '**Cau hinh:** `/setlog` `/setwelcome` `/givexp` `/resetxp`'
        ].join('\n'),
        inline: false
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('GitHub').setStyle(ButtonStyle.Link).setURL('https://github.com/' + process.env.GH_OWNER + '/' + process.env.GH_REPO),
      new ButtonBuilder().setLabel('Actions').setStyle(ButtonStyle.Link).setURL('https://github.com/' + process.env.GH_OWNER + '/' + process.env.GH_REPO + '/actions')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};