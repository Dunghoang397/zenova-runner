import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { work } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

function fmtMs(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Lam viec kiem tien'),

  async execute(interaction) {
    await interaction.deferReply();
    const result = work(interaction.user.id);

    if (!result.success) {
      return interaction.editReply({ embeds: [new EmbedBuilder()
        .setColor(COLORS.warning)
        .setDescription(`Met roi! Nghi ngoi **${fmtMs(result.remain)}** di.`)] });
    }

    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(COLORS.success)
      .setTitle('Lam viec xong!')
      .setDescription(`Ban da **${result.job}** va kiem duoc **+${result.amount} Zen**!`)
      .setFooter({ text: 'Quay lai sau 1 gio' })] });
  }
};