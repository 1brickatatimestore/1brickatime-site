// src/lib/analytics.ts
import React from "react";
import Script from "next/script";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN; // e.g. 1brickatatimestore.com
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // e.g. G-XXXXXXX

/**
 * Drop-in analytics tags. Only loads what you’ve configured via env vars.
 *
 * Use in pages/_app.tsx:
 *   import { AnalyticsTags } from "@/lib/analytics";
 *   ...
 *   <AnalyticsTags />
 */
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

      {/* Google Analytics 4 (optional) */}
      {GA_ID && (
        <>
          <Script
            id="ga4-loader"
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga4-inline" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
    </>
  );
}