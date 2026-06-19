import { handleBuyButton } from '../interactions/buttons/buyHandler.js';
import { handleSellerButton, handleConfirmPayment } from '../interactions/buttons/sellerHandler.js';
import { handleModal } from '../interactions/modals/modalHandler.js';
import { logger } from '../utils/logger.js';
import { errorEmbed } from '../utils/embeds.js';

export async function handleInteraction(interaction) {
  try {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
    }

    // Buttons
    else if (interaction.isButton()) {
      const id = interaction.customId;

      if (['buy_100', 'buy_200', 'buy_500', 'buy_custom'].includes(id)) {
        await handleBuyButton(interaction);
      } else if (id === 'confirm_payment') {
        await handleConfirmPayment(interaction);
      } else if (['claim_ticket', 'verify_payment', 'complete_order', 'close_ticket'].includes(id)) {
        await handleSellerButton(interaction);
      }
    }

    // Modals
    else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  } catch (err) {
    logger.error('Interaction error:', err);
    const reply = { embeds: [errorEmbed('Error', 'Terjadi kesalahan saat memproses permintaanmu.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
}
