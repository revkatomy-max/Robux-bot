import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function shopButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('buy_100')
      .setLabel('100 Robux')
      .setEmoji('💎')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('buy_200')
      .setLabel('200 Robux')
      .setEmoji('💎')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('buy_500')
      .setLabel('500 Robux')
      .setEmoji('💎')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('buy_custom')
      .setLabel('Custom Robux')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary),
  );
  return [row1];
}

export function buyerButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_payment')
      .setLabel('Saya Sudah Bayar')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
  );
  return [row];
}

export function sellerButtons(claimed = false, claimed_by = null) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel(claimed ? `Diclaim: ${claimed_by}` : 'Claim Ticket')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(claimed),
    new ButtonBuilder()
      .setCustomId('verify_payment')
      .setLabel('Verify Payment')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('complete_order')
      .setLabel('Complete Order')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );
  return [row];
}
