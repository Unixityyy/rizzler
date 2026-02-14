import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue(JSON.stringify({
            devSecret: 'test_secret',
            titleId: 'test_id',
            banRoleID: '123456789'
        })),
        existsSync: vi.fn().mockReturnValue(true)
    }
}));

vi.mock('node:path', () => ({
    default: {
        join: vi.fn((...args) => args.join('/'))
    }
}));

vi.mock('../../utils/logger', () => ({
    botLog: vi.fn(),
    LogType: { INFO: 'INFO', ERROR: 'ERROR' }
}));

import { execute } from './getUserBans';

describe('getuserbans command', () => {
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

    it('should successfully fetch and display ban history in an embed', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: {
                getString: vi.fn().mockReturnValue('chudmaster123')
            },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                code: 200,
                data: {
                    BanData: [
                        {
                            Active: true,
                            Reason: 'bad name',
                            Expires: '2067-01-00T00:00:00Z',
                            BanId: '676767'
                        }
                    ]
                }
            })
        });

        await execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: expect.arrayContaining([
                    expect.objectContaining({
                        data: expect.objectContaining({
                            title: 'Ban History: chudmaster123'
                        })
                    })
                ])
            })
        );
    });

    it('should notify if no ban history is found', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getString: vi.fn().mockReturnValue('CLEAN-PLAYER-ID') },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                code: 200,
                data: { BanData: [] }
            })
        });

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('No ban history found')
        );
    });

    it('should handle PlayFab API errors', async () => {
        const mockInteraction: any = {
            member: { roles: { cache: { has: vi.fn().mockReturnValue(true) } } },
            options: { getString: vi.fn().mockReturnValue('INVALID-ID') },
            deferReply: vi.fn(),
            editReply: vi.fn()
        };

        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                code: 400,
                error: 'InvalidParams',
                errorMessage: 'The PlayFab ID is invalid'
            })
        });

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('PlayFab Error: The PlayFab ID is invalid')
        );
    });
});