// pages/cart.tsx
import { useContext } from 'react';
import Head from 'next/head';
import SiteLayout from '@/components/SiteLayout';
import { CartContext } from '@/context/CartContext';

export default function CartPage() {
  const { cartItems, removeFromCart } = useContext(CartContext);

  const total = cartItems.reduce((sum, item) => sum + item.priceAUD * item.qty, 0);

  return (
    <SiteLayout>
      <Head>
        <title>Your Cart – 1Brick at a Time</title>
      </Head>

      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-300">
              {cartItems.map((item, index) => (
                <li key={index} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.figNumber}</p>
                  </div>
                  <div className="text-right">
                    <p>
                      ${item.priceAUD.toFixed(2)} x {item.qty}
                    </p>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 text-right font-semibold text-lg">Total: ${total.toFixed(2)}</div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
