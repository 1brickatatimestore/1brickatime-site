// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN; // "www.1brickatatimestore.com,1brickatatimestore.com"
  return (
    <Html lang="en">
      <Head>
        {domain && (
          <script
            defer
            data-domain={domain}
            data-api="https://plausible.io/api/event"
            src="https://plausible.io/js/script.js"
          />
        )}
        <meta name="robots" content="index,follow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}