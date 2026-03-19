import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('randombunny')
    .setDescription('Random bunny image');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
        const response = await fetch('https://sheri.bot/api/bunny/?format=json');
        const data: any = await response.json();

        if (data.length > 0 && data[0].url) {
            await interaction.editReply({ content: data[0].url });
        } else {
            await interaction.editReply('Could not fetch a bunny image at the moment.');
        }
    } catch {
        await interaction.editReply('An error occurred while fetching a bunny image.');
    }
}