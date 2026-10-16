// ZENOVA SHOP - /resetxp - Reset XP user (ADMIN)
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { isAdmin } from '../lib/security.js';
import { resetXp } from '../lib/xp.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('[ADMIN] Reset XP cua user')
    .addUserOption(o => o
      .setName('user')
      .setDescription('User can reset')
      .setRequired(true)
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
    const ok = resetXp(user.id);

    const embed = new EmbedBuilder()
      .setTitle(ok ? 'Da reset XP' : 'User chua co XP')
      .setColor(ok ? 0x10b981 : 0xf59e0b)
      .setDescription(ok ? `Da reset XP cua ${user}` : `${user} chua tung co XP.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};