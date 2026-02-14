import { REST, Routes } from 'discord.js';
const { token, clientId, guildId } = require('./settings.json');
import fs from 'node:fs';
import path from 'node:path';

export const deployCommands = async () => {
    const commands = [];
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }

    const rest = new REST().setToken(token);

    try {
        console.log(`Started refreshing ${commands.length} guild (/) commands.`);
        const data: any = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} guild (/) commands.`);
        return data;
    } catch (error) {
        console.error(error);
    }
};

// this used to be in client ready 
// but i figured i should just call it in build
// im not fucking with the code so
// im calling the func here
deployCommands();