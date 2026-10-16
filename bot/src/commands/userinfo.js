import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Thong tin thanh vien')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung')),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle('User: ' + user.tag)
      .setColor(COLORS.primary)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: '`' + user.id + '`', inline: true },
        { name: 'Bot?', value: user.bot ? 'Co' : 'Khong', inline: true },
        { name: 'Tao tai khoan', value: '<t:' + Math.floor(user.createdTimestamp / 1000) + ':R>', inline: true },
        { name: 'Tham gia', value: member ? '<t:' + Math.floor(member.joinedTimestamp / 1000) + ':R>' : '?', inline: true },
        { name: 'Nickname', value: member?.nickname || '(khong co)', inline: true },
        { name: 'Roles', value: member ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(' ') || 'Khong co' : '?', inline: false }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};