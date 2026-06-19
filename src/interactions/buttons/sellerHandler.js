import { isSeller } from '../../utils/permissions.js';
import { orderEmbed, transactionLogEmbed, errorEmbed, successEmbed, Colors } from '../../utils/embeds.js';
import { sellerButtons } from '../../utils/buttons.js';
import { generateTranscript } from '../../utils/transcript.js';
import { Ticket, Transaction, GuildConfig } from '../../database/db.js';
import { normalizeTicket } from './buyHandler.js';

export async function handleSellerButton(interaction) {
  const { customId, guild, member, channel } = interaction;

  if (!isSeller(member, guild.id)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Hanya Seller dan Admin yang bisa menggunakan panel ini.')], ephemeral: true });
  }

  const raw = Ticket.getByChannel(channel.id);
  if (!raw) return interaction.reply({ embeds: [errorEmbed('Error', 'Tiket tidak ditemukan.')], ephemeral: true });

  const ticket = normalizeTicket(raw);
  const config = GuildConfig.get(guild.id);

  if (customId === 'claim_ticket') {
    if (ticket.claimedBy) {
      return interaction.reply({ embeds: [errorEmbed('Sudah Di-Claim', `Tiket ini sudah di-claim oleh <@${ticket.claimedBy}>`)], ephemeral: true });
    }

    Ticket.update(channel.id, { claimedBy: member.id, claimedByTag: member.user.tag, status: 'claimed' });
    ticket.claimedBy = member.id;
    ticket.status = 'claimed';

    if (raw.seller_panel_message_id) {
      const panelMsg = await channel.messages.fetch(raw.seller_panel_message_id).catch(() => null);
      if (panelMsg) await panelMsg.edit({ components: sellerButtons(true, member.user.username) });
    }
    if (raw.order_embed_message_id) {
      const orderMsg = await channel.messages.fetch(raw.order_embed_message_id).catch(() => null);
      if (orderMsg) await orderMsg.edit({ embeds: [orderEmbed(ticket, config)] });
    }

    await interaction.reply({ embeds: [{ color: Colors.INFO, title: '🙋 Tiket Di-Claim', description: `Tiket ini sekarang ditangani oleh <@${member.id}>` }] });

    if (config?.transaction_log_channel_id) {
      const logChannel = guild.channels.cache.get(config.transaction_log_channel_id);
      if (logChannel) await logChannel.send({ embeds: [transactionLogEmbed(ticket, 'claimed')] });
    }
  }

  else if (customId === 'verify_payment') {
    if (!['payment_confirmed', 'claimed'].includes(ticket.status)) {
      return interaction.reply({ embeds: [errorEmbed('Tidak Bisa Diverifikasi', 'Buyer belum melakukan konfirmasi pembayaran.')], ephemeral: true });
    }

    Ticket.update(channel.id, { status: 'payment_verified' });
    ticket.status = 'payment_verified';

    if (raw.order_embed_message_id) {
      const orderMsg = await channel.messages.fetch(raw.order_embed_message_id).catch(() => null);
      if (orderMsg) await orderMsg.edit({ embeds: [orderEmbed(ticket, config)] });
    }

    await interaction.reply({ embeds: [successEmbed('Pembayaran Terverifikasi', `Pembayaran dari <@${ticket.buyerId}> telah diverifikasi!\nKirim Robux sekarang, lalu tekan **Complete Order**.`)] });

    if (config?.transaction_log_channel_id) {
      const logChannel = guild.channels.cache.get(config.transaction_log_channel_id);
      if (logChannel) await logChannel.send({ embeds: [transactionLogEmbed(ticket, 'payment_verified')] });
    }

    Transaction.update(channel.id, { status: 'verified', sellerId: member.id, sellerTag: member.user.tag });
  }

  else if (customId === 'complete_order') {
    if (ticket.status !== 'payment_verified') {
      return interaction.reply({ embeds: [errorEmbed('Belum Bisa Diselesaikan', 'Verifikasi pembayaran terlebih dahulu.')], ephemeral: true });
    }

    Ticket.update(channel.id, { status: 'completed' });
    ticket.status = 'completed';

    if (raw.order_embed_message_id) {
      const orderMsg = await channel.messages.fetch(raw.order_embed_message_id).catch(() => null);
      if (orderMsg) await orderMsg.edit({ embeds: [orderEmbed(ticket, config)], components: [] });
    }

    await interaction.reply({ embeds: [successEmbed('Pesanan Selesai! 🎉', `Robux telah dikirim ke **${ticket.robloxUsername}**!\nTerimakasih sudah berbelanja!`)] });

    try {
      const buyer = await guild.members.fetch(ticket.buyerId);
      await buyer.send({
        embeds: [{
          color: Colors.SUCCESS,
          title: '🎉 Pesanan Robux Selesai!',
          description: `Hei **${buyer.user.username}**!\n\nPesanan **${ticket.robuxAmount} Robux** kamu telah berhasil dikirim ke akun Roblox **${ticket.robloxUsername}**.\n\nTerimakasih sudah berbelanja! 🛒`,
          fields: [
            { name: '💎 Robux', value: `${ticket.robuxAmount}`, inline: true },
            { name: '💰 Total', value: `Rp${ticket.totalPrice.toLocaleString('id-ID')}`, inline: true },
            { name: '🎮 Roblox', value: ticket.robloxUsername, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch { /* DM mungkin dimatikan */ }

    if (config?.transaction_log_channel_id) {
      const logChannel = guild.channels.cache.get(config.transaction_log_channel_id);
      if (logChannel) await logChannel.send({ embeds: [transactionLogEmbed(ticket, 'completed')] });
    }

    Transaction.update(channel.id, { status: 'completed' });
  }

  else if (customId === 'close_ticket') {
    await interaction.reply({ embeds: [{ color: Colors.WARNING, title: '🔒 Menutup Tiket...', description: 'Tiket akan ditutup dalam 10 detik. Transcript sedang dibuat...' }] });

    const transcriptFile = await generateTranscript(channel, ticket);

    if (config?.transcript_channel_id) {
      const transcriptChannel = guild.channels.cache.get(config.transcript_channel_id);
      if (transcriptChannel) {
        await transcriptChannel.send({
          embeds: [{
            color: Colors.INFO,
            title: '📋 Transcript Tiket',
            fields: [
              { name: '👤 Buyer', value: `<@${ticket.buyerId}>`, inline: true },
              { name: '💎 Robux', value: `${ticket.robuxAmount}`, inline: true },
              { name: '💰 Total', value: `Rp${ticket.totalPrice.toLocaleString('id-ID')}`, inline: true },
            ],
            timestamp: new Date().toISOString(),
          }],
          files: [transcriptFile],
        });
      }
    }

    Ticket.update(channel.id, { status: 'closed' });
    setTimeout(async () => { await channel.delete().catch(() => {}); }, 10000);
  }
}

export async function handleConfirmPayment(interaction) {
  const raw = Ticket.getByChannel(interaction.channel.id);
  if (!raw) return interaction.reply({ embeds: [errorEmbed('Error', 'Tiket tidak ditemukan.')], ephemeral: true });

  const ticket = normalizeTicket(raw);

  if (ticket.buyerId !== interaction.user.id) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Hanya buyer tiket ini yang bisa menekan tombol ini.')], ephemeral: true });
  }
  if (['payment_confirmed', 'payment_verified', 'completed'].includes(ticket.status)) {
    return interaction.reply({ embeds: [errorEmbed('Sudah Dikonfirmasi', 'Pembayaran sudah dikonfirmasi sebelumnya.')], ephemeral: true });
  }

  Ticket.update(interaction.channel.id, { status: 'payment_confirmed' });
  ticket.status = 'payment_confirmed';

  const config = GuildConfig.get(interaction.guildId);

  if (raw.order_embed_message_id) {
    const orderMsg = await interaction.channel.messages.fetch(raw.order_embed_message_id).catch(() => null);
    if (orderMsg) await orderMsg.edit({ embeds: [orderEmbed(ticket, config)] });
  }

  await interaction.reply({ embeds: [{ color: Colors.WARNING, title: '⏳ Menunggu Verifikasi', description: 'Konfirmasi pembayaranmu sudah diterima!\nSeller akan memverifikasi pembayaranmu segera.' }] });

  Transaction.upsert({
    guildId: interaction.guildId,
    ticketChannelId: interaction.channel.id,
    buyerId: ticket.buyerId,
    buyerTag: ticket.buyerTag,
    robloxUsername: ticket.robloxUsername,
    robuxAmount: ticket.robuxAmount,
    totalPrice: ticket.totalPrice,
  });

  if (config?.transaction_log_channel_id) {
    const logChannel = interaction.guild.channels.cache.get(config.transaction_log_channel_id);
    if (logChannel) {
      await logChannel.send({
        embeds: [transactionLogEmbed(ticket, 'payment_confirmed').addFields({ name: '🔗 Link Tiket', value: `<#${ticket.channelId}>` })],
      });
    }
  }
}
