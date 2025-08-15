// src/lib/site-url.ts
function stripTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// cache for server-side only (client reloads per page anyway)
let cachedBase: string | null = null;

export function getSiteUrl(): string {
  if (cachedBase) return cachedBase;

  // Client side: trust the browser
  if (typeof window !== 'undefined' && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  // Server side: prefer explicit envs you set
  const explicit = process. PAYPAL_CLIENT_SECRET_REDACTED|| process.env.SITE_URL;
  if (explicit) return (cachedBase = stripTrailingSlash(explicit));

  // Vercel fallback (VERCEL_URL is like "app-xyz.vercel.app", no protocol)
  if (process.env.VERCEL_URL) {
    return (cachedBase = `https://${process.env.VERCEL_URL}`);
  }

  // Local dev fallback
  const port = process.env.PORT || '3000';
  return (cachedBase = `http://localhost:${port}`);
}

export function buildAbsoluteUrl(path: string): string {
  // If `path` is already absolute, don’t touch it.
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, getSiteUrl()).toString();
}