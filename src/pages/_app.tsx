// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import { CartProvider } from '@/context/CartContext'
import SiteLayout from '@/components/Layout'
import '@/styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </CartProvider>
  )
}