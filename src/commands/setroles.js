import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { isAdmin } from '../utils/permissions.js';
import { GuildConfig } from '../database/db.js';
import { successEmbed, errorEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('setroles')
  .setDescription('Atur role Admin, Seller, dan Member')
  .addRoleOption(opt => opt.setName('admin').setDescription('Role Admin').setRequired(false))
  .addRoleOption(opt => opt.setName('seller').setDescription('Role Seller').setRequired(false))
  .addRoleOption(opt => opt.setName('member').setDescription('Role Member').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ embeds: [errorEmbed('Akses Ditolak', 'Kamu tidak punya izin.')], ephemeral: true });
  }

  const adminRole = interaction.options.getRole('admin');
  const sellerRole = interaction.options.getRole('seller');
  const memberRole = interaction.options.getRole('member');

  const update = {};
  if (adminRole) update.adminRoleId = adminRole.id;
  if (sellerRole) update.sellerRoleId = sellerRole.id;
  if (memberRole) update.memberRoleId = memberRole.id;

  GuildConfig.update(interaction.guildId, update);
  const config = GuildConfig.get(interaction.guildId);

  const embed = successEmbed('Role Diperbarui', 'Konfigurasi role berhasil disimpan.')
    .addFields(
      { name: '👑 Admin', value: config.admin_role_id ? `<@&${config.admin_role_id}>` : 'Belum diset', inline: true },
      { name: '🛒 Seller', value: config.seller_role_id ? `<@&${config.seller_role_id}>` : 'Belum diset', inline: true },
      { name: '👤 Member', value: config.member_role_id ? `<@&${config.member_role_id}>` : 'Belum diset', inline: true },
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
