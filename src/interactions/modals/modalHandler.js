import { createTicket } from './buttons/buyHandler.js';

export async function handleModal(interaction) {
  const { customId } = interaction;

  // Preset amounts: modal_buy_100, modal_buy_200, modal_buy_500
  if (customId.startsWith('modal_buy_')) {
    const amount = parseInt(customId.split('_')[2]);
    const robloxUsername = interaction.fields.getTextInputValue('roblox_username').trim();

    if (!robloxUsername) {
      return interaction.reply({ content: '❌ Roblox username tidak boleh kosong.', ephemeral: true });
    }

    await createTicket(interaction, amount, robloxUsername);
  }

  // Custom amount
  else if (customId === 'modal_custom_buy') {
    const rawAmount = interaction.fields.getTextInputValue('custom_amount').trim();
    const robloxUsername = interaction.fields.getTextInputValue('roblox_username').trim();

    const amount = parseInt(rawAmount);
    if (isNaN(amount) || amount < 1) {
      return interaction.reply({ content: '❌ Jumlah Robux tidak valid. Masukkan angka yang benar.', ephemeral: true });
    }

    await createTicket(interaction, amount, robloxUsername);
  }
}
