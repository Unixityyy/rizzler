// genuinely im so sorry for whoever reads this code but sadly i used gemini for this test
// im too tired to write a test rn soo
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execute } from './link';
import { PlayFabAdmin } from 'playfab-sdk';
import fs from 'fs';

vi.mock('playfab-sdk', () => ({
    PlayFabAdmin: {
        GetUserAccountInfo: vi.fn(),
        UpdateUserReadOnlyData: vi.fn()
    }
}));

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}));

describe('link command', () => {
    let mockInteraction: any;
    let mockCollector: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCollector = {
            on: vi.fn(),
            stop: vi.fn()
        };

        mockInteraction = {
            user: { id: '123', tag: 'testuser#0001' },
            reply: vi.fn().mockResolvedValue({
                createMessageComponentCollector: vi.fn().mockReturnValue(mockCollector)
            }),
            editReply: vi.fn()
        };
    });

    it('should send initial instructions with a 6-character code', async () => {
        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringMatching(/name: `[A-Z]{6}`/),
                ephemeral: true
            })
        );
    });

    it('should successfully link and update files when button is clicked and player is found', async () => {
        await execute(mockInteraction);

        const callback = mockCollector.on.mock.calls.find((call: string[]) => call[0] === 'collect')[1];
        const mockButtonInteraction = {
            user: mockInteraction.user,
            deferUpdate: vi.fn().mockResolvedValue({}),
            followUp: vi.fn(),
            editReply: vi.fn()
        };

        (PlayFabAdmin.GetUserAccountInfo as any).mockImplementation((params: any, cb: any) => {
            cb(null, {
                data: {
                    UserInfo: {
                        PlayFabId: 'PF_123',
                        TitleInfo: { DisplayName: 'MetaPlayer' }
                    }
                }
            });
        });

        (PlayFabAdmin.UpdateUserReadOnlyData as any).mockImplementation((params: any, cb: any) => {
            cb(null, { data: {} });
        });

        (fs.existsSync as any).mockReturnValue(false);

        await callback(mockButtonInteraction);

        expect(PlayFabAdmin.GetUserAccountInfo).toHaveBeenCalled();
        expect(PlayFabAdmin.UpdateUserReadOnlyData).toHaveBeenCalledWith(
            expect.objectContaining({
                PlayFabId: 'PF_123',
                Data: { DiscordUsername: 'testuser#0001' }
            }),
            expect.any(Function)
        );
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(mockButtonInteraction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('successfully linked!')
            })
        );
    });

    it('should show error if player is not found in PlayFab', async () => {
        await execute(mockInteraction);
        const callback = mockCollector.on.mock.calls.find((call: string[]) => call[0] === 'collect')[1];
        
        const mockButtonInteraction = {
            deferUpdate: vi.fn(),
            followUp: vi.fn()
        };

        (PlayFabAdmin.GetUserAccountInfo as any).mockImplementation((params: any, cb: any) => {
            cb({ error: 'NotFound' }, null);
        });

        await callback(mockButtonInteraction);

        expect(mockButtonInteraction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('could not find player')
            })
        );
    });
});