import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucket } from '../throttle';

describe('TokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should acquire a token immediately when available', async () => {
    const bucket = new TokenBucket(1, 1000);
    await expect(bucket.acquire()).resolves.toBeUndefined();
  });

  it('should queue requests when no tokens available', async () => {
    const bucket = new TokenBucket(1, 1000);

    // Use the only token
    await bucket.acquire();

    // Next acquire should queue (not resolve immediately)
    const promise = bucket.acquire();
    const result: string[] = [];

    promise.then(() => result.push('resolved'));

    // Should not resolve before refill
    vi.advanceTimersByTime(500);
    expect(result.length).toBe(0);

    // Should resolve after refill
    vi.advanceTimersByTime(600);
    await vi.waitFor(() => {
      expect(result.length).toBe(1);
    });
  });

  it('should refill tokens over time', async () => {
    const bucket = new TokenBucket(2, 2000); // 2 tokens, refill over 2s

    // Use both tokens
    await bucket.acquire();
    await bucket.acquire();

    // Third should queue
    const p3 = bucket.acquire();
    const results: string[] = [];
    p3.then(() => results.push('acquired'));

    // Advance to refill 1 token (1s = half of refill period)
    vi.advanceTimersByTime(1000);
    // Queue processes every 100ms
    await vi.waitFor(() => {
      expect(results.length).toBe(1);
    });

    // Fourth should queue again since we only have 1 token and we used it
    const p4 = bucket.acquire();
    const results2: string[] = [];
    p4.then(() => results2.push('acquired'));

    // Advance another 1s to refill another token
    vi.advanceTimersByTime(1000);
    await vi.waitFor(() => {
      expect(results2.length).toBe(1);
    });
  });

  it('should handle acquire and release pattern correctly', async () => {
    const bucket = new TokenBucket(1, 500);
    await expect(bucket.acquire()).resolves.toBeUndefined();

    // Queue next
    const p2 = bucket.acquire();
    const results: string[] = [];
    p2.then(() => results.push('ok'));

    vi.advanceTimersByTime(600);
    await vi.waitFor(() => {
      expect(results.length).toBe(1);
    });
  });
});
