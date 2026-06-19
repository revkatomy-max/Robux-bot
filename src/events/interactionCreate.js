import { handleInteraction } from '../handlers/interactionHandler.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction) {
  await handleInteraction(interaction);
}
