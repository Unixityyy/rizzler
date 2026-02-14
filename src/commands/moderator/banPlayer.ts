import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { botLog, LogType } from '../../utils/logger';

const settingsPath = path.join(process.cwd(), 'settings.json');
const { devSecret, titleId, banRoleID } = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banplayer')
        .setDescription('Bans a player ingame.')
        .addStringOption(option => 
            option.setName('playfabid')
                .setDescription('The PlayFab ID of the player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('hours')
                .setDescription('Duration in hours (leave empty for permanent)')
                .setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const roles = interaction.member?.roles as GuildMemberRoleManager;
        if (!roles.cache.has(banRoleID)) {
            return interaction.reply({ content: 'No permission.', ephemeral: true });
        }

        const playFabId = interaction.options.getString('playfabid', true);
        const reason = interaction.options.getString('reason', true);
        const hours = interaction.options.getInteger('hours');
        const maskedId = `...${playFabId.slice(-4)}`;

        await interaction.deferReply();

        try {

            const response = await fetch(`https://${titleId}.playfabapi.com/Server/BanUsers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-SecretKey': devSecret
                },
                body: JSON.stringify({
                    Bans: [{
                        PlayFabId: playFabId,
                        Reason: reason.toUpperCase(),
                        DurationInHours: hours || null
                    }]
                })
            });

            const result: any = await response.json();

            if (result.code === 200) {
                botLog(`Ban issued for **${maskedId}** by ${interaction.user.tag}`, LogType.INFO);
                await interaction.editReply(`Successfully banned \`${playFabId}\` for: **${reason}**`);
            } else {
                botLog(`PlayFab Error (${result.error}): ${result.errorMessage}`, LogType.ERROR);
                await interaction.editReply(`PlayFab Error: ${result.errorMessage}`);
            }
        } catch (error: any) {
            botLog(`Critical error: ${error.message}`, LogType.ERROR);
            await interaction.editReply('Failed to communicate with PlayFab.');
        }
    }
};