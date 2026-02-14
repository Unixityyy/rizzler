import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execute } from './coinFlip';

describe('coinflip command', () => {
    beforeEach(() => {
        vi.spyOn(global.Math, 'random');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return heads when random is less than 0.5', async () => {
        (Math.random as any).mockReturnValue(0.1);

        const mockInteraction: any = {
            reply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('**heads**');
    });

    it('should return tails when random is 0.5 or greater', async () => {
        (Math.random as any).mockReturnValue(0.9);

        const mockInteraction: any = {
            reply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith('**tails**');
    });
});