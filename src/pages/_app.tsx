// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { CartProvider } from '../components/CartContext'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  )
}