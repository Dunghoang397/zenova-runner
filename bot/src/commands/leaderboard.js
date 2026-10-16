import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTop } from '../lib/economy.js';
import { COLORS } from '../ui/embeds.js';

const MEDALS = [':first_place:', ':second_place:', ':third_place:'];

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Bang xep hang giau co')
    .addIntegerOption(o => o.setName('limit').setDescription('So nguoi (1-25)').setMinValue(1).setMaxValue(25)),

  async execute(interaction) {
    await interaction.deferReply();
    const limit = interaction.options.getInteger('limit') || 10;
    const top = getTop(limit);

    if (!top.length) return interaction.editReply({ content: 'Chua co ai.' });

    const lines = await Promise.all(top.map(async (u, i) => {
      const medal = MEDALS[i] || `**#${i + 1}**`;
      let name = `User ${u.userId}`;
      try {
        const member = await interaction.guild.members.fetch(u.userId).catch(() => null);
        if (member) name = member.user.username;
      } catch {}
      return `${medal} **${name}** — ${u.total} Zen`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('Bang xep hang giau co')
      .setColor(COLORS.gold)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Top ${top.length}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};