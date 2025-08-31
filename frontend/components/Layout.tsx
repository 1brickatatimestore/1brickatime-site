// components/Layout.tsx
import React from "react";
import Link from "next/link";
import styles from "./SiteLayout.module.css";
import CartBadge from "./CartBadge";
import { useCart } from "../context/CartContext";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { totalItems } = useCart();

  return (
    <div className={styles.site}>
      <aside className={styles.sidebar}></aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.png" alt="1 Brick at a Time" />
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navlink}>
              Home
            </Link>
            <Link href="/minifigures" className={styles.navlink}>
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

        <footer className={styles.footer}>
          © {new Date().getFullYear()} 1Brick at a Time. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Layout;
