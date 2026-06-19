import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { isAdmin } from '../utils/permissions.js';
import { GuildConfig } from '../database/db.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setcategories')
  .setDescription('Atur kategori dan channel log')
  .addChannelOption(opt =>
    opt.setName('open_ticket').setDescription('Kategori untuk tiket aktif')
      .addChannelTypes(ChannelType.GuildCategory).setRequired(false)
  )
  .addChannelOption(opt =>
    opt.setName('transaction_log').setDescription('Channel log transaksi')
      .addChannelTypes(ChannelType.GuildText).setRequired(false)
  )
  .addChannelOption(opt =>
    opt.setName('transcript').setDescription('Channel untuk transcript tiket')
      .addChannelTypes(ChannelType.GuildText).setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Kamu tidak punya izin.')], ephemeral: true });
  }

  const openTicket = interaction.options.getChannel('open_ticket');
  const txLog = interaction.options.getChannel('transaction_log');
  const transcript = interaction.options.getChannel('transcript');

  const update = {};
  if (openTicket) update.openTicketCategoryId = openTicket.id;
  if (txLog) update.transactionLogChannelId = txLog.id;
  if (transcript) update.transcriptChannelId = transcript.id;

  GuildConfig.update(interaction.guildId, update);

  const embed = successEmbed('Kategori Diperbarui', 'Konfigurasi kategori berhasil disimpan.')
    .addFields(
      { name: '📂 Open Ticket', value: openTicket ? `<#${openTicket.id}>` : 'Tidak diubah', inline: true },
      { name: '📊 Transaction Log', value: txLog ? `<#${txLog.id}>` : 'Tidak diubah', inline: true },
      { name: '📋 Transcript', value: transcript ? `<#${transcript.id}>` : 'Tidak diubah', inline: true },
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
