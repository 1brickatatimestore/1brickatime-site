import type { AppProps } from 'next/app'
import SiteLayout from '@/components/SiteLayout'
import { CartProvider } from '@/components/CartContext'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </CartProvider>
  )
}