// ZENOVA SHOP - /setlog - Dat kenh log (ADMIN)
import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import { isAdmin } from '../lib/security.js';
import { setLogChannel } from '../lib/logger_channel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('[ADMIN] Dat kenh log')
    .addChannelOption(o => o
      .setName('channel')
      .setDescription('Kenh nhan log (bo trong = tat)')
      .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({
        embeds: [{ color: 0xef4444, title: 'Chi Admin', description: 'Can role **AI-STV Admin**.' }],
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      setLogChannel(null);
      return interaction.reply({ content: 'Da **tat** log channel.', ephemeral: true });
    }

    setLogChannel(channel.id);

    const embed = new EmbedBuilder()
      .setTitle('Da dat log channel')
      .setColor(0x10b981)
      .setDescription(`Bot se gui log vao ${channel}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    await channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('Log channel da kich hoat')
        .setDescription('Tu gio bot se thong bao moi hoat dong quan trong o day.')
        .setTimestamp()]
    }).catch(() => {});
  }
};