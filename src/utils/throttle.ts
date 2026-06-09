/**
 * TokenBucket rate limiter with FIFO queue.
 * Ensures requests never exceed the configured rate.
 * Default: 1 request per second (60 req/min).
 */
export class TokenBucket {
  private maxTokens: number;
  private refillRate: number; // tokens per millisecond
  private tokens: number;
  private lastRefill: number;
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  private processing = false;

  constructor(maxTokens: number = 1, refillIntervalMs: number = 1000) {
    this.maxTokens = maxTokens;
    this.refillRate = maxTokens / refillIntervalMs;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Acquire a token. Returns a promise that resolves when a token is available.
   * If tokens are available immediately, resolves synchronously.
   * Otherwise, the request is queued and resolved when a token is refilled.
   */
  acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;
    if (newTokens > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }

  private processQueue(): void {
    this.processing = true;

    const tick = () => {
      this.refill();

      while (this.queue.length > 0 && this.tokens >= 1) {
        const entry = this.queue.shift();
        if (entry) {
          this.tokens -= 1;
          entry.resolve();
        }
      }

      if (this.queue.length > 0) {
        setTimeout(tick, 100);
      } else {
        this.processing = false;
      }
    };

    setTimeout(tick, 100);
  }
}
