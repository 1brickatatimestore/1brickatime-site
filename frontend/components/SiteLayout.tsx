// components/SiteLayout.tsx
import Link from "next/link";
import styles from "./SiteLayout.module.css";
import CartBadge from "./CartBadge";
import { useCart } from "../context/CartContext";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { totalItems } = useCart();

  return (
    <div className={styles.site}>
      <div className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.png" alt="1 Brick at a Time" />
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navlink}>
              Home
            </Link>
            <Link href="/minifigs" className={styles.navlink}>
              Minifigs
            </Link>
            <Link href="/themes" className={styles.navlink}>
              Minifigs by Theme
            </Link>
            <Link href="/checkout" className={styles.navlink}>
              Checkout
            </Link>
            <Link href="/checkout" className={styles.cart}>
              <CartBadge count={totalItems} />
            </Link>
          </nav>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
