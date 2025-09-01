<<<<<<< HEAD:src/pages/_app.tsx
// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import { CartProvider } from '@/context/CartContext'
import SiteLayout from '@/components/SiteLayout'
import '@/styles/globals.css'
=======
import type { AppProps } from "next/app";
import { CartProvider } from "@/context/CartContext";
import SiteLayout from "@/components/SiteLayout";
import "@/styles/globals.css";
>>>>>>> ed05686 (Stable backup - September 1st, 2025):_attic/pre_restore_20250830-1919/src/pages/_app.tsx

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </CartProvider>
  );
}
