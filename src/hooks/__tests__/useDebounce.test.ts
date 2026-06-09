import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } },
    );

    expect(result.current).toBe('hello');

    // Change value
    rerender({ value: 'world', delay: 300 });

    // Before delay, value should still be the old one
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('hello');

    // After full delay, value should update
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('world');
  });

  it('should not emit intermediate values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } },
    );

    expect(result.current).toBe('a');

    // Rapidly change value multiple times
    rerender({ value: 'ab', delay: 300 });
    act(() => vi.advanceTimersByTime(100));

    rerender({ value: 'abc', delay: 300 });
    act(() => vi.advanceTimersByTime(100));

    rerender({ value: 'abcd', delay: 300 });
    act(() => vi.advanceTimersByTime(100));

    // Should still be the initial value since timer keeps resetting
    expect(result.current).toBe('a');

    // Wait for final debounce to complete
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('abcd');
  });

  it('should work with number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } },
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 500 });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toBe(42);
  });
});
