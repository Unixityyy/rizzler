import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction
} from 'discord.js';
import { PlayFabAdmin } from 'playfab-sdk';
import fs from 'fs';
import path from 'path';
import { botLog, LogType } from '../../utils/logger';

const MAPPINGS_PATH = path.join(process.cwd(), 'linked_users.json');

export const data = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Project Rizz account to Discord');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (fs.existsSync(MAPPINGS_PATH)) {
        try {
            const fileData = fs.readFileSync(MAPPINGS_PATH, 'utf-8');
            const mappings = fileData ? JSON.parse(fileData) : {};
            
            if (mappings[interaction.user.id]) {
                return interaction.reply({
                    content: `you are already linked to PlayFab ID: \`${mappings[interaction.user.id].playFabId}\`.`,
                    ephemeral: true
                });
            }
        } catch (err) {
            botLog(`Error reading mappings: ${err}`, LogType.ERROR);
        }
    }

    const startRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('open_link_modal')
                .setLabel('Start Linking')
                .setStyle(ButtonStyle.Primary),
        );

    const initialResponse = await interaction.reply({
        content: `### linking\n1. open **Project Rizz**.\n2. go to the computer, click **Support** and enter your **PlayFab ID** (e.g., \`A1B2C3D4E5F67890\`).\n3. click the button below and enter it there.`,
        components: [startRow],
        ephemeral: true
    });

    const buttonCollector = initialResponse.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 600_000 
    });

    buttonCollector.on('collect', async (btnInt) => {
        if (btnInt.customId === 'open_link_modal') {
            const modal = new ModalBuilder()
                .setCustomId('pf_id_modal')
                .setTitle('link to ingame');

            const idInput = new TextInputBuilder()
                .setCustomId('pf_id_input')
                .setLabel("PlayFab ID?")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('A1B2C3D4E5F67890')
                .setRequired(true)
                .setMinLength(10);

            const row = new ActionRowBuilder<TextInputBuilder>().addComponents(idInput);
            modal.addComponents(row);

            await btnInt.showModal(modal);

            const submitted = await btnInt.awaitModalSubmit({
                time: 60_000,
                filter: (i) => i.user.id === interaction.user.id,
            }).catch(() => null);

            if (submitted) {
                await handleModalSubmit(submitted);
            }
        }
    });
}

export async function handleModalSubmit(interaction: ModalSubmitInteraction) {
    const playFabId = interaction.fields.getTextInputValue('pf_id_input').toUpperCase().trim();

    PlayFabAdmin.GetUserReadOnlyData({
        PlayFabId: playFabId,
        Keys: ["DiscordUsername"]
    }, async (checkErr, checkResult) => {
        if (checkErr) return interaction.reply({ content: "err checking playfab account.", ephemeral: true });

        if (checkResult.data?.Data?.["DiscordUsername"]) {
            return interaction.reply({ 
                content: `this account is already linked to: \`${checkResult.data.Data["DiscordUsername"].Value}\`.`, 
                ephemeral: true 
            });
        }

        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * 26)]).join('');

        const verifyRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('finalize_link')
                    .setLabel('i have changed my name')
                    .setStyle(ButtonStyle.Success),
            );

        await interaction.reply({
            content: `**step 2: verify**\n- ID inputted: \`${playFabId}\`\n- change your name ingame to: \`${code}\`\n\nclick the button below once you have set your name.`,
            components: [verifyRow],
            ephemeral: true
        });

        const finalCollector = interaction.channel?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300_000,
            filter: (i) => i.user.id === interaction.user.id && i.customId === 'finalize_link'
        });

        finalCollector?.on('collect', async (vInt) => {
            await vInt.deferUpdate();

            PlayFabAdmin.GetUserAccountInfo({ PlayFabId: playFabId }, (error, result) => {
                if (error || !result?.data?.UserInfo) {
                    return vInt.followUp({ content: `could not find PlayFabId: \`${playFabId}\`.`, ephemeral: true });
                }

                const currentName = result.data.UserInfo.TitleInfo?.DisplayName;

                if (currentName !== code) {
                    return vInt.followUp({ 
                        content: `your name is currently \`${currentName || "Empty"}\`, but you need to set it to \`${code}\`.`, 
                        ephemeral: true 
                    });
                }

                PlayFabAdmin.UpdateUserReadOnlyData({
                    PlayFabId: playFabId,
                    Data: { "DiscordUsername": vInt.user.tag }
                }, (upErr) => {
                    if (upErr) return vInt.followUp({ content: "err updating playfab data.", ephemeral: true });

                    try {
                        let mappings: any = {};
                        if (fs.existsSync(MAPPINGS_PATH)) {
                            const fileData = fs.readFileSync(MAPPINGS_PATH, 'utf-8');
                            mappings = fileData ? JSON.parse(fileData) : {};
                        }
                        mappings[vInt.user.id] = { playFabId, linkedAt: new Date().toISOString() };
                        fs.writeFileSync(MAPPINGS_PATH, JSON.stringify(mappings, null, 4));
                    } catch (err) {
                        botLog(`File System Error: ${err}`, LogType.ERROR);
                    }

                    PlayFabAdmin.AddUserVirtualCurrency({
                        PlayFabId: playFabId,
                        VirtualCurrency: "RT",
                        Amount: 2500
                    }, (currErr) => {
                        if (currErr) botLog(`couldnt add rust: ${JSON.stringify(currErr)}`, LogType.ERROR);
                    });

                    vInt.editReply({
                        content: `success! you are now linked to playfabid \`${playFabId}\`.\nyou can now change your name back.\n2500 rust has been added to your account.`,
                        components: []
                    });
                    
                    finalCollector.stop();
                });
            });
        });
    });
}