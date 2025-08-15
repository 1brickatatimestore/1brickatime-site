import type { GetServerSideProps } from "next";

type Props = { authed: boolean };

export default function OrdersPage({ authed }: Props) {
  if (!authed) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <div style={{ background: "#fff", padding: 24, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,.08)" }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Admin access required</h1>
          <p style={{ marginTop: 8, color: "#555" }}>
            Set <code>ADMIN_TOKEN</code> in your environment, then visit:
          </p>
          <code style={{ display: "block", background: "#f4f4f5", padding: 10, borderRadius: 8 }}>
            /admin/orders?key=YOUR_ADMIN_TOKEN
          </code>
          <p style={{ marginTop: 12, color: "#666" }}>
            Or use Basic Auth header: <code>admin:YOUR_ADMIN_TOKEN</code>
          </p>
        </div>
      </div>
    );
  }

  // Replace with your real UI
  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: "0 16px" }}>
      <h1>Orders</h1>
      <p>You’re authenticated. Build your orders table here.</p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = process.env.ADMIN_TOKEN || "";
  let authed = false;

  if (token) {
    const keyParam = Array.isArray(ctx.query.key) ? ctx.query.key[0] : ctx.query.key;
    const authHeader = ctx.req.headers.authorization || "";
    const expected = "Basic " + Buffer.from(`admin:${token}`).toString("base64");
    authed = keyParam === token || authHeader === expected;
  }

  return { props: { authed } };
};