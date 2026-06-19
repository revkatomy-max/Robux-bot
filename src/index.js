import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { connectDB } from './handlers/db.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { deployCommands } from './deploy-commands.js';
import { logger } from './utils/logger.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

async function main() {
  logger.info('🚀 Memulai Robux Bot...');

  connectDB(); // synchronous dengan SQLite
  await loadCommands(client);
  await loadEvents(client);
  await deployCommands(); // auto-register slash commands tiap startup

  const token = process.env.DISCORD_TOKEN;
  if (!token) { logger.error('DISCORD_TOKEN tidak ditemukan!'); process.exit(1); }

  await client.login(token);
}

main().catch(err => { logger.error('Fatal error:', err); process.exit(1); });

process.on('SIGINT', () => { logger.info('Shutting down...'); client.destroy(); process.exit(0); });
process.on('unhandledRejection', err => logger.error('Unhandled rejection:', err));