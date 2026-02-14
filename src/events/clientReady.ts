import os from 'os';
import { version } from 'discord.js';
import { botLog, LogType } from '../utils/logger';

export const name = 'clientReady';
export const once = true;

export function execute(client: any) {
    const uptime = (Date.now() - client.startupTime) / 1000;
    const commandCount = client.commands.size;
    const eventCount = client.events.size;
    
    botLog("\n-# ---------------------------------", LogType.INFO); 
    botLog(`Startup completed in ${uptime}s.`, LogType.INFO);
    botLog(`Bot is now online with **${commandCount}** modules and **${eventCount}** events loaded.`, LogType.INFO);
    botLog(`Operating System: ${os.type()} ${os.release()} (${os.platform()})`, LogType.INFO);
    botLog(`Node.js Version: ${process.version}`, LogType.INFO);
    botLog(`discord.js Version: ${version}`, LogType.INFO);
    
    console.log(`Logged in as ${client.user.tag} (${commandCount} commands loaded)`);
}