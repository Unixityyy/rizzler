import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { botLog, LogType } from '../../utils/logger';

const settingsPath = path.join(process.cwd(), 'settings.json');
const { devSecret, titleId, banRoleID } = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

export const data = new SlashCommandBuilder()
    .setName('getuserbans')
    .setDescription('Fetches all bans for a specific PlayFab player.')
    .addStringOption(option => 
        option.setName('playfabid')
            .setDescription('The PlayFab ID of the player')
            .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const roles = interaction.member?.roles as GuildMemberRoleManager;
    if (!roles.cache.has(banRoleID)) {
        return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    const playFabId = interaction.options.getString('playfabid', true);
    await interaction.deferReply();

    try {
        const response = await fetch(`https://${titleId}.playfabapi.com/Server/GetUserBans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-SecretKey': devSecret
            },
            body: JSON.stringify({ PlayFabId: playFabId })
        });

        const result: any = await response.json();

        if (result.code === 200) {
            const bans = result.data.BanData;

            if (bans.length === 0) {
                return interaction.editReply(`No ban history found for \`${playFabId}\`.`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`Ban History: ${playFabId}`)
                .setColor(0xFF0000)
                .setTimestamp();

            const banList = bans.map((ban: any) => {
                const status = ban.Active ? '🔴 Active' : '⚪ Expired';
                const expiry = ban.Expires ? new Date(ban.Expires).toLocaleString() : 'Permanent';
                return `**Status:** ${status}\n**Reason:** ${ban.Reason}\n**Expires:** ${expiry}\n**ID:** \`${ban.BanId}\`\n---`;
            }).join('\n');

            embed.setDescription(banList.slice(0, 4096));

            await interaction.editReply({ embeds: [embed] });
        } else {
            botLog(`PlayFab Error (${result.error}): ${result.errorMessage}`, LogType.ERROR);
            await interaction.editReply(`PlayFab Error: ${result.errorMessage}`);
        }
    } catch (error: any) {
        botLog(`Critical error: ${error.message}`, LogType.ERROR);
        await interaction.editReply('Failed to communicate with PlayFab.');
    }
}