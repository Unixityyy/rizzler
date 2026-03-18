import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} from 'discord.js';
import { PlayFabAdmin } from 'playfab-sdk';
import fs from 'fs';

const MAPPINGS_PATH = '../../linked_users.json';

export const data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('link your ingame account to your discord account');

export async function execute(interaction: ChatInputCommandInteraction) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const verificationCode = Array.from({ length: 6 }, () => 
        alphabet.charAt(Math.floor(Math.random() * alphabet.length))
    ).join('');
    
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('verify_link')
                .setLabel('i set it')
                .setStyle(ButtonStyle.Success),
        );

    const response = await interaction.reply({
        content: `to link:\n1. open Project Rizz.\n2. name: \`${verificationCode}\`\n3. click the button when done.`,
        components: [row],
        ephemeral: true
    });

    const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 300_000
    });

    collector.on('collect', async (i) => {
        await i.deferUpdate();

        PlayFabAdmin.GetUserAccountInfo({
            TitleDisplayName: verificationCode
        }, (error, result) => {
            if (error || !result) {
                return i.followUp({ 
                    content: `could not find player with the name \`${verificationCode}\`. please run /link and try again.`, 
                    ephemeral: true 
                });
            }

            const playFabId = result.data.UserInfo?.PlayFabId || "couldnt get id";
            const metaUsername = result.data.UserInfo?.TitleInfo?.DisplayName;

            PlayFabAdmin.UpdateUserReadOnlyData({
                PlayFabId: playFabId,
                Data: {
                    "DiscordUsername": i.user.tag
                }
            }, (updateError) => {
                if (updateError) {
                    return i.followUp({ content: "failed to update user data, please try again.", ephemeral: true });
                }

                const mappings = fs.existsSync(MAPPINGS_PATH) 
                    ? JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf-8')) 
                    : {};
                
                mappings[i.user.id] = {
                    playFabId: playFabId,
                    metaUsername: metaUsername
                };
                fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 2));

                i.editReply({
                    content: `**successfully linked!**\nyou are now tied to meta horizon user: \`${metaUsername}\`.\nyou can now change ur name back.`,
                    components: []
                });
                
                collector.stop();
            });
        });
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            interaction.editReply({ content: 'timed out. run /link again.', components: [] });
        }
    });
}