import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { transfer, getUser } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Chuyen tien cho nguoi khac')
    .addUserOption(o => o.setName('user').setDescription('Nguoi nhan').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('So tien').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) return interaction.editReply({ content: 'Khong the tu chuyen.' });
    if (target.bot) return interaction.editReply({ content: 'Khong the chuyen cho bot.' });

    const r = transfer(interaction.user.id, target.id, amount);
    if (!r.success) return interaction.editReply({ content: `Loi: ${r.error}` });

    const me = getUser(interaction.user.id);
    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle('Chuyen tien thanh cong')
      .addFields(
        { name: 'Tu', value: interaction.user.tag, inline: true },
        { name: 'Den', value: target.tag, inline: true },
        { name: 'So tien', value: `${amount} Zen`, inline: true },
        { name: 'So du con lai', value: `${me.balance} Zen`, inline: true }
      )] });
  }
};