import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue(JSON.stringify({
            devSecret: 'test_secret',
            titleId: 'test_id',
            banRoleID: '123456789'
        }))
    }
}));

vi.mock('node:path', () => ({
    default: { join: vi.fn((...args) => args.join('/')) }
}));
vi.mock('../../utils/logger', () => ({
    botLog: vi.fn(),
    LogType: { INFO: 'INFO', ERROR: 'ERROR' }
}));

import { execute } from './banPlayer';

describe('banplayer command', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.clearAllMocks();
    });

    it('should reply with "No permission" if user lacks the ban role', async () => {
        const mockInteraction: any = {
            member: {
                roles: { cache: { has: vi.fn().mockReturnValue(false) } }
            },
            reply: vi.fn()
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'No permission.', ephemeral: true })
        );
    });

    it('should successfully ban a player via PlayFab API', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: {
                getString: vi.fn((name) => name === 'playfabid' ? 'ID123' : 'hacking'),
                getInteger: vi.fn().mockReturnValue(24)
            },
            user: { tag: 'unikittymrrow' },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ code: 200 })
        });

        await execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Successfully banned')
        );
    });
});