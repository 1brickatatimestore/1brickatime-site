// pages/checkout.tsx
import Link from "next/link";
import { useCart } from "../context/CartContext";

const btn = (variant?: string) =>
  `inline-block text-center px-4 py-2 rounded text-white no-underline ${
    variant === "ghost" ? "bg-gray-600" : "bg-blue-600"
  }`;

export default function CheckoutPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();

  const getTotal = () =>
    cartItems.reduce((acc, item) => acc + (item.priceAUD || 0) * item.qty, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between border-b pb-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.figNumber} | Qty: {item.qty}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${item.priceAUD?.toFixed(2) ?? "N/A"} each
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-sm text-red-600 underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mb-6">
            <p className="text-lg font-semibold">
              Total: ${getTotal().toFixed(2)}
            </p>
          </div>

          <div className="space-x-4">
            <button onClick={clearCart} className={btn("ghost")}>
              Clear Cart
            </button>
            <Link href="/thank-you" className={btn()}>
              Checkout
            </Link>
          </div>
        </>
      )}

      <div className="mt-8 space-y-3">
        <Link href="/" className={btn("ghost")}>
          Return to homepage
        </Link>
        <Link href="/minifigs?type=MINIFIG&limit=36" className={btn()}>
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
