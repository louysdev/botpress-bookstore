/**
 * Fire a custom event on the window object.
 * Wrapped in try/catch to avoid throwing on failure.
 */
export function fireCustomEvent(
  type: string,
  detail: Record<string, unknown>,
): void {
  try {
    const event = new CustomEvent(type, { detail });
    window.dispatchEvent(event);
  } catch (err) {
    console.warn('[EventDispatcher] Failed to dispatch event:', type, err);
  }
}
