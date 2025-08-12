import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type CartContextShape = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
}

const Ctx = createContext<CartContextShape | null>(null)

const LS_KEY = 'cart.v1'

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const addItem = (i: CartItem) => {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === i.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + (i.qty || 1) }
        return copy
      }
      return [...prev, { ...i, qty: i.qty || 1 }]
    })
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(p => p.id !== id))
  const setQty = (id: string, qty: number) =>
    setItems(prev => prev.map(p => (p.id === id ? { ...p, qty: Math.max(0, qty) } : p)))
  const clearCart = () => setItems([])

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items])
  const totalItems = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])

  const value: CartContextShape = { items, addItem, removeItem, setQty, clearCart, totalItems, subtotal }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}