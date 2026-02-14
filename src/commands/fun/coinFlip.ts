import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin'),
    async execute(interaction: ChatInputCommandInteraction) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        await interaction.reply(`**${result}**`);
    },
};