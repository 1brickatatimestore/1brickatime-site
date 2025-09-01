// frontend/src/pages/api/minifigs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_BASE =
  process.env.BACKEND_BASE ||
  process.env.NEXT_PUBLIC_BACKEND_BASE ||
  "http://localhost:8080";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const qs = req.url?.split("?")[1] ?? "";
  const url = `${BACKEND_BASE}/api/minifigs${qs ? "?" + qs : ""}`;
  try {
    const r = await fetch(url);
    res.status(r.status).send(await r.text());
  } catch (e: any) {
    res
      .status(502)
      .json({ error: "proxy-failed", detail: String(e?.message || e) });
  }
}
