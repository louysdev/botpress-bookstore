import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache } from '../cache';

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve a value', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 42);
    expect(cache.get('key1')).toBe(42);
  });

  it('should return undefined for missing key', () => {
    const cache = new MemoryCache<string>(1000);
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should return undefined after TTL expiry', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 42);

    // Advance time past TTL
    vi.advanceTimersByTime(1001);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should return value within TTL window', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 42);

    vi.advanceTimersByTime(500);
    expect(cache.get('key1')).toBe(42);
  });

  it('should evict expired entries', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 1);
    cache.set('key2', 2);

    vi.advanceTimersByTime(500);
    cache.set('key3', 3); // fresh entry

    vi.advanceTimersByTime(600); // key1 and key2 now expired

    const evicted = cache.evictExpired();
    expect(evicted).toBe(2);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.get('key3')).toBe(3);
  });

  it('should overwrite existing key', () => {
    const cache = new MemoryCache<string>(1000);
    cache.set('key1', 'first');
    cache.set('key1', 'second');
    expect(cache.get('key1')).toBe('second');
  });

  it('should report correct size', () => {
    const cache = new MemoryCache<number>(1000);
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('should check key existence with has()', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 42);
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('should delete a specific key', () => {
    const cache = new MemoryCache<number>(1000);
    cache.set('key1', 42);
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.delete('nonexistent')).toBe(false);
  });
});
