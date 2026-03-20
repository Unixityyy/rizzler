import os from 'os';
import { Client, Collection, version } from 'discord.js';
import { botLog, LogType } from '../utils/logger';
import { PlayFabAdmin } from 'playfab-sdk';
const { titleId, devSecret } = require('../settings.json');
import { initRecovery } from '../commands/utility/giveaway';

export interface FuckassClient extends Client {
    commands: Collection<string, any>;
    events: Collection<string, any>;
    startupTime: number;
} // because typescript wont shutup about types

export const name = 'clientReady';
export const once = true;

export async function execute(client: FuckassClient) {
    PlayFabAdmin.settings.titleId = titleId;
    PlayFabAdmin.settings.developerSecretKey = devSecret;

    await initRecovery(client);

    const uptime = (Date.now() - client.startupTime) / 1000;
    const commandCount = client.commands.size;
    const eventCount = client.events.size;

    botLog("\n-# ---------------------------------", LogType.INFO); 
    botLog(`Startup completed in ${uptime}s.`, LogType.INFO);
    botLog(`Bot is now online with **${commandCount}** modules and **${eventCount}** events loaded.`, LogType.INFO);
    botLog(`Operating System: ${os.type()} ${os.release()} (${os.platform()})`, LogType.INFO);
    botLog(`Node.js Version: ${process.version}`, LogType.INFO);
    botLog(`discord.js Version: ${version}`, LogType.INFO);
    
    console.log(`Logged in as ${client.user!.tag} (${commandCount} commands loaded)`);
}