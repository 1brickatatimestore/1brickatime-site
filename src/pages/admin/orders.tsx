import * as React from "react";
import Head from "next/head";

type Order = {
  _id: string;
  email?: string;
  total?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          // be flexible about the API’s shape
          const list: Order[] = Array.isArray(data) ? data : (data?.orders ?? []);
          setOrders(list);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Admin • Orders</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
        <h1 style={{ marginBottom: "1rem" }}>Orders (Admin)</h1>

        <p style={{ opacity: 0.8, marginBottom: "1rem" }}>
          This page is protected by middleware (Basic Auth).
        </p>

        {loading && <p>Loading…</p>}
        {error && (
          <p style={{ color: "crimson" }}>
            Error loading orders: <b>{error}</b>
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <p>No orders yet.</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Date</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <Td mono>{o._id}</Td>
                    <Td>{fmtDate(o.createdAt)}</Td>
                    <Td>{o.email || "—"}</Td>
                    <Td>{o.status || "—"}</Td>
                    <Td align="right">
                      {fmtMoney(o.total, o.currency)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function fmtMoney(total?: number, cur?: string) {
  if (typeof total !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur || "AUD",
      maximumFractionDigits: 2,
    }).format(total / 100); // adjust if your API returns cents
  } catch {
    return `${total}${cur ? " " + cur : ""}`;
  }
}

function Th({
  children,
  align,
}: React.PropsWithChildren<{ align?: "left" | "right" | "center" }>) {
  return (
    <th
      style={{
        textAlign: align || "left",
        borderBottom: "1px solid #ddd",
        padding: "0.5rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  mono,
}: React.PropsWithChildren<{
  align?: "left" | "right" | "center";
  mono?: boolean;
}>) {
  return (
    <td
      style={{
        textAlign: align || "left",
        borderBottom: "1px solid #eee",
        padding: "0.5rem",
        whiteSpace: "nowrap",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
        fontSize: mono ? "0.85rem" : undefined,
      }}
    >
      {children}
    </td>
  );
}