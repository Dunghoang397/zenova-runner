// ZENOVA SHOP - Bot Entry Point
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

// Kiem tra env bat buoc
const REQUIRED = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_GUILD_ID',
  'GH_TOKEN',
  'GH_OWNER',
  'GH_REPO'
];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  logger.err('Thieu env: ' + missing.join(', '));
  process.exit(1);
}

// Tao client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// Load commands
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

// Deploy slash commands
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

// Event: Ready
client.once(Events.ClientReady, async (c) => {
  logger.ok('Bot online: ' + c.user.tag);
  logger.info('Guilds: ' + c.guilds.cache.size);
  logger.info('Commands: ' + c.commands.size);

  // Rotating status
  const statuses = [
    { name: 'Zenova Shop', type: ActivityType.Playing },
    { name: '/menu | Zenova', type: ActivityType.Listening },
    { name: c.guilds.cache.size + ' servers', type: ActivityType.Watching },
    { name: 'May ao Cloud', type: ActivityType.Competing }
  ];
  let idx = 0;
  c.user.setPresence({ activities: [statuses[0]], status: 'online' });
  setInterval(() => {
    idx = (idx + 1) % statuses.length;
    c.user.setPresence({ activities: [statuses[idx]], status: 'online' });
  }, 30000);

  // Log khoi dong
  await logToChannel(c, 'success', 'Zenova Shop khoi dong',
    'Bot da online\n**' + c.commands.size + '** commands | **' + c.guilds.cache.size + '** servers');
});

// Event: Member join
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (channelId) {
      await sendWelcome(member, channelId);
    }
    await logToChannel(client, 'info', 'Member moi',
      member.user.tag + ' vua tham gia', [
        { name: 'User', value: member.toString(), inline: true },
        { name: 'Tao tai khoan', value: '<t:' + Math.floor(member.user.createdTimestamp / 1000) + ':R>', inline: true }
      ]);
  } catch (e) {
    logger.err('Welcome fail: ' + e.message);
  }
});

// Event: Message (XP)
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

// Event: Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      logger.cmd(interaction.user.tag + ': /' + interaction.commandName);
      await cmd.execute(interaction);
      return;
    }

    // Autocomplete
    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd?.autocomplete) {
        await cmd.autocomplete(interaction).catch(() => {});
      }
      return;
    }

    // Buttons / Selects / Modals
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      const [prefix, ...rest] = interaction.customId.split(':');
      const handler = client.commands.get(prefix);
      if (!handler?.handleComponent) return;
      logger.cmd(interaction.user.tag + ': [' + interaction.customId + ']');
      await handler.handleComponent(interaction, rest);
    }
  } catch (e) {
    logger.err('Interaction fail: ' + e.message);
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

// Shutdown
process.on('SIGINT', () => {
  logger.warn('SIGINT - thoat');
  client.destroy();
  process.exit(0);
});
process.on('SIGTERM', () => {
  logger.warn('SIGTERM - thoat');
  client.destroy();
  process.exit(0);
});
process.on('unhandledRejection', (e) => logger.err('Unhandled: ' + e));

// Login
client.login(process.env.DISCORD_TOKEN);