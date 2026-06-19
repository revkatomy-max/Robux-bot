import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { shopEmbed } from '../utils/embeds.js';
import { shopButtons } from '../utils/buttons.js';
import { isAdmin, getOrCreateConfig } from '../utils/permissions.js';
import { GuildConfig } from '../database/db.js';

export const data = new SlashCommandBuilder()
  .setName('setup-shop')
  .setDescription('Setup panel pembelian Robux di channel ini')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  if (!isAdmin(interaction.member, interaction.guildId)) {
    return interaction.reply({ content: '❌ Kamu tidak punya izin untuk command ini.', ephemeral: true });
  }

  const config = getOrCreateConfig(interaction.guildId);
  const embed = shopEmbed(config.price_per_robux);
  const buttons = shopButtons();

  await interaction.channel.send({ embeds: [embed], components: buttons });
  GuildConfig.update(interaction.guildId, { shopChannelId: interaction.channelId });

  await interaction.reply({ content: `✅ Panel toko berhasil dikirim di ${interaction.channel}!`, ephemeral: true });
}
