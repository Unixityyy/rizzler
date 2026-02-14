import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcat')
        .setDescription('Random cat image'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            const data: any = await response.json();

            if (data.length > 0 && data[0].url) {
                await interaction.editReply({ content: data[0].url });
            } else {
                await interaction.editReply('Could not fetch a cat image at the moment.');
            }
        } catch (error: any) {
            await interaction.editReply('An error occurred while fetching a cat image.');
        }
    },
};