import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue(JSON.stringify({
            devSecret: 'mock_secret',
            titleId: 'mock_id',
            banRoleID: 'staff_role_123'
        }))
    }
}));

vi.mock('../../utils/logger', () => ({
    botLog: vi.fn(),
    LogType: { INFO: 'INFO', ERROR: 'ERROR' }
}));

import { execute } from './unbanPlayer';

describe('unbanplayer command', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.clearAllMocks();
    });

    it('should fail if user lacks permission', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(false) } } },
            reply: vi.fn()
        };

        await execute(mockInteraction);
        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'No permission.', ephemeral: true })
        );
    });

    it('should successfully revoke a ban via PlayFab', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getString: vi.fn().mockReturnValue('BAN-12345') },
            user: { tag: 'moderatorunikittymeow' },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ code: 200 })
        });

        await execute(mockInteraction);

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/Admin/RevokeBans'),
            expect.objectContaining({ method: 'POST' })
        );
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Successfully revoked ban')
        );
    });

    it('should handle PlayFab API errors gracefully', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getString: vi.fn().mockReturnValue('BAD-ID') },
            user: { tag: 'moderatorunikittymeow' },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({ code: 400, errorMessage: 'Ban not found' })
        });

        await execute(mockInteraction);
        expect(mockInteraction.editReply).toHaveBeenCalledWith('PlayFab Error: Ban not found');
    });
});