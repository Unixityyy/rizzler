import { client } from '../index';
import { TextChannel } from 'discord.js';
import { logChannelID } from '../settings.json';

export enum LogType {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
}

export function botLog(message: string, type: LogType = LogType.INFO) {
    const logChannel = client.channels.cache.get(logChannelID) as TextChannel;
    if (logChannel) {
        const logMsg = `**[${type.toUpperCase()}]** ${message}\n-# [${new Date().toISOString()}]`;
        logChannel.send(logMsg);
    } else {
        console.error('Log channel not found.');
    }
}