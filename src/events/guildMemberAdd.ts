import { Interaction, ChatInputCommandInteraction } from 'discord.js';
import { botLog, LogType } from '../utils/logger';
import { guildId, rolesChannel } from '../settings.json';
module.exports = {
    name: 'guildMemberAdd',
    async execute(member: any) {
        
        if (member.guild.id !== guildId) return;
        
        const channel = member.guild.channels.cache.get(rolesChannel);
        if (!channel) {
            botLog(`Channel with ID ${rolesChannel} not found.`, LogType.ERROR);
            return;
        }
        channel.send(`<@${member.id}>`).then((msg: any) => {
            setTimeout(() => msg.delete(), 5000);
        }).catch((error: any) => {
            botLog(`Error sending welcome message: ${error}`, LogType.ERROR);
        });
    },
};