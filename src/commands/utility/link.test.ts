// genuinely im so sorry for whoever reads this code but sadly i used gemini for this test
// im too tired to write a test rn soo
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleModalSubmit } from './link';
import { PlayFabAdmin } from 'playfab-sdk';
import fs from 'fs';

vi.mock('playfab-sdk', () => ({
    PlayFabAdmin: {
        GetUserReadOnlyData: vi.fn(),
        GetUserAccountInfo: vi.fn(),
        UpdateUserReadOnlyData: vi.fn(),
        AddUserVirtualCurrency: vi.fn()
    }
}));

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
}));

vi.mock('../../utils/logger', () => ({
    botLog: vi.fn(),
    LogType: { ERROR: 'ERROR', INFO: 'INFO' }
}));

describe('link command modal handler', () => {
    let mockInteraction: any;
    let mockCollector: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCollector = {
            on: vi.fn(),
            stop: vi.fn()
        };

        mockInteraction = {
            user: { id: 'discord_123', tag: 'Tester#0001' },
            fields: { getTextInputValue: vi.fn().mockReturnValue('TEST_PF_ID') },
            reply: vi.fn().mockResolvedValue({}),
            channel: {
                createMessageComponentCollector: vi.fn().mockReturnValue(mockCollector)
            }
        };
    });

    it('should successfully link and reward player when name matches', async () => {
        (PlayFabAdmin.GetUserReadOnlyData as any).mockImplementation((params: any, cb: (arg0: null, arg1: { data: { Data: {}; }; }) => void) => {
            cb(null, { data: { Data: {} } });
        });

        await handleModalSubmit(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('step 2: verify')
        }));

        const collectCallback = mockCollector.on.mock.calls.find((c: string[]) => c[0] === 'collect')[1];
        const mockBtnInt = {
            user: mockInteraction.user,
            deferUpdate: vi.fn().mockResolvedValue({}),
            editReply: vi.fn(),
            followUp: vi.fn(),
            customId: 'finalize_link'
        };

        const generatedCode = mockInteraction.reply.mock.calls[0][0].content.match(/`([A-Z]{6})`/)[1];

        (PlayFabAdmin.GetUserAccountInfo as any).mockImplementation((params: any, cb: (arg0: null, arg1: { data: { UserInfo: { TitleInfo: { DisplayName: any; }; }; }; }) => void) => {
            cb(null, {
                data: {
                    UserInfo: {
                        TitleInfo: { DisplayName: generatedCode }
                    }
                }
            });
        });

        (PlayFabAdmin.UpdateUserReadOnlyData as any).mockImplementation((params: any, cb: (arg0: null, arg1: {}) => any) => cb(null, {}));
        (PlayFabAdmin.AddUserVirtualCurrency as any).mockImplementation((params: any, cb: (arg0: null, arg1: {}) => any) => cb(null, {}));
        (fs.existsSync as any).mockReturnValue(false);

        await collectCallback(mockBtnInt);

        expect(PlayFabAdmin.UpdateUserReadOnlyData).toHaveBeenCalledWith(
            expect.objectContaining({
                PlayFabId: 'TEST_PF_ID',
                Data: { DiscordUsername: 'Tester#0001' }
            }),
            expect.any(Function)
        );

        expect(PlayFabAdmin.AddUserVirtualCurrency).toHaveBeenCalledWith(
            expect.objectContaining({ Amount: 2500 }),
            expect.any(Function)
        );

        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(mockBtnInt.editReply).toHaveBeenCalledWith(expect.objectContaining({
            content: expect.stringContaining('success!')
        }));
    });
});