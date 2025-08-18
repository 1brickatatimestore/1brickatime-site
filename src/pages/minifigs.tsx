// src/pages/minifigs.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MinifigCard from "@/components/MinifigCard";

type LiveRow = {
  // Shape coming back from /api/minifigs-live (BrickLink inventories)
  // We’ll normalize what we need; extra fields are ignored.
  inventory_id?: number;
  item?: {
    no?: string;
    name?: string;
    type?: string; // "MINIFIG"
  };
  color_id?: number | null;
  new_or_used?: "N" | "U";
  quantity?: number;
  unit_price?: number;
  remarks?: string;
  // optional media your importer might attach
  imageUrl?: string;
};

type UiItem = {
  id: string;           // e.g. item.no
  itemNo: string;
  name: string;
  price: number;        // in store currency units (AUD)
  stock: number;        // available qty
  imageUrl?: string;
  condition?: string;   // "New" | "Used"
  remarks?: string;
};

type ApiResponse = {
  meta: { total: number };
  items: LiveRow[];
};

const PAGE_SIZE = 36;

export default function MinifigsPage() {
  const [items, setItems] = useState<UiItem[]>([]);
  const [metaTotal, setMetaTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  // Fetch LIVE from BrickLink proxy
  useEffect(() => {
    let cancel = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        // We fetch once and slice on the client in case your endpoint doesn’t paginate yet.
        const res = await fetch(`/api/minifigs-live?limit=10000`, {
          headers: { "cache-control": "no-cache" },
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data: ApiResponse = await res.json();

        if (cancel) return;

        const normalized: UiItem[] = (data.items || [])
          .filter((r) => (r.item?.type || "").toUpperCase() === "MINIFIG")
          .map((r) => {
            const itemNo = String(r.item?.no || "");
            const name = String(r.item?.name || itemNo || "Minifig");
            const price = Number(r.unit_price ?? 0) || 0;
            const stock = Number(r.quantity ?? 0) || 0;
            const condition =
              r.new_or_used === "N" ? "New" : r.new_or_used === "U" ? "Used" : undefined;

            // Prefer provided imageUrl; otherwise infer from BrickLink CDN convention when possible
            const imageUrl =
              r.imageUrl ||
              (itemNo
                ? `https://img.bricklink.com/ItemImage/MN/0/${encodeURIComponent(itemNo)}.png`
                : undefined);

            return {
              id: itemNo || String(r.inventory_id || ""),
              itemNo,
              name,
              price,
              stock,
              imageUrl,
              condition,
              remarks: r.remarks || "",
            };
          });

        setItems(normalized);
        setMetaTotal(Number(data.meta?.total ?? normalized.length));
      } catch (e: any) {
        setErr(e?.message || "Failed to load minifigs.");
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    run();
    return () => {
      cancel = true;
    };
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((metaTotal || items.length) / PAGE_SIZE));
  }, [metaTotal, items.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  return (
    <>
      <Head>
        <title>Minifigures — 1 Brick at a Time</title>
      </Head>

      <main className="wrap">
        <header className="header">
          <h1>Minifigures</h1>
          <div className="muted">
            {loading
              ? "Loading…"
              : `${metaTotal || items.length} items • Page ${page}/${totalPages}`}
          </div>
        </header>

        {err && (
          <div className="error">
            <b>Could not load inventory:</b> {err}
          </div>
        )}

        {!loading && !err && pageItems.length === 0 && (
          <div className="empty">
            <p>No minifigures found.</p>
            <Link className="btn" href="/">
              Go home
            </Link>
          </div>
        )}

        <section className="grid">
          {pageItems.map((p) => (
            <MinifigCard key={p.id || p.itemNo} item={p} />
          ))}
        </section>

        {!loading && pageItems.length > 0 && (
          <nav className="pager">
            <button
              className="btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="muted">
              Page {page} / {totalPages}
            </span>
            <button
              className="btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </nav>
        )}
      </main>

      <style jsx>{`
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .muted {
          color: #666;
          font-size: 14px;
        }
        .error {
          background: #fff3f3;
          border: 1px solid #ffd8d8;
          color: #a40000;
          padding: 12px;
          border-radius: 10px;
          margin: 10px 0 16px;
        }
        .empty {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          padding: 24px;
          text-align: center;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1200px) {
          .grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 800px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 600px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .pager {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          margin: 18px 0 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid #c9c9c9;
          background: #fafafa;
          text-decoration: none;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}