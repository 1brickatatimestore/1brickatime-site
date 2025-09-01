// src/lib/api.ts

export type Minifig = {
  _id?: string;
  id?: string;
  name: string;
  qty?: number;
  price?: number;
  imageUrl?: string;
  [k: string]: unknown;
};

export const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
);

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function fetchMinifigsPage(page = 0, limit = 100): Promise<PageResponse<Minifig>> {
  const res = await fetch(`${API_BASE}/api/minifigs?limit=${limit}&page=${page}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Backend ${res.status}: ${text}`);
  }
  return (await res.json()) as PageResponse<Minifig>;
}

export async function fetchAllMinifigs(pageSize = 500): Promise<Minifig[]> {
  const all: Minifig[] = [];
  let page = 0;
  while (true) {
    const data = await fetchMinifigsPage(page, pageSize);
    const chunk = Array.isArray(data?.content) ? data.content : [];
    all.push(...chunk);
    if (chunk.length < pageSize) break;
    page++;
  }
  return all.map((m) => ({ ...m, _id: m._id ?? m.id }));
}
