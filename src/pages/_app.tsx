import type { AppProps } from 'next/app'
import SiteLayout from '@/components/SiteLayout'
import '@/styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SiteLayout>
      <Component {...pageProps} />
    </SiteLayout>
  )
}