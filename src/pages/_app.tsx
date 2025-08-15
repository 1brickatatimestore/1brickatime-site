import type { AppProps } from "next/app";
import Head from "next/head";

// You have a re-export here already:
import { CartProvider } from "@/components/CartContext";
// (If you prefer, you could import directly)
// import { CartProvider } from "@/context/CartContext";

import { AnalyticsTags } from "@/lib/analytics"; // this file must be .tsx

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>1 Brick at a Time</title>
      </Head>

      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>

      <AnalyticsTags />
    </>
  );
}