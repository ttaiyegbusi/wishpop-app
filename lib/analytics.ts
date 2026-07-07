export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (typeof window.va === 'function') {
    window.va('event', { name, data });
  }
}

declare global {
  interface Window {
    va?: (type: string, event?: { name: string; data?: Record<string, unknown> }) => void;
  }
}
