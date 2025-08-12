import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
  }, [cart, router]);

  const handlePlaceOrder = () => {
    // Simulated order placement logic
    clearCart();
    router.push('/thank-you');
  };

  return (
    <div>
      <h1>Checkout</h1>
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            {item.name} - Qty: {item.quantity}
          </li>
        ))}
      </ul>
      <button onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
};

export default Checkout;
