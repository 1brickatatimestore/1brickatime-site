// src/lib/cart.ts
export type CartItem = {
  sku: string;           // e.g. inventoryId or itemNo
  name: string;
  price: number;         // in AUD dollars (e.g. 4.5)
  quantity: number;
  imageUrl?: string | null;
};

const KEY = 'cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addItem(item: CartItem) {
  const cart = getCart();
  const i = cart.findIndex(x => x.sku === item.sku);
  if (i >= 0) {
    cart[i].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
}

export function clearCart() {
  setCart([]);
}

export function totalAUD(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}