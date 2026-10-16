import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, getBalance } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Xem so du')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung')),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    const u = getUser(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`Vi cua ${user.username}`)
      .setColor(COLORS.gold)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Tien mat', value: `**${u.balance}** Zen`, inline: true },
        { name: 'Ngan hang', value: `**${u.bank}** Zen`, inline: true },
        { name: 'Tong', value: `**${u.balance + u.bank}** Zen`, inline: true },
        { name: 'Tong kiem duoc', value: `${u.totalEarned} Zen`, inline: true },
        { name: 'Chuoi daily', value: `${u.streak || 0} ngay`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};