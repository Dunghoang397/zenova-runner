// ZENOVA SHOP - Welcome System
import { EmbedBuilder } from 'discord.js';

export async function sendWelcome(member, channelId) {
  if (!channelId) return;
  try {
    const channel = await member.guild.channels.fetch(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('Chao mung member moi den voi ZENOVA SHOP!')
      .setColor(0x10b981)
      .setDescription(
        'Xin chao ' + member.toString() + ' da den voi **Zenova Shop**!\n\n' +
        '**Bat dau:**\n' +
        '- Go /help de xem huong dan\n' +
        '- Doi admin gan role **AI-STV Member**\n' +
        '- Dung /menu de mo bang dieu khien\n\n' +
        '**Luat choi:**\n' +
        '- 1 nguoi 1 may\n' +
        '- Thoi gian mac dinh: 6h\n' +
        '- Chi xoa duoc may cua minh'
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp()
      .setFooter({ text: 'Member #' + member.guild.memberCount });

    await channel.send({ content: member.toString(), embeds: [embed] });
  } catch (e) {
    console.error('Welcome fail:', e.message);
  }
}