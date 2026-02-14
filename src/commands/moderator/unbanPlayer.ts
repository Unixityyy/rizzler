import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { botLog, LogType } from '../../utils/logger';

const settingsPath = path.join(process.cwd(), 'settings.json');
const { devSecret, titleId, banRoleID } = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

export const data = new SlashCommandBuilder()
        .setName('unbanplayer')
        .setDescription('Revokes a ban.')
        .addStringOption(option => 
            option.setName('banid')
                .setDescription('The specific Ban ID (get this from /getuserbans)')
                .setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction) {
    const roles = interaction.member?.roles as GuildMemberRoleManager;
    if (!roles.cache.has(banRoleID)) {
        return interaction.reply({ content: 'No permission.', ephemeral: true });
    }
    
    const banId = interaction.options.getString('banid', true).trim();
    const maskedId = `...${banId.slice(-4)}`;
    
    await interaction.deferReply();
    try {
        const response = await fetch(`https://${titleId}.playfabapi.com/Admin/RevokeBans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-SecretKey': devSecret
            },
            body: JSON.stringify({
                BanIds: [banId]
            })
        });
        const result: any = await response.json();

        if (result.code === 200) {
            botLog(`Ban ending in **${maskedId}** was revoked by ${interaction.user.tag}`, LogType.INFO);
            await interaction.editReply(`Successfully revoked ban \`${banId}\`.`);
        } else {
            console.log(`[DEBUG] RevokeBans Error:`, JSON.stringify(result));
            botLog(`Unban failed for ID **${maskedId}**: ${result.errorMessage}`, LogType.ERROR);
            await interaction.editReply(`PlayFab Error: ${result.errorMessage}`);
        }
    } catch (error: any) {
        botLog(`Critical error in unbanplayer: ${error.message}`, LogType.ERROR);
        await interaction.editReply('Failed to communicate with PlayFab.');
    }
}