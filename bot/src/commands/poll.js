// ZENOVA SHOP - /poll - Tao binh chon
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const NUM_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Tao binh chon')
    .addStringOption(o => o
      .setName('cauhoi')
      .setDescription('Cau hoi')
      .setRequired(true)
      .setMaxLength(200)
    )
    .addStringOption(o => o
      .setName('luachon')
      .setDescription('Cac lua chon (cach nhau dau |, toi da 10)')
      .setRequired(true)
      .setMaxLength(800)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('cauhoi');
    const rawChoices = interaction.options.getString('luachon');
    const choices = rawChoices.split('|').map(s => s.trim()).filter(Boolean).slice(0, 10);

    if (choices.length < 2) {
      return interaction.reply({
        content: 'Can it nhat 2 lua chon. Ngan cach bang `|` (VD: `Co|Khong|Khong biet`)',
        ephemeral: true
      });
    }

    const desc = choices.map((c, i) => `${NUM_EMOJI[i]} ${c}`).join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(question)
      .setColor(0x8b5cf6)
      .setDescription(desc)
      .setFooter({ text: `Poll boi ${interaction.user.username} - Vote bang emoji ben duoi` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < choices.length; i++) {
      await msg.react(NUM_EMOJI[i]).catch(() => {});
    }
  }
};