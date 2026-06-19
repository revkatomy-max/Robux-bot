import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  ChannelType, PermissionFlagsBits
} from 'discord.js';
import { getOrCreateConfig } from '../../utils/permissions.js';
import { orderEmbed, errorEmbed } from '../../utils/embeds.js';
import { buyerButtons, sellerButtons } from '../../utils/buttons.js';
import { Ticket, GuildConfig } from '../../database/db.js';

export async function handleBuyButton(interaction) {
  const customId = interaction.customId;
  const presets = { buy_100: 100, buy_200: 200, buy_500: 500 };

  if (customId === 'buy_custom') {
    const modal = new ModalBuilder()
      .setCustomId('modal_custom_buy')
      .setTitle('Beli Custom Robux');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('custom_amount').setLabel('Jumlah Robux')
          .setPlaceholder('Contoh: 350').setStyle(TextInputStyle.Short)
          .setRequired(true).setMinLength(1).setMaxLength(6)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('roblox_username').setLabel('Roblox Username')
          .setPlaceholder('Masukkan username Roblox kamu').setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
    return interaction.showModal(modal);
  }

  const robuxAmount = presets[customId];
  const modal = new ModalBuilder()
    .setCustomId(`modal_buy_${robuxAmount}`)
    .setTitle(`Beli ${robuxAmount} Robux`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('roblox_username').setLabel('Roblox Username')
        .setPlaceholder('Masukkan username Roblox kamu').setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );
  return interaction.showModal(modal);
}

export async function createTicket(interaction, robuxAmount, robloxUsername) {
  const config = getOrCreateConfig(interaction.guildId);
  const guild = interaction.guild;
  const user = interaction.user;

  const existing = Ticket.getActiveByBuyer(guild.id, user.id);
  if (existing) {
    return interaction.reply({
      embeds: [errorEmbed('Tiket Sudah Ada', `Kamu sudah punya tiket aktif: <#${existing.channel_id}>\nSelesaikan tiket tersebut terlebih dahulu.`)],
      ephemeral: true
    });
  }

  const totalPrice = robuxAmount * config.price_per_robux;
  await interaction.deferReply({ ephemeral: true });

  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  if (config.admin_role_id) {
    permissionOverwrites.push({ id: config.admin_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  if (config.seller_role_id) {
    permissionOverwrites.push({ id: config.seller_role_id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }

  const channelOptions = { name: channelName, type: ChannelType.GuildText, permissionOverwrites };
  if (config.open_ticket_category_id) channelOptions.parent = config.open_ticket_category_id;

  const channel = await guild.channels.create(channelOptions);

  const ticket = Ticket.create({
    guildId: guild.id, channelId: channel.id,
    buyerId: user.id, buyerTag: user.tag,
    robloxUsername, robuxAmount, totalPrice,
    status: 'username_filled',
  });

  // Normalize ticket fields untuk embed (snake_case dari SQLite)
  const t = normalizeTicket(ticket);

  const orderMsg = await channel.send({
    content: `<@${user.id}>`,
    embeds: [orderEmbed(t, config)],
    components: buyerButtons(),
  });

  const sellerPanelMsg = await channel.send({
    content: config.seller_role_id ? `<@&${config.seller_role_id}>` : '**Panel Seller**',
    embeds: [{ color: 0x9b59b6, title: '🧑‍💼 Panel Seller', description: 'Gunakan tombol di bawah untuk mengelola tiket ini.' }],
    components: sellerButtons(),
  });

  Ticket.update(channel.id, { orderEmbedMessageId: orderMsg.id, sellerPanelMessageId: sellerPanelMsg.id });

  await interaction.editReply({
    embeds: [{ color: 0x2ecc71, title: '✅ Tiket Dibuat', description: `Tiket pembelian kamu berhasil dibuat di ${channel}` }]
  });
}

// SQLite returns snake_case, normalize to camelCase-like object for embeds
export function normalizeTicket(t) {
  if (!t) return null;
  return {
    buyerId: t.buyer_id,
    buyerTag: t.buyer_tag,
    channelId: t.channel_id,
    robloxUsername: t.roblox_username,
    robuxAmount: t.robux_amount,
    totalPrice: t.total_price,
    claimedBy: t.claimed_by,
    claimedByTag: t.claimed_by_tag,
    status: t.status,
    orderEmbedMessageId: t.order_embed_message_id,
    sellerPanelMessageId: t.seller_panel_message_id,
    createdAt: t.created_at,
  };
}
