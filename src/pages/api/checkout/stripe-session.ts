import Stripe from 'stripe';
import type { CartItem } from '@/types/cart';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export async function createCheckoutSession(cart: CartItem[]) {
  const line_items = cart.map(item => ({
    price_data: {
      currency: 'aud',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/thank-you`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
  });

  return session;
}