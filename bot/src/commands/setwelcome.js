// ZENOVA SHOP - /setwelcome - Dat kenh welcome (ADMIN)
import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { isAdmin } from '../lib/security.js';

let welcomeChannelId = process.env.WELCOME_CHANNEL_ID || null;

export function getWelcomeChannel() {
  return welcomeChannelId;
}

export function setWelcomeChannel(id) {
  welcomeChannelId = id;
}

export default {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('[ADMIN] Dat kenh welcome')
    .addChannelOption(o => o
      .setName('channel')
      .setDescription('Kenh welcome (bo trong = tat)')
      .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!isAdmin(interaction)) {
      return interaction.editReply({
        embeds: [{ color: 0xef4444, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }],
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      setWelcomeChannel(null);
      return interaction.editReply({ content: 'Da **tat** welcome channel.', ephemeral: true });
    }

    setWelcomeChannel(channel.id);

    const embed = new EmbedBuilder()
      .setTitle('Da dat welcome channel')
      .setColor(0x10b981)
      .setDescription(`Member moi se duoc chao o ${channel}`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], ephemeral: true });
  }
};