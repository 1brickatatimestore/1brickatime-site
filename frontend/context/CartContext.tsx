// context/CartContext.tsx
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";

interface CartItem {
  _id: string;
  figNumber: string;
  name: string;
  priceAUD?: number;
  qty: number;
}

type CartState = {
  items: CartItem[];
};

type Action =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string } // by _id
  | { type: "CLEAR_CART" };

const CartContext = createContext<{
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
} | null>(null);

const reducer = (state: CartState, action: Action): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i._id === action.payload._id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i._id === action.payload._id
              ? { ...i, qty: i.qty + action.payload.qty }
              : i,
          ),
        };
      } else {
        return {
          items: [...state.items, action.payload],
        };
      }
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i._id !== action.payload),
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  // Optional: persist cart to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            dispatch({ type: "ADD_ITEM", payload: item });
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (item: CartItem) =>
    dispatch({ type: "ADD_ITEM", payload: item });

  const removeFromCart = (id: string) =>
    dispatch({ type: "REMOVE_ITEM", payload: id });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  return (
    <CartContext.Provider
      value={{
        cartItems: state.items,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
