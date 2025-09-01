// pages/_app.tsx
import '../styles/global.css'
import SiteLayout from '../components/SiteLayout'

export default function App({ Component, pageProps }) {
  return (
    <SiteLayout>
      <Component {...pageProps} />
    </SiteLayout>
  )
}