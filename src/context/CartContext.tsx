import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
  stock?: number // NEW: available stock so we can clamp
}

type CartCtx = {
  items: CartItem[]
  count: number
  total: number
  add: (item: CartItem) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  getQty: (id: string) => number
}

const Ctx = createContext<CartCtx | null>(null)
const LS_KEY = 'cart:v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])
  // save
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  const getQty = (id: string) => items.find(i => i.id === id)?.qty || 0

  const add = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      const max = typeof item.stock === 'number' ? Math.max(0, item.stock) : Infinity
      if (existing) {
        const nextQty = Math.min(max, existing.qty + (item.qty || 1))
        return prev.map(i => (i.id === item.id ? { ...i, qty: nextQty, stock: item.stock ?? i.stock } : i))
      } else {
        const clamped = Math.min(max, item.qty || 1)
        return [...prev, { ...item, qty: clamped }]
      }
    })
  }

  const setQty = (id: string, qty: number) => {
    setItems(prev =>
      prev.map(i => {
        if (i.id !== id) return i
        const max = typeof i.stock === 'number' ? Math.max(0, i.stock) : Infinity
        return { ...i, qty: Math.max(0, Math.min(max, qty)) }
      })
    )
  }

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const clear = () => setItems([])

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])
  const total = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items])

  const value: CartCtx = { items, count, total, add, setQty, remove, clear, getQty }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}