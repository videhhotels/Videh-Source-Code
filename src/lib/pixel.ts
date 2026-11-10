// Meta (Facebook) Pixel helpers. The Pixel only loads when NEXT_PUBLIC_META_PIXEL_ID is set (in Vercel → Settings →
// Environment Variables). No names, phone numbers or emails are ever sent to Meta — only the event name.
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.replace(/\D/g, "") || "";

type Fbq = (...args: unknown[]) => void;
declare global { interface Window { fbq?: Fbq } }

/** Send a standard Meta event (e.g. "Lead", "Contact"). Waits briefly if the Pixel script is still loading. */
export function trackPixel(event: string, params?: Record<string, string | number>, eventID?: string, tries = 0) {
  if (!PIXEL_ID || typeof window === "undefined") return;
  if (location.pathname.startsWith("/admin")) return;
  if (!window.fbq) { if (tries < 10) setTimeout(() => trackPixel(event, params, eventID, tries + 1), 500); return; }
  window.fbq("track", event, params || {}, eventID ? { eventID } : undefined);
}
