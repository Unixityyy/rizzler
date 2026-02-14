import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot latency'),
    async execute(interaction: ChatInputCommandInteraction) {
        const startTime = Date.now();

        await interaction.reply({ content: 'Pinging...', withResponse: true });

        const endTime = Date.now();
        const roundtrip = endTime - startTime;
        
        const heartbeat = interaction.client.ws.ping;
        const wsDisplay = heartbeat === -1 ? 'Calculating...' : `${heartbeat}ms`;
        
        await interaction.editReply(
            `Roundtrip latency: ${roundtrip}ms\nWebsocket heartbeat: ${wsDisplay}`
        );
    },
};