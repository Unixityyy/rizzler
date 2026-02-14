import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager, EmbedBuilder } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { botLog, LogType } from '../../utils/logger';

const settingsPath = path.join(process.cwd(), 'settings.json');
const { devSecret, titleId, banRoleID } = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getuserbans')
        .setDescription('Retrieves all ban history for a PlayFab player.')
        .addStringOption(option => 
            option.setName('playfabid')
                .setDescription('The PlayFab ID of the player')
                .setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
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
                body: JSON.stringify({ 
                    PlayFabId: playFabId.trim()
                })
            });

            const result: any = await response.json();

            if (result?.code === 200 && result?.data) {
                const bans = result.data.BanData || []; 

                if (bans.length === 0) {
                    return await interaction.editReply(`No ban history found for player \`${playFabId}\`.`);
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Ban History: ${playFabId}`)
                    .setColor(0xff0000)
                    .setTimestamp();

                bans.slice(0, 5).forEach((ban: any, index: number) => {
                    const status = ban.Active ? "🔴 Active" : "⚪ Inactive/Expired";
                    const expires = ban.Expires ? new Date(ban.Expires).toLocaleString() : "Permanent";
                    
                    embed.addFields({
                        name: `Ban #${index + 1} (${status})`,
                        value: `**Reason:** ${ban.Reason}\n**Expires:** ${expires}\n**ID:** \`${ban.BanId}\``
                    });
                });

                await interaction.editReply({ embeds: [embed] });
                botLog(`Viewed ban history for ...${playFabId.slice(-4)}`, LogType.INFO);
            } else {
                const errorDetail = result?.errorMessage || "Player not found or API error.";
                await interaction.editReply(`PlayFab Error: ${errorDetail}`);
            }
        } catch (error: any) {
            botLog(`Critical error in getuserbans: ${error.message}`, LogType.ERROR);
            await interaction.editReply('Failed to communicate with PlayFab.');
        }
    }
};