// src/pages/_app.tsx
import type { AppProps } from 'next/app'
import SiteLayout from '@/components/SiteLayout'
import '@/styles/globals.css' // if you have one

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SiteLayout>
      <Component {...pageProps} />
    </SiteLayout>
  )
}