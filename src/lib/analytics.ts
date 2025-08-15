// src/lib/analytics.ts
import Script from "next/script";
import { useEffect } from "react";
import { useRouter } from "next/router";

// Choose analytics by env vars
const GA_ID = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";
const PLAUSIBLE_DOMAIN = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    plausible?: (event: string, opts?: Record<string, any>) => void;
  }
}

export function AnalyticsTags() {
  // GA4 tags
  if (GA_ID) {
    return (
      <>
        <Script
          id="ga4-src"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}
        </Script>
      </>
    );
  }

  // Plausible tag
  if (PLAUSIBLE_DOMAIN) {
    return (
      <Script
        id="plausible"
        strategy="afterInteractive"
        defer
        data-domain={PLAUSIBLE_DOMAIN}
        src="https://plausible.io/js/script.js"
      />
    );
  }

  return null;
}

// SPA pageview tracking for both
export function usePageviewTracking() {
  const router = useRouter();

  useEffect(() => {
    const onRouteChange = (url: string) => {
      if (GA_ID && typeof window.gtag === "function") {
        window.gtag("config", GA_ID, { page_path: url });
      }
      if (PLAUSIBLE_DOMAIN && typeof window.plausible === "function") {
        window.plausible("pageview", { u: url });
      }
    };
    router.events.on("routeChangeComplete", onRouteChange);
    return () => router.events.off("routeChangeComplete", onRouteChange);
  }, [router.events]);
}