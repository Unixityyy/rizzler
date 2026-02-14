'use strict';
import { Client, Collection } from 'discord.js';
const { token } = require('./settings.json');
import { loadEvents } from './handlers/eventHandler';
import { loadCommands } from './handlers/commandHandler';

export const client = new Client({
    intents: [
        32767,
    ],
}) as any;

client.commands = new Collection();
client.events = new Collection();
client.startupTime = Date.now();

if (require.main === module) {
    (async () => {
        await loadEvents(client);
        await loadCommands(client);
        await client.login(token);
    })();
}