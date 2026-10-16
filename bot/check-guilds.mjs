import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log('');
  console.log('=== BOT ONLINE ===');
  console.log('Bot:', client.user.tag);
  console.log('Bot ID:', client.user.id);
  console.log('');
  console.log('GUILDS (' + client.guilds.cache.size + '):');
  client.guilds.cache.forEach(g => {
    console.log('  - ' + g.name + ' (' + g.id + ')');
  });
  console.log('');
  console.log('DISCORD_GUILD_ID trong .env: ' + process.env.DISCORD_GUILD_ID);
  console.log('');

  const hasEnvGuild = client.guilds.cache.has(process.env.DISCORD_GUILD_ID);
  if (hasEnvGuild) {
    console.log('OK - Bot CO trong guild tu .env');
  } else {
    console.log('LOI - Bot KHONG trong guild tu .env!');
    console.log('  -> Bot khong o server ma .env chi dinh');
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);