import { logger } from '../utils/logger.js';

export const name = 'ready';
export const once = true;

export function execute(client) {
  logger.info(`✅ Bot online sebagai: ${client.user.tag}`);
  logger.info(`📡 Terhubung ke ${client.guilds.cache.size} server`);

  client.user.setPresence({
    status: 'online',
    activities: [{ name: '🎮 Jual Robux | /setup-shop', type: 0 }],
  });
}
