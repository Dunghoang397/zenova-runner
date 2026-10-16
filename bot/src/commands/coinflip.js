// ZENOVA SHOP - /coinflip - Tung dong xu
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Tung dong xu')
    .addStringOption(o => o
      .setName('chon')
      .setDescription('Sap hay Ngua?')
      .addChoices(
        { name: 'Sap (heads)', value: 'heads' },
        { name: 'Ngua (tails)', value: 'tails' }
      )
    ),

  async execute(interaction) {
    const choice = interaction.options.getString('chon');
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const resultEmoji = result === 'heads' ? ':crown:' : ':star:';
    const resultName = result === 'heads' ? 'Sap' : 'Ngua';

    let description = `${resultEmoji} **${resultName}**`;
    let color = 0x8b5cf6;

    if (choice) {
      const won = choice === result;
      description += `\n\n${won ? '**Ban thang!**' : '**Ban thua!**'}`;
      description += `\nBan chon: **${choice === 'heads' ? 'Sap' : 'Ngua'}**`;
      color = won ? 0x10b981 : 0xef4444;
    }

    const embed = new EmbedBuilder()
      .setTitle('Tung dong xu')
      .setColor(color)
      .setDescription(description)
      .setFooter({ text: `Boi ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};