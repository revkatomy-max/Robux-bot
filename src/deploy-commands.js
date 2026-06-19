import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandsPath = join(__dirname, 'commands');
const files = readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`✅ Loaded: ${command.data.name}`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log(`\n📡 Mendaftarkan ${commands.length} slash commands ke Discord...`);

  const data = await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log(`\n✅ Berhasil mendaftarkan ${data.length} commands!`);
  console.log('Commands:', data.map(c => c.name).join(', '));
} catch (err) {
  console.error('❌ Error mendaftarkan commands:', err);
  process.exit(1);
}
