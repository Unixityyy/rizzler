import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin');

export async function execute(interaction: ChatInputCommandInteraction) {
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    await interaction.reply(`**${result}**`);
}