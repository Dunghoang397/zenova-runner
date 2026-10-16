import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Do do hop nhau')
    .addUserOption(o => o.setName('user1').setDescription('Nguoi 1').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Nguoi 2')),

  async execute(interaction) {
    await interaction.deferReply();
    const u1 = interaction.options.getUser('user1');
    const u2 = interaction.options.getUser('user2') || interaction.user;

    const hash = (u1.id + u2.id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const pct = (hash % 101);
    const filled = Math.round(pct / 5);
    const bar = '`' + '▰'.repeat(filled) + '▱'.repeat(20 - filled) + '`';

    const emoji = pct >= 90 ? 'Perfect match!' : pct >= 70 ? 'Rat hop!' : pct >= 50 ? 'On day!' : pct >= 30 ? 'Thu xem sao' : 'Kho do';

    const embed = new EmbedBuilder()
      .setTitle('Ship do')
      .setColor(pct >= 70 ? COLORS.success : pct >= 50 ? COLORS.warning : COLORS.danger)
      .setDescription(u1.toString() + ' + ' + u2.toString() + '\n\n' + bar + ' **' + pct + '%**\n\n' + emoji)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  }
};