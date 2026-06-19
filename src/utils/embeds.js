import { EmbedBuilder } from 'discord.js';

export const Colors = {
  SUCCESS: 0x2ecc71,
  WARNING: 0xf1c40f,
  ERROR: 0xe74c3c,
  INFO: 0x3498db,
  PURPLE: 0x9b59b6,
};

export function successEmbed(title, description) {
  return new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`✅ ${title}`).setDescription(description).setTimestamp();
}
export function errorEmbed(title, description) {
  return new EmbedBuilder().setColor(Colors.ERROR).setTitle(`❌ ${title}`).setDescription(description).setTimestamp();
}
export function warningEmbed(title, description) {
  return new EmbedBuilder().setColor(Colors.WARNING).setTitle(`⚠️ ${title}`).setDescription(description).setTimestamp();
}
export function infoEmbed(title, description) {
  return new EmbedBuilder().setColor(Colors.INFO).setTitle(`ℹ️ ${title}`).setDescription(description).setTimestamp();
}

export function shopEmbed(pricePerRobux) {
  return new EmbedBuilder()
    .setColor(Colors.PURPLE)
    .setTitle('🎮 Toko Robux')
    .setDescription('Selamat datang di toko Robux resmi kami!\nPilih paket Robux yang ingin kamu beli di bawah ini.')
    .addFields(
      { name: '💰 Harga Per Robux', value: `Rp${pricePerRobux.toLocaleString('id-ID')}`, inline: true },
      { name: '⚡ Paket Tersedia', value: '100 • 200 • 500 • Custom', inline: true },
      { name: '\u200B', value: '\u200B' },
      { name: '📦 100 Robux', value: `**Rp${(100 * pricePerRobux).toLocaleString('id-ID')}**`, inline: true },
      { name: '📦 200 Robux', value: `**Rp${(200 * pricePerRobux).toLocaleString('id-ID')}**`, inline: true },
      { name: '📦 500 Robux', value: `**Rp${(500 * pricePerRobux).toLocaleString('id-ID')}**`, inline: true },
    )
    .setFooter({ text: 'Klik tombol di bawah untuk membeli • Proses cepat & aman' })
    .setTimestamp();
}

// ticket = normalized camelCase object, config = raw SQLite snake_case row
export function orderEmbed(ticket, config) {
  const embed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle('🛒 Detail Pesanan')
    .addFields(
      { name: '👤 Discord', value: `<@${ticket.buyerId}>`, inline: true },
      { name: '🎮 Roblox Username', value: ticket.robloxUsername || '*Belum diisi*', inline: true },
      { name: '\u200B', value: '\u200B' },
      { name: '💎 Jumlah Robux', value: `${ticket.robuxAmount.toLocaleString()} Robux`, inline: true },
      { name: '💰 Total Harga', value: `**Rp${ticket.totalPrice.toLocaleString('id-ID')}**`, inline: true },
      { name: '\u200B', value: '\u200B' },
      { name: '📊 Status', value: statusBadge(ticket.status), inline: true },
    )
    .setTimestamp();

  if (ticket.claimedBy) {
    embed.addFields({ name: '🧑‍💼 Ditangani Oleh', value: `<@${ticket.claimedBy}>`, inline: true });
  }

  const qr = config?.qr_image_url || config?.qrImageUrl;
  if (qr) {
    embed.setImage(qr);
    embed.addFields({ name: '💳 Pembayaran', value: 'Scan QR Code di atas untuk melakukan pembayaran' });
  }

  return embed;
}

export function statusBadge(status) {
  const map = {
    open: '🟡 MENUNGGU ROBLOX USERNAME',
    username_filled: '🔵 MENUNGGU PEMBAYARAN',
    payment_confirmed: '🟡 MENUNGGU VERIFIKASI',
    claimed: '🔵 SEDANG DIPROSES',
    payment_verified: '🟢 PEMBAYARAN TERVERIFIKASI',
    completed: '✅ SELESAI',
    closed: '🔴 DITUTUP',
  };
  return map[status] || status;
}

export function transactionLogEmbed(ticket, action) {
  const colors = { payment_confirmed: Colors.WARNING, payment_verified: Colors.SUCCESS, completed: Colors.SUCCESS, claimed: Colors.INFO };
  const titles = { payment_confirmed: '💳 Konfirmasi Pembayaran Masuk', payment_verified: '✅ Pembayaran Terverifikasi', completed: '🎉 Pesanan Selesai', claimed: '🧑‍💼 Tiket Di-Claim' };

  return new EmbedBuilder()
    .setColor(colors[action] || Colors.INFO)
    .setTitle(titles[action] || 'Log Transaksi')
    .addFields(
      { name: '👤 Buyer', value: `<@${ticket.buyerId}> (${ticket.buyerTag})`, inline: true },
      { name: '🎮 Roblox', value: ticket.robloxUsername || '-', inline: true },
      { name: '💎 Robux', value: `${ticket.robuxAmount} Robux`, inline: true },
      { name: '💰 Total', value: `Rp${ticket.totalPrice.toLocaleString('id-ID')}`, inline: true },
      { name: '📋 Tiket', value: `<#${ticket.channelId}>`, inline: true },
      { name: '📊 Status', value: statusBadge(ticket.status), inline: true },
    )
    .setTimestamp();
}
