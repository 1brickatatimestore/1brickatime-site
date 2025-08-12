import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type CartState = {
  items: CartItem[]
  add: (item: CartItem) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  totalItems: number
  subtotal: number
  isReady: boolean
}

const Ctx = createContext<CartState | undefined>(undefined)

function readLS(key: string): CartItem[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    // sanitize
    return arr
      .map((x) => ({
        id: String(x.id ?? ''),
        name: String(x.name ?? ''),
        price: Number(x.price ?? 0),
        qty: Math.max(0, Number(x.qty ?? 0)),
        imageUrl: x.imageUrl ? String(x.imageUrl) : undefined,
      }))
      .filter((x) => x.id && x.qty > 0)
  } catch {
    return []
  }
}

const LS_KEY = 'cart:v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const firstSave = useRef(true)

  // Hydrate from localStorage (client only)
  useEffect(() => {
    const init = readLS(LS_KEY)
    setItems(init)
    setReady(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!ready) return
    try {
      // avoid writing immediately on first hydration when nothing changed
      if (firstSave.current) {
        firstSave.current = false
      } else {
        localStorage.setItem(LS_KEY, JSON.stringify(items))
      }
    } catch {
      /* ignore */
    }
  }, [items, ready])

  const api = useMemo<CartState>(() => {
    const add = (item: CartItem) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.id === item.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], qty: next[idx].qty + item.qty }
          return next
        }
        return [...prev, { ...item }]
      })
    }

    const removeItem = (id: string) => {
      setItems((prev) => prev.filter((p) => p.id !== id))
    }

    const setQty = (id: string, qty: number) => {
      setItems((prev) => {
        if (qty <= 0) return prev.filter((p) => p.id !== id)
        return prev.map((p) => (p.id === id ? { ...p, qty } : p))
      })
    }

    const clear = () => setItems([])

    const totalItems = items.reduce((n, it) => n + (Number(it.qty) || 0), 0)
    const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0)

    return { items, add, removeItem, setQty, clear, totalItems, subtotal, isReady: ready }
  }, [items, ready])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}