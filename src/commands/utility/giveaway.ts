import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ComponentType,
    EmbedBuilder,
    Client,
    TextChannel
} from 'discord.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const { giveawayStarters, giveawayPingRole } = require("../../settings.json");
const SAVE_PATH = path.join(process.cwd(), 'giveaways.json');
const LINKED_USERS = path.join(process.cwd(), 'linked_users.json');

interface GiveawayState {
    prize: string;
    endTime: number;
    participants: string[];
    channelId: string;
    messageId: string;
    creatorId: string;
    winnerCount: number;
}

function save(state: GiveawayState | null, removeId?: string) {
    let all = load();

    if (removeId) {
        all = all.filter(g => g.messageId !== removeId);
    } else if (state) {
        const index = all.findIndex(g => g.messageId === state.messageId);
        if (index > -1) all[index] = state;
        else all.push(state);
    }

    writeFileSync(SAVE_PATH, JSON.stringify(all, null, 2));
}

function load(): GiveawayState[] {
    if (!existsSync(SAVE_PATH)) return [];
    try {
        const data = JSON.parse(readFileSync(SAVE_PATH, 'utf-8'));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function isUserLinked(discordId: string): boolean {
    if (!existsSync(LINKED_USERS)) return false;
    try {
        const data = JSON.parse(readFileSync(LINKED_USERS, 'utf-8'));
        const user = data[discordId];
        return !!user && typeof user === 'object' && user !== null;
    } catch {
        return false;
    }
}

export const data = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Starts a giveaway')
    .addStringOption(o => o.setName('prize').setDescription('The prize').setRequired(true))
    .addIntegerOption(o => o.setName('duration').setDescription('Seconds').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Amount of winners').setMinValue(1).setMaxValue(10));

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!giveawayStarters.includes(interaction.user.id)) {
        return interaction.reply({ 
            content: "You don't have permission to start giveaways.", 
            ephemeral: true 
        });
    }

    const prize = interaction.options.getString('prize', true);
    const duration = interaction.options.getInteger('duration', true);
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const endTime = Date.now() + (duration * 1000);

    const embed = new EmbedBuilder()
        .setTitle('GIVEAWAY STARTED')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n**Participants:** 0\n**Sponsor:** <@${interaction.user.id}>`)
        .setColor(0x00FF00);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('join-giveaway').setLabel('Join').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('view-participants').setLabel('Participants').setStyle(ButtonStyle.Secondary)
    );

    const message = await interaction.reply({ content: `<@&${giveawayPingRole}>`, embeds: [embed], components: [row], fetchReply: true, allowedMentions: { roles: [giveawayPingRole] } });

    const state: GiveawayState = {
        prize,
        endTime,
        participants: [],
        channelId: interaction.channelId,
        messageId: message.id,
        creatorId: interaction.user.id,
        winnerCount
    };

    save(state);
    handleLogic(message, state);
}

function handleLogic(message: any, state: GiveawayState) {
    const remaining = state.endTime - Date.now();
    if (remaining <= 0) return finish(message, state, new Set(state.participants));

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: remaining
    });

    collector.on('collect', async (i: any) => {
        if (i.customId === 'view-participants') {
            const list = state.participants.length > 0 
                ? state.participants.map(id => `<@${id}>`).join(', ') 
                : 'No participants yet.';
            
            return i.reply({ 
                content: `**Current Participants (${state.participants.length}):**\n${list.substring(0, 1900)}`, 
                ephemeral: true 
            });
        }

        if (i.customId === 'join-giveaway') {
            if (!isUserLinked(i.user.id)) {
                return i.reply({ content: 'You must be linked to join!', ephemeral: true });
            }

            if (state.participants.includes(i.user.id)) {
                return i.reply({ content: 'Already entered!', ephemeral: true });
            }

            state.participants.push(i.user.id);
            save(state);

            const updated = EmbedBuilder.from(message.embeds[0])
                .setDescription(`**Prize:** ${state.prize}\n**Winners:** ${state.winnerCount}\n**Ends:** <t:${Math.floor(state.endTime / 1000)}:R>\n**Participants:** ${state.participants.length}\n**Sponsor:** <@${state.creatorId}>`);

            await message.edit({ embeds: [updated] });
            await i.reply({ content: 'Entered!', ephemeral: true });
        }
    });

    collector.on('end', () => finish(message, state, new Set(state.participants)));
}

async function finish(message: any, state: GiveawayState, participants: Set<string>) {
    const participantArray = Array.from(participants);
    const winners: string[] = [];

    if (participantArray.length > 0) {
        const count = Math.min(state.winnerCount, participantArray.length);
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * participantArray.length);
            winners.push(participantArray.splice(randomIndex, 1)[0]);
        }
    }

    const winnerText = winners.length > 0 
        ? winners.map(id => `<@${id}>`).join(', ') 
        : 'No one joined.';

    const endEmbed = new EmbedBuilder()
        .setTitle('GIVEAWAY ENDED')
        .setColor(0xFF0000)
        .setDescription(`**Prize:** ${state.prize}\n**Winners:** ${winnerText}`);

    await message.edit({ 
        content: `<@${state.creatorId}>`, 
        embeds: [endEmbed], 
        components: [] 
    });
    
    save(null, state.messageId);
}

export async function initRecovery(client: Client) {
    const activeGiveaways = load();
    if (activeGiveaways.length === 0) return;

    for (const state of activeGiveaways) {
        try {
            const channel = await client.channels.fetch(state.channelId) as TextChannel;
            const message = await channel.messages.fetch(state.messageId);
            handleLogic(message, state);
        } catch {
            save(null, state.messageId);
        }
    }
}