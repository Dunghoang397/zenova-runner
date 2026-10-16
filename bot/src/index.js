// ZENOVA SHOP - Bot v12 FINAL
import 'dotenv/config';
import {
  Client, GatewayIntentBits, Collection, Events, REST, Routes, ActivityType
} from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger } from './lib/logger.js';
import { addXpWithCooldown } from './lib/xp.js';
import { logToChannel } from './lib/logger_channel.js';
import { sendWelcome } from './lib/welcome.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID', 'GH_TOKEN', 'GH_OWNER', 'GH_REPO'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  logger.err('Thieu env: ' + missing.join(', '));
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

const cmdPath = join(__dirname, 'commands');
const cmdFiles = readdirSync(cmdPath).filter(f => f.endsWith('.js'));
const slashData = [];

for (const file of cmdFiles) {
  try {
    const mod = await import(`file://${join(cmdPath, file)}`);
    const cmd = mod.default;
    if (cmd?.data) {
      client.commands.set(cmd.data.name, cmd);
      slashData.push(cmd.data.toJSON());
      logger.info('Loaded: /' + cmd.data.name);
    }
  } catch (e) {
    logger.err('Load ' + file + ' fail: ' + e.message);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
try {
  logger.info('Deploy ' + slashData.length + ' slash commands...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
    { body: slashData }
  );
  logger.ok('Deploy slash commands OK');
} catch (e) {
  logger.err('Deploy fail: ' + e.message);
  process.exit(1);
}

client.once(Events.ClientReady, async (c) => {
  logger.ok('Bot online: ' + c.user.tag);
  logger.info('Guilds: ' + c.guilds.cache.size);
  logger.info('Commands: ' + c.commands.size);

  c.guilds.cache.forEach(g => logger.info('  Guild: ' + g.name + ' (' + g.id + ')'));

  const statuses = [
    { name: 'Zenova Shop', type: ActivityType.Playing },
    { name: '/taomay | Zenova', type: ActivityType.Listening },
    { name: c.guilds.cache.size + ' servers', type: ActivityType.Watching },
    { name: 'May ao Cloud', type: ActivityType.Competing }
  ];
  let idx = 0;
  c.user.setPresence({ activities: [statuses[0]], status: 'online' });
  setInterval(() => {
    idx = (idx + 1) % statuses.length;
    c.user.setPresence({ activities: [statuses[idx]], status: 'online' });
  }, 30000);

  await logToChannel(c, 'success', 'Zenova Shop v12 khoi dong',
    'Bot da online\n**' + c.commands.size + '** commands | **' + c.guilds.cache.size + '** servers');
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (channelId) await sendWelcome(member, channelId);
    await logToChannel(client, 'info', 'Member moi',
      member.user.tag + ' vua tham gia', [
        { name: 'User', value: member.toString(), inline: true },
        { name: 'Tao tai khoan', value: '<t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>', inline: true }
      ]);
  } catch (e) {
    logger.err('Welcome fail: ' + e.message);
  }
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const result = addXpWithCooldown(message.author.id, 1);
  if (result?.leveledUp) {
    message.reply({
      embeds: [{
        color: 0xfacc15,
        title: 'Level Up!',
        description: message.author + ' da len **Level ' + result.newLevel + '**!'
      }]
    }).catch(() => {});

    logToChannel(client, 'xp', 'Level Up',
      message.author.tag + ' len level ' + result.newLevel, [
        { name: 'User', value: message.author.toString(), inline: true },
        { name: 'XP', value: String(result.user.xp), inline: true }
      ]);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    const cmdId = interaction.customId || interaction.commandName || 'unknown';
    logger.info('>>> INTERACTION: ' + interaction.type + ' | ' + interaction.user.tag + ' | ' + cmdId);

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) {
        logger.warn('Command khong tim thay: ' + interaction.commandName);
        return;
      }
      logger.cmd(interaction.user.tag + ': /' + interaction.commandName);
      await cmd.execute(interaction);
      return;
    }

    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd?.autocomplete) {
        await cmd.autocomplete(interaction).catch(() => {});
      }
      return;
    }

    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      const [prefix, ...rest] = interaction.customId.split(':');
      logger.cmd(interaction.user.tag + ': [' + interaction.customId + '] prefix=' + prefix);

      const handler = client.commands.get(prefix);
      if (!handler) {
        logger.warn('Handler khong tim thay: ' + prefix);
        return;
      }
      if (!handler.handleComponent) {
        logger.warn('Handler khong co handleComponent: ' + prefix);
        return;
      }

      await handler.handleComponent(interaction, rest);
    }
  } catch (e) {
    logger.err('Interaction fail: ' + e.message);
    logger.err('Stack: ' + (e.stack || ''));
    const msg = { content: 'Loi: `' + e.message + '`', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch {}
  }
});

process.on('SIGINT', () => { logger.warn('SIGINT'); client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { logger.warn('SIGTERM'); client.destroy(); process.exit(0); });
process.on('unhandledRejection', (e) => logger.err('Unhandled: ' + e));
process.on('uncaughtException', (e) => logger.err('Uncaught: ' + e.message + '\n' + e.stack));

client.login(process.env.DISCORD_TOKEN);