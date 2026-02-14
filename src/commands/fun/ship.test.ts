import { describe, it, expect, vi } from 'vitest';
import { execute } from './ship';

describe('ship command', () => {
    it('should block shipping the same user', async () => {
        const mockInteraction: any = {
            options: {
                getUser: vi.fn().mockReturnValue({ id: '123', username: 'unixity' }),
            },
            reply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'same person' })
        );
    });

    it('should calculate a compatibility between 0 and 100', async () => {
        const mockInteraction: any = {
            options: {
                getUser: vi.fn()
                    .mockReturnValueOnce({ id: '123', username: 'User1' })
                    .mockReturnValueOnce({ id: '456', username: 'User2' }),
            },
            reply: vi.fn(),
        };

        await execute(mockInteraction);

        const lastCall = mockInteraction.reply.mock.calls[0][0];
        
        const match = lastCall.match(/\*\*(\d+)%\*\*/);
        const percentage = parseInt(match[1]);

        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
    });
});