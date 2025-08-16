// pages/index.js
import React from 'react';

export async function getServerSideProps(ctx) {
  const base = process. PAYPAL_CLIENT_SECRET_REDACTED|| `http://localhost:${process.env.PORT || 3000}`;
  const r = await fetch(`${base}/api/list-products`);
  const j = await r.json();
  return { props: { items: j.items || [] } };
}

export default function Home({ items }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Minifig test list (temporary)</h1>
      <p>Found: {items.length}</p>
      <ul>
        {items.slice(0,50).map(it => (
          <li key={it.inventory_id ?? (it.item && it.item.no) ?? Math.random()}>
            {it.item?.no ?? it.item_no} — {it.item?.name ?? it.name} — color:{it.color_id ?? it.color}
          </li>
        ))}
      </ul>
    </main>
  );
}