import type { AppProps } from 'next/app'
import { CartProvider } from '@/context/CartContext'
import SiteLayout from '@/components/SiteLayout'
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