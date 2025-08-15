// src/lib/ga.ts
export const GA_ID = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";
export const hasGA = !!GA_ID;

type Gtag = (...args: any[]) => void;

// Safe wrapper around window.gtag
export function gtag(...args: Parameters<Gtag>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag(...args);
  }
}

export function pageview(url: string) {
  if (!hasGA) return;
  gtag("config", GA_ID, { page_path: url, anonymize_ip: true });
}

export function event(name: string, params: Record<string, any> = {}) {
  if (!hasGA) return;
  gtag("event", name, params);
}