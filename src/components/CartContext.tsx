import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type CartItem = {
  id: string
  itemNo?: string
  name: string
  price?: number        // dollars (optional)
  priceCents?: number   // preferred
  quantity: number
  imageUrl?: string
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  subtotalCents: number
  subtotal: number
}

const Ctx = createContext<CartState | null>(null)
export const useCart = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('CartProvider missing')
  return v
}

const STORAGE_KEY = '1bat_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const add: CartState['add'] = (item, qty = 1) => {
    setItems(prev => {
      const i = prev.findIndex(p => p.id === item.id)
      const priceCents = item.priceCents ?? Math.round((item.price ?? 0) * 100)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], quantity: next[i].quantity + qty, priceCents }
        return next
      }
      return [...prev, { ...item, priceCents, quantity: qty }]
    })
  }
  const remove = (id: string) => setItems(prev => prev.filter(p => p.id !== id))
  const setQty = (id: string, qty: number) =>
    setItems(prev => prev.map(p => (p.id === id ? { ...p, quantity: Math.max(0, qty) } : p)))
  const clear = () => setItems([])

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + Math.max(0, i.quantity) * (i.priceCents ?? Math.round((i.price ?? 0) * 100)), 0),
    [items]
  )
  const subtotal = subtotalCents / 100

  const value: CartState = { items, add, remove, setQty, clear, subtotalCents, subtotal }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}