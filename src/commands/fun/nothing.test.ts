import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execute, data } from './nothing';

describe('nothing command', () => {
    const mockInteraction = {
        deferReply: vi.fn().mockResolvedValue(undefined),
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should have the correct command metadata', () => {
        expect(data.name).toBe('nothing');
        expect(data.description).toBe('dont spam pls');
    });

    it('should call deferReply when executed', async () => {
        await execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalledTimes(1);
    });
});