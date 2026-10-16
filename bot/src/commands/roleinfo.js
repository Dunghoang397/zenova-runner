import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Thong tin role')
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const role = interaction.options.getRole('role');
    const embed = new EmbedBuilder()
      .setTitle('Role: ' + role.name)
      .setColor(role.color || COLORS.primary)
      .addFields(
        { name: 'ID', value: '`' + role.id + '`', inline: true },
        { name: 'Color', value: '`' + (role.hexColor || '0') + '`', inline: true },
        { name: 'Members', value: role.members.size + '', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Co' : 'Khong', inline: true },
        { name: 'Hoist', value: role.hoist ? 'Co' : 'Khong', inline: true },
        { name: 'Managed', value: role.managed ? 'Co' : 'Khong', inline: true },
        { name: 'Tao luc', value: '<t:' + Math.floor(role.createdTimestamp / 1000) + ':R>', inline: false }
      )
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};