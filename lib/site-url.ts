// lib/site-url.ts
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL; // e.g. my-app-123.vercel.app
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}