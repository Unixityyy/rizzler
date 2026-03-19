import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execute } from './randomBunny';

describe('randombunny command', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should send a bunny image URL on successful API call', async () => {
        const mockUrl = 'https://sheri.bot/media/bunny/abc.jpg';
        
        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue([{ url: mockUrl }]),
        });

        const mockInteraction: any = {
            deferReply: vi.fn(),
            editReply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.deferReply).toHaveBeenCalled();
        expect(mockInteraction.editReply).toHaveBeenCalledWith({ content: mockUrl });
    });

    it('should send an error message if the API response is empty', async () => {
        (fetch as any).mockResolvedValue({
            json: vi.fn().mockResolvedValue([]),
        });

        const mockInteraction: any = {
            deferReply: vi.fn(),
            editReply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith('Could not fetch a bunny image at the moment.');
    });

    it('should send an error message if the fetch fails', async () => {
        (fetch as any).mockRejectedValue(new Error('Network Error'));

        const mockInteraction: any = {
            deferReply: vi.fn(),
            editReply: vi.fn(),
        };

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith('An error occurred while fetching a bunny image.');
    });
});