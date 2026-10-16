// ZENOVA SHOP - /top - Bang xep hang XP
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTop, xpToLevel } from '../lib/xp.js';

const MEDALS = [':first_place:', ':second_place:', ':third_place:'];

export default {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Bang xep hang XP')
    .addIntegerOption(o => o
      .setName('soluong')
      .setDescription('So nguoi hien thi (1-25, mac dinh 10)')
      .setMinValue(1)
      .setMaxValue(25)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const limit = interaction.options.getInteger('soluong') || 10;
    const top = getTop(limit);

    if (!top.length) {
      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(0x6366f1)
          .setDescription('Chua co ai co XP. Chat nhieu len nao!')]
      });
    }

    const lines = await Promise.all(top.map(async (u, i) => {
      const medal = MEDALS[i] || `**#${i + 1}**`;
      const level = xpToLevel(u.xp);
      let username = `User ${u.userId}`;
      try {
        const member = await interaction.guild.members.fetch(u.userId).catch(() => null);
        if (member) username = member.user.username;
      } catch {}
      return `${medal} **${username}** - Level **${level}** (${u.xp} XP)`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('Bang xep hang XP')
      .setColor(0xfacc15)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Top ${top.length} | Chat +1 XP/phut` })
      .setTimestamp();

    const allTop = getTop(1000);
    const myIndex = allTop.findIndex(u => u.userId === interaction.user.id);
    if (myIndex >= 0 && myIndex >= top.length) {
      const myData = allTop[myIndex];
      const myLevel = xpToLevel(myData.xp);
      embed.addFields({
        name: 'Vi tri cua ban',
        value: `#${myIndex + 1} - Level **${myLevel}** (${myData.xp} XP)`,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};