import type { AppProps } from "next/app";
import Head from "next/head";
import { AnalyticsTags } from "@/lib/analytics";
// Either path works; pick one you actually have:
import { CartProvider } from "@/components/CartContext";
// import { CartProvider } from "@/context/CartContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* Keep your existing meta/links here */}
      </Head>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
      <AnalyticsTags />
    </>
  );
}