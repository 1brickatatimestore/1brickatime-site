// src/pages/minifig/[id].tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";

type Minifig = {
  _id?: string;
  id?: string;
  name?: string;
  itemNo?: string;
  price?: number;
  images?: { main?: string } | string[];
  [key: string]: any;
};

type Props = {
  minifig: Minifig | null;
};

function getBaseUrl() {
  // Prefer explicit public URL, then Vercel URL, then localhost
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default function MinifigPage({ minifig }: Props) {
  if (!minifig) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Minifig not found</h1>
        <p>Sorry, we couldn’t find that minifig.</p>
      </main>
    );
  }

  const title = minifig.name ? `${minifig.name} — 1 Brick at a Time` : "Minifig — 1 Brick at a Time";
  const img =
    (Array.isArray(minifig.images) ? minifig.images[0] : minifig.images?.main) || "/logo.png";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={minifig.name ?? "Minifig"} />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={img} />
      </Head>

      <main style={{ padding: 24 }}>
        <h1 style={{ marginBottom: 12 }}>{minifig.name ?? "Minifig"}</h1>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div
            style={{
              width: 280,
              aspectRatio: "1/1",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              padding: 8,
            }}
          >
            {/* handle either string[] or {main} */}
            <img
              src={img}
              alt={minifig.name ?? "Minifig"}
              style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
            />
          </div>

          <div>
            {minifig.itemNo && (
              <p style={{ color: "#6b7280", margin: "4px 0 12px" }}>SKU: {minifig.itemNo}</p>
            )}
            {typeof minifig.price === "number" && (
              <p style={{ fontWeight: 700, fontSize: 18 }}>${minifig.price.toFixed(2)}</p>
            )}
            {/* Add the rest of your product details, add-to-cart, etc. */}
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id as string;
  const base = getBaseUrl();

  // NOTE: This expects /pages/api/minifigs.ts (plural).
  // If your API file is singular, change this to `/api/minifig?id=...`
  const url = `${base}/api/minifigs?id=${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url, { headers: { "x-ssr": "1" } });

    if (!res.ok) {
      console.error(`[minifig/[id]] API responded ${res.status}: ${await res.text()}`);
      return { notFound: true };
    }

    const data = await res.json();

    // Accept a few possible shapes gracefully
    const minifig: Minifig | null =
      (data && data.item) ||
      (Array.isArray(data?.items) ? data.items[0] : null) ||
      (data && !Array.isArray(data) && typeof data === "object" ? data : null);

    if (!minifig) return { notFound: true };

    return { props: { minifig } };
  } catch (err) {
    console.error("[minifig/[id]] fetch error:", err);
    return { notFound: true };
  }
};