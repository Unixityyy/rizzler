// im not writing the test, gemini did it
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayFabAdmin } from 'playfab-sdk';

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn((path) => {
            if (path.includes('settings.json')) {
                return JSON.stringify({ banRoleID: '123456789' });
            }
            if (path.includes('linked_users.json')) {
                return JSON.stringify({
                    '111222333': { playFabId: 'PF-MASTER-99', linkedAt: '2026-01-01' }
                });
            }
            return '';
        })
    }
}));

vi.mock('node:path', () => ({
    default: { join: vi.fn((...args) => args.join('/')) }
}));

vi.mock('../../utils/logger', () => ({
    botLog: vi.fn(),
    LogType: { ERROR: 'ERROR' }
}));

vi.mock('playfab-sdk', () => ({
    PlayFabAdmin: {
        GetPlayerProfile: vi.fn(),
        GetUserData: vi.fn(),
        GetUserInventory: vi.fn()
    }
}));

import { execute } from './getUserInfo';

describe('getuserinfo command', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reply with "No permission" if user lacks the ban role', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(false) } } },
            reply: vi.fn()
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'No permission.', ephemeral: true })
        );
    });

    it('should notify if the Discord user is not linked', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getUser: vi.fn().mockReturnValue({ id: '999', tag: 'Unknown#0000' }) },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith({
            content: 'Unknown#0000 is not linked.'
        });
    });

    it('should successfully fetch and format PlayFab user info', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getUser: vi.fn().mockReturnValue({ id: '111222333', tag: 'Player#1234' }) },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (PlayFabAdmin.GetPlayerProfile as any).mockImplementation((params: any, callback: (arg0: null, arg1: { data: { PlayerProfile: { Created: string; DisplayName: string; LastLogin: string; }; }; }) => void) => {
            callback(null, { data: { PlayerProfile: { 
                Created: '2026-01-01T10:00:00Z', 
                DisplayName: 'TestUser', 
                LastLogin: '2026-03-19T10:00:00Z' 
            }}});
        });

        (PlayFabAdmin.GetUserData as any).mockImplementation((params: any, callback: (arg0: null, arg1: { data: { Data: { MetaUsername: { Value: string; }; }; }; }) => void) => {
            callback(null, { data: { Data: { MetaUsername: { Value: 'MetaPlayerOne' } } } });
        });

        (PlayFabAdmin.GetUserInventory as any).mockImplementation((params: any, callback: (arg0: null, arg1: { data: { VirtualCurrency: { RT: number; }; }; }) => void) => {
            callback(null, { data: { VirtualCurrency: { RT: 500 } } });
        });

        await execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockInteraction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('**PlayFab ID:** `PF-MASTER-99`')
        });
        expect(mockInteraction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('**Meta Username:** MetaPlayerOne')
        });
        expect(mockInteraction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining('**Rust:** 500')
        });
    });

    it('should handle PlayFab API errors via handleError', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getUser: vi.fn().mockReturnValue({ id: '111222333', tag: 'Player#1234' }) },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (PlayFabAdmin.GetPlayerProfile as any).mockImplementation((params: any, callback: (arg0: { errorMessage: string; }, arg1: null) => void) => {
            callback({ errorMessage: 'API Down' }, null);
        });

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith('err');
    });
});