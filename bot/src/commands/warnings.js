import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getWarnings, clearWarnings } from '../lib/moderation.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Xem danh sach canh cao')
    .addUserOption(o => o.setName('user').setDescription('Nguoi dung').setRequired(true))
    .addBooleanOption(o => o.setName('clear').setDescription('Xoa het warn?')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser('user');
    const clear = interaction.options.getBoolean('clear');

    if (clear) {
      const count = clearWarnings(interaction.guild.id, user.id);
      return interaction.editReply({ content: `Da xoa ${count} warn cua ${user.tag}.` });
    }

    const warns = getWarnings(interaction.guild.id, user.id);
    if (!warns.length) return interaction.editReply({ content: `${user.tag} khong co warn nao.` });

    const lines = warns.slice(0, 15).map((w, i) =>
      `**${i + 1}.** \`${w.id}\` | <@${w.modId}> | ${w.reason} | <t:${Math.floor(new Date(w.at).getTime() / 1000)}:R>`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`Warnings: ${user.tag}`)
      .setColor(COLORS.warning)
      .setDescription(lines)
      .setFooter({ text: `Tong ${warns.length} warn` });

    await interaction.editReply({ embeds: [embed] });
  }
};