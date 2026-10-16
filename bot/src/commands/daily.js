import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { claimDaily } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Nhan thuong hang ngay'),

  async execute(interaction) {
    await interaction.deferReply();
    const result = claimDaily(interaction.user.id);

    if (!result.success) {
      return interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('Chua the nhan')
        .setDescription(`Quay lai sau **${fmtMs(result.remain)}**.`)] });
    }

    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle('Diem danh thanh cong!')
      .addFields(
        { name: 'Nhan duoc', value: `**+${result.amount}** Zen`, inline: true },
        { name: 'Chuoi', value: `**${result.streak}** ngay`, inline: true }
      )
      .setFooter({ text: 'Quay lai moi ngay de tang bonus' })] });
  }
};