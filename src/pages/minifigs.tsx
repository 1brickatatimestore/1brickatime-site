import Head from "next/head";
import styles from "../styles/Minifigs.module.css";

type Minifig = {
  _id: string;
  figNumber: string;
  name: string;
  theme?: string;
  priceAUD?: number;
  qty?: number;
  image?: string;
  updatedAt?: string;
};

type ApiResp = { ok: boolean; count: number; items: Minifig[] };

export default function MinifigsPage({ items }: { items: Minifig[] }) {
  return (
    <>
      <Head>
        <title>Minifigures – 1 Brick at a Time</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={styles.wrap}>
        <h1 className={styles.h1}>Minifigures</h1>

        {items.length === 0 ? (
          <p className={styles.empty}>No minifigures found.</p>
        ) : (
          <ul className={styles.grid}>
            {items.map((m) => (
              <li key={m._id} className={styles.card}>
                <div className={styles.thumb}>
                  {/* fallback image if missing */}
                  {/*  PAYPAL_CLIENT_SECRET_REDACTED@next/next/no-img-element */}
                  <img
                    src={m.image || "https://placehold.co/320x320?text=Minifig"}
                    alt={m.name}
                    loading="lazy"
                  />
                </div>
                <div className={styles.body}>
                  <div className={styles.title}>{m.name}</div>
                  <div className={styles.sub}>
                    <span className={styles.theme}>{m.theme || "—"}</span>
                    <span className={styles.figNo}>{m.figNumber}</span>
                  </div>
                  <div className={styles.meta}>
                    <span className={styles.price}>
                      {typeof m.priceAUD === "number"
                        ? `A$ ${m.priceAUD.toFixed(2)}`
                        : "Price TBC"}
                    </span>
                    <span className={styles.qty}>
                      {typeof m.qty === "number" ? `Qty: ${m.qty}` : ""}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps() {
  // Call your own API route on the same deployment
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  const res = await fetch(`${base}/api/minifigs-live?limit=60`, {
    // keep it simple; edge/API will return JSON
    headers: { accept: "application/json" },
  });
  let items: Minifig[] = [];
  if (res.ok) {
    const data = (await res.json()) as ApiResp;
    items = Array.isArray(data.items) ? data.items : [];
  }
  return { props: { items } };
}