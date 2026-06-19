import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { isAdmin } from '../utils/permissions.js';
import { GuildConfig } from '../database/db.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setqr')
  .setDescription('Upload QR Code pembayaran')
  .addAttachmentOption(opt =>
    opt.setName('qr').setDescription('Upload gambar QR Code').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Kamu tidak punya izin.')], ephemeral: true });
  }

  const attachment = interaction.options.getAttachment('qr');
  if (!attachment.contentType?.startsWith('image/')) {
    return interaction.reply({ embeds: [errorEmbed('File Tidak Valid', 'Harap upload file gambar (JPG, PNG, dll).')], ephemeral: true });
  }

  GuildConfig.update(interaction.guildId, { qrImageUrl: attachment.url });

  await interaction.reply({
    embeds: [successEmbed('QR Code Diperbarui', `QR Code pembayaran berhasil disimpan!`).setImage(attachment.url)],
    ephemeral: true,
  });
}
