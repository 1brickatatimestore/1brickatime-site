import Script from "next/script";

/**
 * Comma-separated list of hostnames you want counted by Plausible.
 * e.g. "www.1brickatatimestore.com,1brickatatimestore.com,1brickatime-site-XXXX.vercel.app"
 *
 * Set via Vercel env: NEXT_PUBLIC_PLAUSIBLE_DOMAIN
 */
const PLAUSIBLE_DOMAIN = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";

/** Drop this near the end of _app.tsx */
export function AnalyticsTags() {
  return (
    <>
      {/* Plausible */}
      {PLAUSIBLE_DOMAIN && (
        <Script
          id="plausible-script"
          defer
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
        />
      )}
    </>
  );
}

/** Optional helper for custom events */
export function trackPlausible(
  event: string,
  props?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(event, { props });
  }
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, any> }) => void;
  }
}