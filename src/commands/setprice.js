import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { isAdmin } from '../utils/permissions.js';
import { GuildConfig } from '../database/db.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setprice')
  .setDescription('Atur harga per Robux')
  .addIntegerOption(opt =>
    opt.setName('harga')
      .setDescription('Harga per 1 Robux dalam Rupiah (contoh: 120)')
      .setRequired(true)
      .setMinValue(1)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Kamu tidak punya izin.')], ephemeral: true });
  }

  const harga = interaction.options.getInteger('harga');
  GuildConfig.update(interaction.guildId, { pricePerRobux: harga });

  await interaction.reply({
    embeds: [successEmbed('Harga Diperbarui', `Harga per Robux sekarang: **Rp${harga.toLocaleString('id-ID')}**`)],
    ephemeral: true,
  });
}
