import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Ship two users together')
        .addUserOption((option: any) => 
            option.setName('user1')
                .setDescription('The first user')
                .setRequired(true))
        .addUserOption((option: any) => 
            option.setName('user2')
                .setDescription('The second user')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        const user1 = interaction.options.getUser('user1', true);
        const user2 = interaction.options.getUser('user2', true);

        if (user1.id === user2.id) {
            await interaction.reply({ content: 'same person', ephemeral: true });
            return;
        }

        const compatibility = Math.floor(Math.random() * 101);
        let emoji = '💔';

        if (compatibility > 80) {
            emoji = '❤️';
        } else if (compatibility > 50) {
            emoji = '💖';
        } else if (compatibility > 20) {
            emoji = '💘';
        }

        await interaction.reply(`${emoji} **${user1.username}** and **${user2.username}** have a compatibility of **${compatibility}%**! ${emoji}`);
    },
};