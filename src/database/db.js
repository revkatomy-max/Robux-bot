import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { logger } from '../utils/logger.js';

const DB_PATH = process.env.DB_PATH || './data/database.db';

// Pastikan folder ada
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// Performance tweaks
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      price_per_robux INTEGER DEFAULT 120,
      qr_image_url TEXT,
      admin_role_id TEXT,
      seller_role_id TEXT,
      member_role_id TEXT,
      open_ticket_category_id TEXT,
      transaction_log_channel_id TEXT,
      transcript_channel_id TEXT,
      shop_channel_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT UNIQUE NOT NULL,
      buyer_id TEXT NOT NULL,
      buyer_tag TEXT NOT NULL,
      roblox_username TEXT,
      robux_amount INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      claimed_by TEXT,
      claimed_by_tag TEXT,
      status TEXT DEFAULT 'open',
      order_embed_message_id TEXT,
      seller_panel_message_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      ticket_channel_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      buyer_tag TEXT NOT NULL,
      roblox_username TEXT NOT NULL,
      robux_amount INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      seller_id TEXT,
      seller_tag TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  logger.info(`✅ SQLite database siap: ${DB_PATH}`);
}

// ─── Guild Config ─────────────────────────────────────────────────────────────

export const GuildConfig = {
  get(guildId) {
    return db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
  },

  getOrCreate(guildId) {
    let config = this.get(guildId);
    if (!config) {
      db.prepare('INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)').run(guildId);
      config = this.get(guildId);
    }
    return config;
  },

  update(guildId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${toSnake(k)} = ?`).join(', ');
    const values = keys.map(k => fields[k]);
    db.prepare(`
      INSERT INTO guild_config (guild_id) VALUES (?)
      ON CONFLICT(guild_id) DO UPDATE SET ${setClauses}, updated_at = datetime('now')
    `).run(guildId, ...values);
  },
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const Ticket = {
  create(data) {
    const stmt = db.prepare(`
      INSERT INTO tickets (guild_id, channel_id, buyer_id, buyer_tag, roblox_username, robux_amount, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.guildId, data.channelId, data.buyerId, data.buyerTag,
      data.robloxUsername, data.robuxAmount, data.totalPrice,
      data.status || 'open'
    );
    return this.getById(result.lastInsertRowid);
  },

  getById(id) {
    return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  },

  getByChannel(channelId) {
    return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
  },

  getActiveByBuyer(guildId, buyerId) {
    return db.prepare(`
      SELECT * FROM tickets 
      WHERE guild_id = ? AND buyer_id = ? AND status NOT IN ('completed', 'closed')
    `).get(guildId, buyerId);
  },

  countActive(guildId) {
    return db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE guild_id = ? AND status NOT IN ('completed', 'closed')
    `).get(guildId).count;
  },

  update(channelId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${toSnake(k)} = ?`).join(', ');
    const values = [...keys.map(k => fields[k]), channelId];
    db.prepare(`UPDATE tickets SET ${setClauses}, updated_at = datetime('now') WHERE channel_id = ?`).run(...values);
  },
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const Transaction = {
  upsert(data) {
    db.prepare(`
      INSERT INTO transactions (guild_id, ticket_channel_id, buyer_id, buyer_tag, roblox_username, robux_amount, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(ticket_channel_id) DO UPDATE SET
        status = excluded.status,
        updated_at = datetime('now')
    `).run(
      data.guildId, data.ticketChannelId, data.buyerId, data.buyerTag,
      data.robloxUsername, data.robuxAmount, data.totalPrice
    );
  },

  update(ticketChannelId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map(k => `${toSnake(k)} = ?`).join(', ');
    const values = [...keys.map(k => fields[k]), ticketChannelId];
    db.prepare(`UPDATE transactions SET ${setClauses}, updated_at = datetime('now') WHERE ticket_channel_id = ?`).run(...values);
  },

  stats(guildId) {
    const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE guild_id = ?').get(guildId).count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE guild_id = ? AND status = 'completed'").get(guildId).count;
    const revenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) as sum FROM transactions WHERE guild_id = ? AND status = 'completed'").get(guildId).sum;
    const robux = db.prepare("SELECT COALESCE(SUM(robux_amount), 0) as sum FROM transactions WHERE guild_id = ? AND status = 'completed'").get(guildId).sum;
    return { total, completed, revenue, robux };
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

// camelCase → snake_case
function toSnake(str) {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}
