import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../ui/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Thoi tiet')
    .addStringOption(o => o.setName('city').setDescription('Thanh pho').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const city = interaction.options.getString('city');
    try {
      const res = await fetch('https://wttr.in/' + encodeURIComponent(city) + '?format=j1');
      const data = await res.json();
      const c = data.current_condition[0];
      const area = data.nearest_area[0];

      const embed = new EmbedBuilder()
        .setTitle('Thoi tiet: ' + area.areaName[0].value)
        .setColor(COLORS.info)
        .addFields(
          { name: 'Nhiet do', value: c.temp_C + '°C (cam giac ' + c.FeelsLikeC + '°C)', inline: true },
          { name: 'Trang thai', value: c.weatherDesc[0].value, inline: true },
          { name: 'Do am', value: c.humidity + '%', inline: true },
          { name: 'Gio', value: c.windspeedKmph + ' km/h', inline: true },
          { name: 'Tam nhin', value: c.visibility + ' km', inline: true },
          { name: 'Ap suat', value: c.pressure + ' mb', inline: true }
        )
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e) {
      await interaction.editReply({ content: 'Khong lay duoc thoi tiet.' });
    }
  }
};