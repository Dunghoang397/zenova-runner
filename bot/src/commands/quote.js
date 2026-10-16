// ZENOVA SHOP - /quote - Random cau noi
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const QUOTES = [
  { text: 'Thanh cong khong phai la dich den, ma la hanh trinh.', author: 'Khuyet danh' },
  { text: 'Hom nay kho khan, ngay mai se tot hon.', author: 'Khuyet danh' },
  { text: 'Dung so that bai. Hay so viec khong co gang.', author: 'Khuyet danh' },
  { text: 'Hoc, hoc nua, hoc mai.', author: 'Lenin' },
  { text: 'Neu ban muon di nhanh, hay di mot minh. Muon di xa, hay di cung nhau.', author: 'Tuc ngu chau Phi' },
  { text: 'Cach tot nhat de du doan tuong lai la tao ra no.', author: 'Abraham Lincoln' },
  { text: 'Khong co gi quy hon doc lap, tu do.', author: 'Ho Chi Minh' },
  { text: 'Cai gi khong giet duoc ta se lam ta manh hon.', author: 'Nietzsche' },
  { text: 'Code khong chay thi doc lai code. Code van khong chay thi di ngu.', author: 'Lap trinh vien khon ngoan' },
  { text: 'Don gian la dinh cao cua su phuc tap.', author: 'Leonardo da Vinci' },
  { text: 'Thoi gian la vang, nhung suc khoe la kim cuong.', author: 'Khuyet danh' },
  { text: 'Nguoi khong mac sai lam la nguoi khong lam gi ca.', author: 'Theodore Roosevelt' }
];

export default {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Random cau noi truyen cam hung'),

  async execute(interaction) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    const embed = new EmbedBuilder()
      .setTitle('Quote of the moment')
      .setColor(0xfacc15)
      .setDescription(`> *"${q.text}"*\n\n- **${q.author}**`)
      .setTimestamp()
      .setFooter({ text: `Cho ${interaction.user.username}` });

    await interaction.reply({ embeds: [embed] });
  }
};