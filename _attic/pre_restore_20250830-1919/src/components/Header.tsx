import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import styles from "./Header.module.css"; // keep your existing styles if you have them

const NAV = [
  { href: "/", label: "Home" },
  { href: "/minifigures", label: "Minifigures" }, // canonical URL
  { href: "/checkout", label: "Checkout" },
];

export default function Header() {
  const { pathname } = useRouter();

  return (
    <header className={styles?.header ?? ""}>
      <nav className={styles?.nav ?? ""} aria-label="Main">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? (styles?.active ?? "") : ""}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
