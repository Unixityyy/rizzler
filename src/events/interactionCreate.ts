import { Interaction, ChatInputCommandInteraction } from 'discord.js';
import { botLog, LogType } from '../utils/logger';

module.exports = {
    name: 'interactionCreate',
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const client = interaction.client as any;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            botLog(`Error executing ${interaction.commandName}: ${error}`, LogType.ERROR);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    },
};