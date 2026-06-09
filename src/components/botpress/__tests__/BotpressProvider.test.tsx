import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BotpressProvider, BotpressContext } from '../BotpressProvider';
import { useContext } from 'react';

// Test component that reads context
function TestConsumer() {
  const ctx = useContext(BotpressContext);
  return (
    <div>
      <span data-testid="is-ready">{String(ctx?.isReady)}</span>
      <span data-testid="has-send-event">{String(typeof ctx?.sendEvent === 'function')}</span>
      <span data-testid="has-open-chat">{String(typeof ctx?.openChat === 'function')}</span>
    </div>
  );
}

describe('BotpressProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_BOTPRESS_CLIENT_ID', '');
    delete window.botpressWebChat;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    delete window.botpressWebChat;
  });

  it('should render children without crashing', () => {
    vi.stubEnv('VITE_BOTPRESS_CLIENT_ID', 'test-client-id');
    window.botpressWebChat = { init: vi.fn(), open: vi.fn() };

    render(
      <BotpressProvider>
        <div>Child component</div>
      </BotpressProvider>,
    );

    expect(screen.getByText('Child component')).toBeInTheDocument();
  });

  it('should provide context values when botpress is configured', () => {
    vi.stubEnv('VITE_BOTPRESS_CLIENT_ID', 'test-client-id');
    window.botpressWebChat = { init: vi.fn(), open: vi.fn() };

    render(
      <BotpressProvider>
        <TestConsumer />
      </BotpressProvider>,
    );

    expect(screen.getByTestId('has-send-event').textContent).toBe('true');
    expect(screen.getByTestId('has-open-chat').textContent).toBe('true');
  });

  it('should render without crashing when VITE_BOTPRESS_CLIENT_ID is missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <BotpressProvider>
        <div>No config still works</div>
      </BotpressProvider>,
    );

    expect(screen.getByText('No config still works')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('VITE_BOTPRESS_CLIENT_ID'),
    );

    warnSpy.mockRestore();
  });

  it('should render without crashing when Botpress CDN is down', () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_BOTPRESS_CLIENT_ID', 'test-client-id');
    // Don't set window.botpressWebChat — simulate it not loading

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <BotpressProvider>
        <div>CDN down still works</div>
      </BotpressProvider>,
    );

    expect(screen.getByText('CDN down still works')).toBeInTheDocument();

    // Advance past the polling timeout (20 * 250ms = 5000ms)
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Botpress webchat script not loaded'),
    );

    warnSpy.mockRestore();
  });
});
