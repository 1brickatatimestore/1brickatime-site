// pages/thank-you.tsx
import Link from "next/link";

const btn = (variant?: string) =>
  `px-4 py-2 rounded text-white ${variant === "ghost" ? "bg-gray-500" : "bg-blue-600"}`;

export default function ThankYouPage() {
  return (
    <div>
      <h1>Thank you for your order!</h1>

      <div className="space-y-2">
        <Link href="/minifigs?type=MINIFIG&limit=36" className={btn()}>
          Continue shopping
        </Link>

        <Link href="/checkout" className={btn("ghost")}>
          View cart/receipt
        </Link>

        <Link href="/checkout" className={btn()}>
          Return to checkout
        </Link>

        <Link href="/minifigs?type=MINIFIG&limit=36" className={btn("ghost")}>
          Keep browsing
        </Link>

        <Link href="/checkout" className={btn()}>
          Go to checkout
        </Link>

        <Link href="/minifigs?type=MINIFIG&limit=36" className={btn("ghost")}>
          Browse minifigs
        </Link>
      </div>
    </div>
  );
}
