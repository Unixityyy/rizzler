import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execute } from './ping';

describe('ping command', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-13T10:00:00Z'));
    });

    it('should calculate and display both roundtrip and heartbeat latency', async () => {
        const mockInteraction: any = {
            client: {
                ws: { ping: 42 }
            },
            reply: vi.fn().mockImplementation(async () => {
                vi.advanceTimersByTime(50);
                return {};
            }),
            editReply: vi.fn()
        };

        await execute(mockInteraction);

        expect(mockInteraction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: 'Pinging...', withResponse: true })
        );

        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Roundtrip latency: 50ms')
        );
        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Websocket heartbeat: 42ms')
        );
    });

    it('should show "Calculating..." if heartbeat is -1', async () => {
        const mockInteraction: any = {
            client: {
                ws: { ping: -1 }
            },
            reply: vi.fn().mockResolvedValue({}),
            editReply: vi.fn()
        };

        await execute(mockInteraction);

        expect(mockInteraction.editReply).toHaveBeenCalledWith(
            expect.stringContaining('Websocket heartbeat: Calculating...')
        );
    });
});