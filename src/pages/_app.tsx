// pages/_app.tsx
import type { AppProps } from "next/app";
import Script from "next/script";

export default function MyApp({ Component, pageProps }: AppProps) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <>
      {domain && (
        <Script
          defer
          data-domain={domain}
          src="https://plausible.io/js/script.js"
        />
      )}
      <Component {...pageProps} />
    </>
  );
}