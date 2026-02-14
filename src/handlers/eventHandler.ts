import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';

export async function loadEvents(client: any) {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        client.events.set(event.name, event);

        if (event.once) {
            client.once(event.name, (...args: any[]) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args: any[]) => event.execute(...args, client));
        }
    }
}