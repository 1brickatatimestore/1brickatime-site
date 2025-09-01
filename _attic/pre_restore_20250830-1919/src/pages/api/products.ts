// Next.js (Pages Router) API route
// GET /api/products?type=MINIFIG&page=1&limit=36&sort=name_asc&theme=Star%20Wars&inStock=true
//
// Maps Spring's Page<Minifig> to { items: Minifig[], total: number } for the UI.

import type { NextApiRequest, NextApiResponse } from "next";

type BackendMinifig = {
  id: string;
  figNumber?: string | null;
  name: string;
  bricklinkName?: string | null;
  theme?: string | null;
  priceAUD?: number | null;
  qty?: number | null;
  condition?: "N" | "U" | null;
  status?: string | null;
  lotId?: string | null;
  myDesc?: string | null;
  myRemark?: string | null;
  image?: string | null;
  inStock?: boolean | null;
};

type BackendPage<T> = {
  content: T[];
  totalElements: number;
};

type UiMinifig = {
  _id: string;
  name: string;
  theme?: string;
  condition?: "N" | "U";
  inStock?: boolean;
  imageUrl?: string;
  price?: number; // AUD
};

const BACKEND_BASE =
  process.env.BACKEND_BASE?.replace(/\/+$/, "") || "http://localhost:8080";

function mapSort(sort?: string): string | undefined {
  // Accepts values like "name_asc", "name_desc", "price_asc", "price_desc"
  if (!sort) return undefined;
  const [field, dirRaw] = sort.split("_");
  const dir = (dirRaw || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  // backend fields
  const allowed: Record<string, string> = {
    name: "name",
    price: "priceAUD",
    theme: "theme",
    // add other backend sortables here if needed
  };

  const backendField = allowed[field];
  if (!backendField) return undefined;
  return `${backendField},${dir}`; // Spring expects "field,asc|desc"
}

function mapToUi(m: BackendMinifig): UiMinifig {
  return {
    _id: m.id,
    name: m.name,
    theme: m.theme ?? undefined,
    condition: (m.condition as "N" | "U" | null) ?? undefined,
    inStock: m.inStock ?? undefined,
    imageUrl: m.image ?? undefined,
    price: typeof m.priceAUD === "number" ? m.priceAUD : undefined,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const {
      type = "MINIFIG",
      page = "1",
      limit = "36",
      sort,
      theme,
      inStock,
    } = req.query as {
      type?: string;
      page?: string;
      limit?: string;
      sort?: string;
      theme?: string;
      inStock?: string;
    };

    // Only MINIFIG is supported right now
    if (type && type.toUpperCase() !== "MINIFIG") {
      return res.status(400).json({ error: "Unsupported type" });
    }

    // Convert UI paging (1-based) to Spring paging (0-based)
    const page0 = Math.max(parseInt(String(page), 10) || 1, 1) - 1;
    const size = Math.max(parseInt(String(limit), 10) || 36, 1);

    const params = new URLSearchParams();
    params.set("page", String(page0));
    params.set("limit", String(size));

    const backendSort = mapSort(sort);
    if (backendSort) params.set("sort", backendSort);

    if (theme) params.set("theme", theme);
    if (typeof inStock === "string") {
      // accept "true"/"false"
      const val = inStock.toLowerCase();
      if (val === "true" || val === "false") params.set("inStock", val);
    }

    const url = `${BACKEND_BASE}/api/minifigs?${params.toString()}`;

    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res
        .status(502)
        .json({ error: "Backend fetch failed", status: resp.status, text });
    }

    const data = (await resp.json()) as BackendPage<BackendMinifig>;

    // handle unpaged fallback (if backend ever returns a plain array)
    const backendItems = Array.isArray((data as any).content)
      ? (data as BackendPage<BackendMinifig>).content
      : (data as unknown as BackendMinifig[]);

    const total = Array.isArray((data as any).content)
      ? ((data as BackendPage<BackendMinifig>).totalElements ??
        backendItems.length)
      : backendItems.length;

    const items: UiMinifig[] = backendItems.map(mapToUi);

    return res.status(200).json({ items, total });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
