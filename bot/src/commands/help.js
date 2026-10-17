// ZENOVA - /help (English)
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../ui/embeds.js';
import { isAdmin, isMod, isMember } from '../lib/security.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Show help menu'),

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
      .setTitle('ZENOVA SHOP v19 - HELP')
      .setColor(color)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setDescription('```\n+----------------------------------------------+\n|          ZENOVA SHOP  -  HELP v19            |\n+----------------------------------------------+\n```\n**Your role:** ' + roleText)
      .setTimestamp()
      .setFooter({ text: 'Zenova Shop v19 ULTRA' });

    embed.addFields({
      name: 'For Everyone',
      value: [
        '**Utility:** `/help` `/ping` `/uptime` `/botinfo` `/serverinfo` `/serverstats`',
        '**Info:** `/userinfo` `/roleinfo` `/channelinfo`',
        '**Fun:** `/fun` `/dice` `/coinflip` `/8ball` `/avatar` `/poll` `/meme` `/quote` `/cat` `/dog` `/joke` `/fact`',
        '**Social (GIF):** `/hug` `/kiss` `/slap` `/pat` `/ship`',
        '**Tool:** `/weather` `/shorturl`',
        '**Economy:** `/daily` `/work` `/balance` `/pay` `/gamble` `/leaderboard`',
        '**XP:** `/top` `/rank`'
      ].join('\n'),
      inline: false
    });

    if (member) {
      embed.addFields({
        name: 'AI-STV Member',
        value: '**VM:** `/create` `/delete` `/info` `/transfer`',
        inline: false
      });
    }

    if (mod) {
      embed.addFields({
        name: 'Moderator',
        value: '**Mod:** `/warn` `/warnings` `/kick` `/ban` `/mute` `/unmute` `/purge` `/slowmode` `/lock` `/unlock`',
        inline: false
      });
    }

    if (admin) {
      embed.addFields({
        name: 'Admin / Owner',
        value: [
          '**Manage:** `/list` `/status` `/stop` `/log` `/extend`',
          '**Config:** `/setlog` `/setwelcome` `/givexp` `/resetxp`'
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