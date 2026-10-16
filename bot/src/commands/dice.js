// ZENOVA SHOP - /dice - Tung xuc xac
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Tung xuc xac')
    .addIntegerOption(o => o
      .setName('solan')
      .setDescription('So lan tung (1-10)')
      .setMinValue(1)
      .setMaxValue(10)
    ),

  async execute(interaction) {
    const soLan = interaction.options.getInteger('solan') || 1;
    const rolls = [];
    let total = 0;

    for (let i = 0; i < soLan; i++) {
      const r = Math.floor(Math.random() * 6) + 1;
      rolls.push(r);
      total += r;
    }

    const diceEmoji = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:'];
    const display = rolls.map(r => diceEmoji[r - 1]).join(' ');

    const embed = new EmbedBuilder()
      .setTitle('Tung xuc xac')
      .setColor(0x8b5cf6)
      .setDescription(display)
      .addFields(
        { name: 'Ket qua', value: `\`${rolls.join(', ')}\``, inline: true },
        { name: 'Tong', value: `**${total}**`, inline: true }
      )
      .setFooter({ text: `Boi ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};