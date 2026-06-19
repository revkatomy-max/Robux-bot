import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { logger } from './utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function deployCommands() {
  const commands = [];
  const commandsPath = join(__dirname, 'commands');
  const files = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command = await import(filePath);
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    logger.info(`📡 Mendaftarkan ${commands.length} slash commands ke Discord...`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    logger.info(`✅ Berhasil mendaftarkan ${data.length} commands: ${data.map(c => c.name).join(', ')}`);
  } catch (err) {
    logger.error('❌ Error mendaftarkan commands:', err);
  }
}

// Tetap bisa dijalankan manual: node src/deploy-commands.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  import('dotenv/config').then(() => deployCommands());
}