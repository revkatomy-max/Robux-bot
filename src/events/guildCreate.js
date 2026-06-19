import { GuildConfig } from '../database/db.js';
import { logger } from '../utils/logger.js';

export const name = 'guildCreate';
export const once = false;

export function execute(guild) {
  logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
  GuildConfig.getOrCreate(guild.id);
}
