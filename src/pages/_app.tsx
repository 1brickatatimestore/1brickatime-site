// src/pages/_app.tsx
import type { AppProps } from "next/app";
import { AnalyticsTags } from "@/lib/analytics";

// pick the import that exists in YOUR repo:
import { CartProvider } from "@/context/cart";     // ← try this first
// import { CartProvider } from "@/lib/cart";      // ← or this
// import { CartProvider } from "@/providers/cart"; // ← or this

import "@/styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <AnalyticsTags />
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </>
  );
}