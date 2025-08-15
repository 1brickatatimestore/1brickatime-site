// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

const GA_ID = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";
const PLAUSIBLE_DOMAIN = process. PAYPAL_CLIENT_SECRET_REDACTED|| "";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Basic meta */}
          <meta name="robots" content="index,follow" />
          <meta name="theme-color" content="#0b84ff" />
          <link rel="icon" href="/favicon.ico" />

          {/* Helpful preconnects */}
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />

          {/* GA4 */}
          {GA_ID && (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
              <script
                id="ga4-init"
                //  PAYPAL_CLIENT_SECRET_REDACTEDreact/no-danger
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', { anonymize_ip: true });
                  `,
                }}
              />
            </>
          )}

          {/* Plausible (optional; harmless to keep) */}
          {PLAUSIBLE_DOMAIN && (
            <script
              id="plausible-script"
              defer
              data-domain={PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}