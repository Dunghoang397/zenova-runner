// ZENOVA SHOP - /avatar - Xem avatar
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Xem avatar cua ai do')
    .addUserOption(o => o
      .setName('user')
      .setDescription('User can xem (bo trong = xem minh)')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const globalAvatar = user.displayAvatarURL({ size: 4096, extension: 'png' });
    const serverAvatar = member?.displayAvatarURL({ size: 4096, extension: 'png' }) || globalAvatar;

    const embed = new EmbedBuilder()
      .setTitle(`Avatar - ${user.username}`)
      .setColor(0x8b5cf6)
      .setImage(serverAvatar)
      .setDescription(`[Mo anh goc](${serverAvatar})`)
      .setFooter({ text: `Yeu cau boi ${interaction.user.username}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Avatar toan cau')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL(globalAvatar),
      new ButtonBuilder()
        .setLabel('Avatar server')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Link)
        .setURL(serverAvatar)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};