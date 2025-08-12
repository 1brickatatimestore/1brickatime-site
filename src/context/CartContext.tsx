<<<<<<< HEAD
// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;            // _id or itemNo
  name: string;
  price: number;         // per unit
  qty: number;
  imageUrl?: string | null;
  stock?: number;        // optional (for UI guards)
};

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  getQty: (id: string) => number;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_v1");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("cart_v1", JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartState["add"] = (it) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === it.id);
      if (idx >= 0) {
        const next = [...prev];
        const current = next[idx];
        const desired = current.qty + it.qty;
        const cap = typeof it.stock === "number" ? Math.max(0, Math.min(desired, it.stock)) : desired;
        next[idx] = { ...current, qty: cap };
        return next;
      }
      const cap = typeof it.stock === "number" ? Math.max(0, Math.min(it.qty, it.stock)) : it.qty;
      return [...prev, { ...it, qty: cap }];
    });
  };
  const remove = (id: string) => setItems(prev => prev.filter(p => p.id !== id));
  const updateQty = (id: string, qty: number) =>
    setItems(prev => prev.map(p => (p.id === id ? { ...p, qty: Math.max(0, qty) } : p)));
  const clear = () => setItems([]);
  const getQty = (id: string) => items.find(p => p.id === id)?.qty ?? 0;

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, it) => s + it.qty, 0), [items]);

  const value = { items, add, remove, updateQty, clear, getQty, subtotal, count };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
=======
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string            // inventoryId as string
  itemNo?: string | null
  name?: string | null
  price?: number | null
  imageUrl?: string | null
  qty: number           // qty in cart
}

type CartState = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  subtotal: number
  totalCount: number
}

const Ctx = createContext<CartState | undefined>(undefined)
const STORAGE_KEY = 'cart-v1'

function readStorage(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}
function writeStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => { setItems(readStorage()) }, [])
  useEffect(() => { writeStorage(items) }, [items])

  const addItem = (item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty + qty) } : i)
      }
      return [...prev, { ...item, qty: Math.max(1, qty) }]
    })
  }
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateQty = (id: string, qty: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, qty|0) } : i))
  const clearCart = () => setItems([])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0),
    [items]
  )
  const totalCount = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items])

  const value: CartState = { items, addItem, removeItem, updateQty, clearCart, subtotal, totalCount }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
}