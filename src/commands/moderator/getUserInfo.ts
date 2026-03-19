import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { PlayFabAdmin } from 'playfab-sdk';
import { botLog, LogType } from '../../utils/logger';

interface LinkMap {
    playFabId: string;
    linkedAt: string;
}

interface LinkedUserMap {
    [discordId: string]: LinkMap;
}

const settingsPath = path.join(process.cwd(), 'settings.json');
const linkedUsersPath = path.join(process.cwd(), 'linked_users.json');
const { banRoleID } = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

export const data = new SlashCommandBuilder()
        .setName('getuserinfo')
        .setDescription('Gets the info of a linked user.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user.')
                .setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction) {
    const roles = interaction.member?.roles as GuildMemberRoleManager;
    if (!roles.cache.has(banRoleID)) {
        return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const trgtUser = interaction.options.getUser("user", true);

    const fileData = fs.readFileSync(linkedUsersPath, 'utf-8');
    const linkedUsers: LinkedUserMap = JSON.parse(fileData);
    const trgtPfabID: string | undefined = linkedUsers[trgtUser.id]?.playFabId;

    if (!trgtPfabID) {
        return interaction.editReply({ content: `${trgtUser.tag} is not linked.` });
    }

    PlayFabAdmin.GetPlayerProfile({ PlayFabId: trgtPfabID }, (profErr, profResult) => {
        if (profErr) return handleError(profErr, interaction);

        PlayFabAdmin.GetUserData({ PlayFabId: trgtPfabID, Keys: ["MetaUsername"] }, (dataErr, dataRes) => {
            if (dataErr) return handleError(dataErr, interaction);

            PlayFabAdmin.GetUserInventory({ PlayFabId: trgtPfabID }, async (invErr, invRes) => {
                if (invErr) return handleError(invErr, interaction);

                const profile = profResult.data?.PlayerProfile;
                const metaUsername = dataRes.data?.Data?.["MetaUsername"]?.Value || "Not Set";
                const rtBalance = invRes.data?.VirtualCurrency?.["RT"] || 0;

                const response = [
                    `**PlayFab ID:** \`${trgtPfabID}\``,
                    `**Display Name:** ${profile?.DisplayName || 'None'}`,
                    `**Meta Username:** ${metaUsername}`,
                    `**Rust:** ${rtBalance}`,
                ].join('\n');

                await interaction.editReply({ content: response });
            });
        });
    });
}

function handleError(err: any, interaction: ChatInputCommandInteraction) {
    botLog(`PlayFab Error: ${err.errorMessage}`, LogType.ERROR);
    return interaction.editReply("err");
}