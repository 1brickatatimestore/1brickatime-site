import type { AppProps } from 'next/app'
import SiteLayout from '@/components/SiteLayout'
import { CartProvider } from '@/context/CartContext'
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