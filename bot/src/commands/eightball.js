// ZENOVA SHOP - /8ball - Bong ma tra loi
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const ANSWERS = [
  { text: 'Chac chan roi!', color: 0x10b981 },
  { text: 'Khong nghi ngo gi nua!', color: 0x10b981 },
  { text: 'Co, chac chan luon!', color: 0x10b981 },
  { text: 'Theo tao thi co!', color: 0x10b981 },
  { text: 'Rat co the!', color: 0x10b981 },
  { text: 'Tao khong chac lam...', color: 0xf59e0b },
  { text: 'Hoi lai sau di!', color: 0xf59e0b },
  { text: 'Kho noi a nha...', color: 0xf59e0b },
  { text: 'Tap trung roi hoi lai!', color: 0xf59e0b },
  { text: 'Co the, co the khong...', color: 0xf59e0b },
  { text: 'Khong dau!', color: 0xef4444 },
  { text: 'Dung mo!', color: 0xef4444 },
  { text: 'Khong phai luc nay!', color: 0xef4444 },
  { text: 'Tao nghi la KHONG!', color: 0xef4444 },
  { text: 'Trien vong khong tot...', color: 0xef4444 }
];

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Hoi bong ma')
    .addStringOption(o => o
      .setName('cauhoi')
      .setDescription('Cau hoi cua ban')
      .setRequired(true)
      .setMaxLength(200)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('cauhoi');
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];

    const embed = new EmbedBuilder()
      .setTitle('Bong ma tra loi')
      .setColor(answer.color)
      .addFields(
        { name: 'Cau hoi', value: `*${question}*`, inline: false },
        { name: 'Tra loi', value: `**${answer.text}**`, inline: false }
      )
      .setFooter({ text: `Boi ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};