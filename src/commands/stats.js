import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { isAdmin } from '../utils/permissions.js';
import { Transaction, Ticket } from '../database/db.js';
import { Colors, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Lihat statistik penjualan')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Kamu tidak punya izin.')], ephemeral: true });
  }

  const guildId = interaction.guildId;
  const stats = Transaction.stats(guildId);
  const activeTickets = Ticket.countActive(guildId);

  const embed = new EmbedBuilder()
    .setColor(Colors.PURPLE)
    .setTitle('📊 Statistik Penjualan Robux')
    .addFields(
      { name: '🔢 Total Transaksi', value: `${stats.total}`, inline: true },
      { name: '✅ Selesai', value: `${stats.completed}`, inline: true },
      { name: '🎟️ Tiket Aktif', value: `${activeTickets}`, inline: true },
      { name: '💎 Total Robux Terjual', value: `${stats.robux.toLocaleString()} Robux`, inline: true },
      { name: '💰 Total Revenue', value: `Rp${stats.revenue.toLocaleString('id-ID')}`, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
