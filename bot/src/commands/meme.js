// ZENOVA SHOP - /meme - Random meme
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Random meme vui'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch('https://meme-api.com/gimme');
      if (!res.ok) throw new Error('API fail');

      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle(data.title || 'Random meme')
        .setColor(0xf59e0b)
        .setImage(data.url)
        .setFooter({ text: `r/${data.subreddit || 'memes'} | ${data.ups || 0} ups` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      const MEMES = [
        'Tai sao lap trinh vien thich troi toi?\n-> Toi roi moi thay duoc bugs',
        'Co 10 loai nguoi:\n1. Hieu nhi phan\n2. Khong hieu',
        'Lap trinh vien: "Code chay duoc roi!"\nCode: *crash ngay sau do*',
        'Bug khong phai loi, do la feature chua duoc document',
        'Co 2 loai code:\n- Code ban viet\n- Code ban hieu'
      ];
      const meme = MEMES[Math.floor(Math.random() * MEMES.length)];

      const embed = new EmbedBuilder()
        .setTitle('Meme vui')
        .setColor(0xf59e0b)
        .setDescription(meme)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
};