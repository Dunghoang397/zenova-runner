// ZENOVA SHOP - /givexp - Cong XP (ADMIN)
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin } from '../lib/security.js';
import { addXp, xpToLevel } from '../lib/xp.js';

export default {
  data: new SlashCommandBuilder()
    .setName('givexp')
    .setDescription('[ADMIN] Cong XP cho user')
    .addUserOption(o => o
      .setName('user')
      .setDescription('User can cong')
      .setRequired(true)
    )
    .addIntegerOption(o => o
      .setName('xp')
      .setDescription('So XP (co the am de tru)')
      .setRequired(true)
      .setMinValue(-100000)
      .setMaxValue(100000)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: 0xef4444, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }],
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('xp');

    const { user: updated, oldLevel, newLevel, leveledUp } = addXp(user.id, amount, 'admin');

    const embed = new EmbedBuilder()
      .setTitle('Da cong XP')
      .setColor(0xfacc15)
      .addFields(
        { name: 'User', value: `${user}`, inline: true },
        { name: 'XP', value: `**${amount > 0 ? '+' : ''}${amount}**`, inline: true },
        { name: 'Tong XP', value: `**${updated.xp}**`, inline: true },
        { name: 'Level', value: `**${xpToLevel(updated.xp)}**`, inline: true }
      )
      .setTimestamp();

    if (leveledUp) {
      embed.setFooter({ text: `Level up! ${oldLevel} -> ${newLevel}` });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};