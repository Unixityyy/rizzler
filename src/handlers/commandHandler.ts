import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export async function loadCommands(client: any) {
    const foldersPath = path.resolve(__dirname, '../commands');
    
    if (!fs.existsSync(foldersPath)) return;

    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        
        if (!fs.lstatSync(commandsPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(commandsPath).filter(file => {
            const isScript = file.endsWith('.ts') || file.endsWith('.js');
            const isTest = file.includes('.test.');
            return isScript && !isTest;
        });
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            
            try {
                const fileUrl = pathToFileURL(filePath).href;
                const module = await import(fileUrl);
                const command = module.default || module;

                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
}