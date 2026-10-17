// ZENOVA - /slap (with GIF)
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

async function fetchGif(query) {
  try {
    const res = await fetch('https://g.tenor.com/v1/search?q=' + encodeURIComponent(query) + '&key=LIVDSRZULELA&limit=20&media_filter=minimal&contentfilter=high');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || !data.results.length) return null;
    const pick = data.results[Math.floor(Math.random() * data.results.length)];
    return pick.media?.[0]?.gif?.url || pick.media?.[0]?.tinygif?.url;
  } catch { return null; }
}

export default {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone (with GIF)')
    .addUserOption(o => o.setName('user').setDescription('User to slap').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    const gif = await fetchGif('anime slap');

    const embed = new EmbedBuilder()
      .setColor(COLORS.danger)
      .setDescription('**' + interaction.user.username + '** slaps **' + user.username + '**!')
      .setTimestamp();

    if (gif) embed.setImage(gif);

    await interaction.editReply({ content: user.toString(), embeds: [embed] });
  }
};