import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type State = { items: CartItem[] }
type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }

const Ctx = createContext<{
  items: CartItem[]
  add: (item: CartItem) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  totalItems: number
  totalPrice: number
} | null>(null)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + (action.item.qty || 1) } : i
          ),
        }
      }
      return { items: [...state.items, { ...action.item, qty: action.item.qty || 1 }] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => i.id !== action.id) }
    case 'SET_QTY':
      return {
        items: state.items.map(i => (i.id === action.id ? { ...i, qty: Math.max(0, action.qty) } : i)),
      }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  // hydrate from localStorage (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart:v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'CLEAR' })
          for (const it of parsed.items) {
            dispatch({ type: 'ADD', item: it })
          }
        }
      }
    } catch {}
    //  PAYPAL_CLIENT_SECRET_REDACTEDreact-hooks/exhaustive-deps
  }, [])

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart:v1', JSON.stringify({ items: state.items }))
    } catch {}
  }, [state.items])

  const add = (item: CartItem) => dispatch({ type: 'ADD', item })
  const removeItem = (id: string) => dispatch({ type: 'REMOVE', id })
  const setQty = (id: string, qty: number) => dispatch({ type: 'SET_QTY', id, qty })
  const clear = () => dispatch({ type: 'CLEAR' })

  const totalItems = useMemo(() => state.items.reduce((n, i) => n + (i.qty || 0), 0), [state.items])
  const totalPrice = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * (i.qty || 0), 0),
    [state.items]
  )

  const value = useMemo(
    () => ({ items: state.items, add, removeItem, setQty, clear, totalItems, totalPrice }),
    [state.items, totalItems, totalPrice]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}