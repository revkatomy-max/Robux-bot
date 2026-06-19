import { GuildConfig } from '../database/db.js';

export function isAdmin(member, guildId) {
  if (member.permissions.has('Administrator')) return true;
  const config = GuildConfig.get(guildId);
  if (!config?.admin_role_id) return false;
  return member.roles.cache.has(config.admin_role_id);
}

export function isSeller(member, guildId) {
  if (member.permissions.has('Administrator')) return true;
  const config = GuildConfig.get(guildId);
  if (!config) return false;
  if (config.admin_role_id && member.roles.cache.has(config.admin_role_id)) return true;
  if (config.seller_role_id && member.roles.cache.has(config.seller_role_id)) return true;
  return false;
}

export function getOrCreateConfig(guildId) {
  return GuildConfig.getOrCreate(guildId);
}
