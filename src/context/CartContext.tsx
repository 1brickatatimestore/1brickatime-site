import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

interface CartContextProps {
  cart: CartItem[]
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextProps | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])

  const add = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id)
      if (idx !== -1) {
        const newCart = [...prev]
        newCart[idx].qty += item.qty
        return newCart
      }
      return [...prev, item]
    })
  }

  const remove = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id))
  const clear = () => setCart([])

  return (
    <CartContext.Provider value={{ cart, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}