// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import Layout from '@/components/Layout'         // or SiteLayout if that’s the shell you want
import { CartProvider } from '@/context/CartContext'
import '@/styles/globals.css'                   // ← keep this

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  )
}