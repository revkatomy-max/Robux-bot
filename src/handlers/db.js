import { initDB } from '../database/db.js';
import { logger } from '../utils/logger.js';

export function connectDB() {
  try {
    initDB();
  } catch (err) {
    logger.error('❌ Gagal inisialisasi SQLite:', err.message);
    process.exit(1);
  }
}
