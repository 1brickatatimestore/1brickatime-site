import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

// ⚠️ Adjust this import path to where your theme-map file lives.
// Common locations: "@/theme-map" or "@/lib/theme-map" or "@/utils/theme-map"
import { THEME_LABELS, type ThemeKey, mapThemeKey } from "@/theme-map";

import styles from "@/styles/Minifigs.module.css"; // keep your existing styles if you have them
import MinifigCard, {
  type Minifig as CardMinifig,
} from "@/components/MinifigCard";

// -----------------------------
// Types
// -----------------------------
type Minifig = CardMinifig & {
  itemNo?: string;
};

type Filters = {
  theme?: ThemeKey | "all";
  q?: string;
  condition?: "New" | "Used" | "Any";
  inStock?: "1" | "0"; // 1 = only show qty>0
  sort?: "name" | "price-asc" | "price-desc";
};

// -----------------------------
// Helpers
// -----------------------------
const ALL_THEMES: { key: ThemeKey; label: string }[] = Object.entries(
  THEME_LABELS,
)
  .map(([key, label]) => ({ key: key as ThemeKey, label }))
  .sort((a, b) => a.label.localeCompare(b.label));

function coerceTheme(val: any): ThemeKey | "all" {
  if (val === "all" || val === undefined || val === null || val === "")
    return "all";
  return (val in THEME_LABELS ? val : "other") as ThemeKey;
}

function buildQuery(base: string, f: Filters) {
  const url = new URL(base);
  if (f.theme && f.theme !== "all")
    url.searchParams.set("theme", String(f.theme));
  if (f.q) url.searchParams.set("q", f.q);
  if (f.condition && f.condition !== "Any")
    url.searchParams.set("condition", f.condition);
  if (f.inStock === "1") url.searchParams.set("inStock", "1");
  if (f.sort) url.searchParams.set("sort", f.sort);
  return url.toString();
}

function backendBase() {
  // Prefer NEXT_PUBLIC_ for client, fallback to BACKEND_BASE for SSR/dev.
  return (
    process.env.NEXT_PUBLIC_BACKEND_BASE ||
    process.env.BACKEND_BASE ||
    "http://localhost:8080"
  );
}

// -----------------------------
// Page Component
// -----------------------------
export default function MinifigsByThemePage() {
  const router = useRouter();

  // Extract initial filters from URL
  const initial: Filters = {
    theme: coerceTheme(router.query.theme),
    q: typeof router.query.q === "string" ? router.query.q : "",
    condition:
      router.query.condition === "New" || router.query.condition === "Used"
        ? (router.query.condition as Filters["condition"])
        : "Any",
    inStock: router.query.inStock === "1" ? "1" : "0",
    sort:
      router.query.sort === "price-asc" ||
      router.query.sort === "price-desc" ||
      router.query.sort === "name"
        ? (router.query.sort as Filters["sort"])
        : "name",
  };

  const [filters, setFilters] = useState<Filters>(initial);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Minifig[]>([]);
  const [error, setError] = useState<string | null>(null);

  const base = backendBase();
  const apiUrl = useMemo(() => {
    // Use your existing backend listing endpoint.
    // Common patterns:
    //   GET /api/minifigs
    //   GET /api/products?type=minifig
    // Adjust this path if needed — we’re not rewriting your API.
    return buildQuery(`${base}/api/minifigs`, filters);
  }, [base, filters]);

  // Fetch list whenever filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as Minifig[];
        if (!cancelled) setItems(data || []);
      })
      .catch(
        (e) =>
          !cancelled && setError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  // Push filters to URL (shallow) when they change
  useEffect(() => {
    const q: Record<string, string> = {};
    if (filters.theme && filters.theme !== "all")
      q.theme = String(filters.theme);
    if (filters.q) q.q = filters.q;
    if (filters.condition && filters.condition !== "Any")
      q.condition = filters.condition;
    if (filters.inStock === "1") q.inStock = "1";
    if (filters.sort && filters.sort !== "name") q.sort = filters.sort;

    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.theme,
    filters.q,
    filters.condition,
    filters.inStock,
    filters.sort,
  ]);

  // -----------------------------
  // Render
  // -----------------------------
  const themeValue: ThemeKey | "all" = filters.theme ?? "all";

  return (
    <>
      <Head>
        <title>Minifigures by Theme</title>
      </Head>

      <main className={styles?.container ?? ""}>
        {/* Black tab with theme dropdowns (from theme-map) */}
        <section className={styles?.themeTabs ?? ""} aria-label="Theme filters">
          <div className={styles?.tabRow ?? ""}>
            <label className={styles?.tabLabel ?? ""}>Theme</label>
            <select
              className={styles?.select ?? ""}
              value={themeValue}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  theme: e.target.value as ThemeKey | "all",
                }))
              }
            >
              <option value="all">All Themes</option>
              {ALL_THEMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Top filter bar (search, condition, in-stock, sort) */}
        <section className={styles?.filters ?? ""} aria-label="Filters">
          <input
            className={styles?.search ?? ""}
            type="search"
            placeholder="Search minifigs…"
            value={filters.q || ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />

          <select
            className={styles?.select ?? ""}
            value={filters.condition}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                condition: e.target.value as Filters["condition"],
              }))
            }
            aria-label="Condition"
          >
            <option value="Any">Any Condition</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </select>

          <label className={styles?.checkboxLabel ?? ""}>
            <input
              type="checkbox"
              checked={filters.inStock === "1"}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  inStock: e.target.checked ? "1" : "0",
                }))
              }
            />
            In stock only
          </label>

          <select
            className={styles?.select ?? ""}
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                sort: e.target.value as Filters["sort"],
              }))
            }
            aria-label="Sort by"
          >
            <option value="name">Sort: Name</option>
            <option value="price-asc">Sort: Price ↑</option>
            <option value="price-desc">Sort: Price ↓</option>
          </select>
        </section>

        {/* Status row */}
        <section className={styles?.status ?? ""}>
          {loading && <span>Loading…</span>}
          {!loading && error && (
            <span className={styles?.error ?? ""}>Error: {error}</span>
          )}
          {!loading && !error && (
            <span>
              Showing <strong>{items.length}</strong>{" "}
              {themeValue === "all"
                ? "minifigures"
                : `“${THEME_LABELS[themeValue as ThemeKey]}” minifigures`}
            </span>
          )}
        </section>

        {/* Grid of cards (uses MinifigCard with BrickLink-style images) */}
        <section className={styles?.grid ?? ""} aria-label="Minifigure results">
          {items.map((m) => (
            <MinifigCard key={m._id} m={m} />
          ))}
        </section>

        {/* Tiny help/footer */}
        <footer className={styles?.foot ?? ""}>
          <Link href="/minifigures">Go to /minifigures (alias)</Link>
        </footer>
      </main>
    </>
  );
}
