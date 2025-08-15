// src/pages/minifig/[id].tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { buildAbsoluteUrl } from "@/lib/site-url";

type Minifig = any;

type Props = {
  minifig: Minifig | null;
};

export default function MinifigPage({ minifig }: Props) {
  if (!minifig) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Minifig not found</h1>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{minifig.name} — 1 Brick at a Time</title>
      </Head>
      <main style={{ padding: 32 }}>
        <h1>{minifig.name}</h1>
        {/* render the rest of your minifig UI here */}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = ctx.params?.id as string;

  // Use your own API so we don't import DB code here
  const base =
    process. PAYPAL_CLIENT_SECRET_REDACTED||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const url = `${base}/api/minifigs?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: { "x-ssr": "1" } });

  if (!res.ok) {
    return { notFound: true };
  }

  const data = await res.json();
  const minifig = Array.isArray(data) ? data[0] : data;

  if (!minifig) {
    return { notFound: true };
  }

  return {
    props: { minifig },
  };
};