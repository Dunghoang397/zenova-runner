// ZENOVA SHOP - /botinfo - Thong tin bot
import { SlashCommandBuilder, EmbedBuilder, version as djsVersion } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Thong tin ve bot'),

  async execute(interaction) {
    const c = interaction.client;
    const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle('ZENOVA SHOP BOT')
      .setColor(0x3b82f6)
      .setDescription('Bot quan ly may ao Zenova qua GitHub Actions')
      .setThumbnail(c.user.displayAvatarURL())
      .addFields(
        { name: 'Ten bot', value: `\`${c.user.tag}\``, inline: true },
        { name: 'ID', value: `\`${c.user.id}\``, inline: true },
        { name: 'Tao luc', value: `<t:${Math.floor(c.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Servers', value: `**${c.guilds.cache.size}**`, inline: true },
        { name: 'Users', value: `**${c.users.cache.size}**`, inline: true },
        { name: 'Commands', value: `**${c.commands.size}**`, inline: true },
        { name: 'discord.js', value: `v${djsVersion}`, inline: true },
        { name: 'Node.js', value: `${process.version}`, inline: true },
        { name: 'RAM', value: `\`${memMB} MB\``, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Prompt by ALB SCRIPT | v8.0' });

    await interaction.reply({ embeds: [embed] });
  }
};