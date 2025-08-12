import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { CartProvider } from '../context/CartContext';
import SiteLayout from '../components/SiteLayout';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>1BrickAtATime</title>
      </Head>
      <SiteLayout>
        <Component {...pageProps} />
      </SiteLayout>
    </CartProvider>
  );
}

export default MyApp;
