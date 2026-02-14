import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export async function loadEvents(client: any) {
    const eventsPath = path.resolve(__dirname, '../events');
    
    if (!fs.existsSync(eventsPath)) return;

    const eventFiles = fs.readdirSync(eventsPath).filter(file => {
        const isScript = file.endsWith('.ts') || file.endsWith('.js');
        const isTest = file.includes('.test.');
        return isScript && !isTest;
    });

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        
        try {
            const fileUrl = pathToFileURL(filePath).href;
            const event = await import(fileUrl);

            if (event.name && event.execute) {
                if (event.once) {
                    client.once(event.name, (...args: any[]) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args: any[]) => event.execute(...args, client));
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
}