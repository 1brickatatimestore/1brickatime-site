<<<<<<< HEAD
// src/pages/_app.tsx
import type { AppProps } from "next/app";
import { CartProvider } from "@/context/CartContext";
import SiteLayout from "@/components/SiteLayout";
import "@/styles/globals.css";
=======
import type { AppProps } from 'next/app'
import SiteLayout from '@/components/SiteLayout'
import { CartProvider } from '@/context/CartContext'
import '@/styles/globals.css'
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </CartProvider>
<<<<<<< HEAD
  );
=======
  )
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
}