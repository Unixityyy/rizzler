import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('nothing')
    .setDescription('dont spam pls');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
}