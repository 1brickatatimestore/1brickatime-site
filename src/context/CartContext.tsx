import { createContext, useContext, useMemo, useReducer, useEffect, ReactNode } from 'react'

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string | null
}

type State = { items: CartItem[] }
type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'INC'; id: string }
  | { type: 'DEC'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' }
  | { type: 'SET'; items: CartItem[] }

const Ctx = createContext<{
  items: CartItem[]
  add: (item: CartItem) => void
  inc: (id: string) => void
  dec: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  subtotal: number
}>({ items: [], add: () => {}, inc: () => {}, dec: () => {}, remove: () => {}, clear: () => {}, subtotal: 0 })

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET':
      return { items: action.items }
    case 'ADD': {
      const i = state.items.findIndex(x => x.id === action.item.id)
      if (i >= 0) {
        const copy = state.items.slice()
        copy[i] = { ...copy[i], qty: copy[i].qty + action.item.qty }
        return { items: copy }
      }
      return { items: [...state.items, action.item] }
    }
    case 'INC':
      return { items: state.items.map(x => x.id === action.id ? { ...x, qty: x.qty + 1 } : x) }
    case 'DEC':
      return { items: state.items.map(x => x.id === action.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x) }
    case 'REMOVE':
      return { items: state.items.filter(x => x.id !== action.id) }
    case 'CLEAR':
      return { items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] })

  // hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart.v1')
      if (raw) dispatch({ type: 'SET', items: JSON.parse(raw) })
    } catch {}
  }, [])

  // persist
  useEffect(() => {
    try {
      localStorage.setItem('cart.v1', JSON.stringify(state.items))
    } catch {}
  }, [state.items])

  const subtotal = useMemo(
    () => state.items.reduce((sum, x) => sum + (Number(x.price) || 0) * (Number(x.qty) || 0), 0),
    [state.items]
  )

  const api = useMemo(() => ({
    items: state.items,
    add: (item: CartItem) => dispatch({ type: 'ADD', item }),
    inc: (id: string) => dispatch({ type: 'INC', id }),
    dec: (id: string) => dispatch({ type: 'DEC', id }),
    remove: (id: string) => dispatch({ type: 'REMOVE', id }),
    clear: () => dispatch({ type: 'CLEAR' }),
    subtotal
  }), [state.items, subtotal])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useCart() {
  return useContext(Ctx)
}