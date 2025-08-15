// src/pages/_app.tsx
import type { AppProps } from 'next/app';

// ✅ Import the CartProvider from a path that exists in your repo.
// You have BOTH of these in your tree; EITHER import will work.
// Prefer this one (shim that re-exports the real context):
import CartProvider from '@/components/CartContext';
// If you prefer to import the source directly, use:
// import { CartProvider } from '@/context/CartContext';

import '@/styles/globals.css'; // keep if you have it; otherwise delete this line

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}