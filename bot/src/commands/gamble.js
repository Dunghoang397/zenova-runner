import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { gamble, getUser } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Danh bac')
    .addIntegerOption(o => o.setName('amount').setDescription('So tien cuoc').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    await interaction.deferReply();
    const amount = interaction.options.getInteger('amount');

    const r = gamble(interaction.user.id, amount);
    if (!r.success) return interaction.editReply({ content: `Loi: ${r.error}` });

    const win = r.win >= 0;
    const u = getUser(interaction.user.id);

    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(win ? COLORS.success : COLORS.danger)
      .setTitle(win ? 'Thang!' : 'Thua!')
      .addFields(
        { name: 'Cuoc', value: `${amount} Zen`, inline: true },
        { name: 'Ket qua', value: win ? `+${r.win} Zen (x${r.multiplier})` : `${r.win} Zen`, inline: true },
        { name: 'So du', value: `${u.balance} Zen`, inline: true }
      )] });
  }
};