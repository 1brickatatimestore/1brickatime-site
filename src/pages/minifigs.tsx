import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

<<<<<<< HEAD
type Product = {
  _id?: string;
  inventoryId?: number;
  name: string;
  price: number;
  imageUrl: string;
  condition?: string; // 'N' | 'U'
  remarks?: string;
  qty?: number;
  itemNo?: string;
  type?: string;
};

type ApiResult = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};

const THEME_KEYWORDS: Record<string, string[]> = {
  'Star Wars': ['star wars', 'sw ', 'skywalker', 'vader', 'stormtrooper', 'r2-d2'],
  'Harry Potter': ['harry potter', 'hogwarts', 'weasley', 'malfoy', 'dumbledore', 'hermione'],
  'Super Heroes': ['super heroes', 'super hero'],
  Marvel: ['marvel', 'avengers', 'spider-man', 'spiderman', 'iron man', 'captain america', 'thor', 'hulk', 'nick fury'],
  DC: ['dc', 'batman', 'joker', 'robin', 'harley', 'superman', 'wonder woman', 'flash', 'dick grayson'],
  City: ['city', 'police', 'firefighter', 'construction'],
  Ninjago: ['ninjago', 'lloyd', 'kai', 'cole', 'zane', 'nya', 'jay'],
  Friends: ['friends', 'heartlake'],
  Technic: ['technic'],
  'Lord of the Rings': ['lord of the rings', 'lotr', 'aragorn', 'gandalf', 'legolas', 'frodo'],
  Disney: ['disney', 'mickey', 'minnie', 'elsa', 'anna', 'moana'],
  'Jurassic World': ['jurassic', 'dinosaur'],
};

function matchesTheme(p: Product, theme?: string) {
  if (!theme) return true;
  const keys = THEME_KEYWORDS[theme];
  if (!keys) return true;
  const hay = `${p.name ?? ''} ${p.remarks ?? ''} ${p.itemNo ?? ''}`.toLowerCase();
  return keys.some((k) => hay.includes(k));
=======
type Item = {
  _id?: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  imageUrl?: string | null
<<<<<<< HEAD
  condition?: 'N' | 'U' | string | null
  type?: string | null
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)
=======
  condition?: string | null
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
}

type Props = {
  items: Item[]
  page: number
  limit: number
  count: number
  type: string
  cond: string
  q: string
}

<<<<<<< HEAD
<<<<<<< HEAD
  const apiQS = useMemo(() => {
    const u = new URLSearchParams();
    u.set('type', (query.type as string) || 'MINIFIG');
    u.set('page', String(query.page || 1));
    u.set('limit', String(query.limit || 36));
    if (query.onlyInStock) u.set('onlyInStock', '1');
    if (query.condition) u.set('condition', String(query.condition));
    if (query.q) u.set('q', String(query.q));
    return u.toString();
  }, [query]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const endpoints = [`/api/minifigs?${apiQS}`, `/api/products?${apiQS}`];

    (async () => {
      for (const url of endpoints) {
        try {
          const r = await fetch(url);
          const data = await r.json();

          let items: Product[] = [];
          if (Array.isArray(data?.items)) items = data.items as Product[];
          else if (Array.isArray(data?.products)) items = data.products as Product[];
          else if (Array.isArray(data)) items = data as Product[];

          if (items.length > 0 || url === endpoints[endpoints.length - 1]) {
            if (!alive) return;

            const total = Number(data?.total ?? items.length) || items.length;
            const page = Number(data?.page ?? query.page ?? 1) || 1;
            const pages =
              Number(data?.pages ?? Math.max(1, Math.ceil(total / Number(query.limit || 36)))) || 1;

            setResult({ items, total, page, pages });
            setLoading(false);
            return;
          }
        } catch {}
      }

      if (alive) {
        setResult({ items: [], total: 0, page: 1, pages: 1 });
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [apiQS, query.limit, query.page]);

  const theme = (query.theme as string) || '';
  const filtered: Product[] = useMemo(() => {
    const base = result?.items ?? [];
    if (!theme) return base;
    return base.filter((p) => matchesTheme(p, theme));
  }, [result?.items, theme]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const u = new URLSearchParams();
    u.set('type', 'MINIFIG');
    u.set('page', '1');
    u.set('limit', String(fd.get('limit') || '36'));
    const q = String(fd.get('q') || '');
    if (q) u.set('q', q);
    const cond = String(fd.get('condition') || '');
    if (cond) u.set('condition', cond);
    if (fd.get('stock')) u.set('onlyInStock', '1');
    if (theme) u.set('theme', theme);
    router.push(`/minifigs?${u.toString()}`);
  };

  const reset = () => router.push('/minifigs?type=MINIFIG&page=1&limit=36');
=======
function pick<T>(v: T | undefined | null, fallback: T): T {
  return v == null ? fallback : v
=======
export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req }) => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || `http://${req.headers.host}`
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 36)
  const type = String(query.type || 'MINIFIG')
  const cond = String(query.cond || '')
  const q = String(query.q || '')

  const url = new URL('/api/products', base)
  url.searchParams.set('type', type)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  if (cond) url.searchParams.set('cond', cond)
  if (q) url.searchParams.set('q', q)

  const res = await fetch(url.toString())
  const json = await res.json()

  return {
    props: {
      items: json.inventory ?? [],
      page,
      limit,
      count: json.count ?? 0,
      type,
      cond,
      q,
    }
  }
>>>>>>> e8a7bc6 (Checkout + product detail + cart working)
}

export default function MinifigsPage({ items, page, limit, count, type, cond, q }: Props) {
  const totalPages = Math.max(1, Math.ceil(count / limit))
>>>>>>> c2a3494 (Lock Minifigs page: filters + centered images)

  return (
    <>
      <Head><title>Minifigs — 1 Brick at a Time</title></Head>

      {/* Filters */}
      <form method="get" action="/minifigs" style={{ display:'flex', gap:12, alignItems:'center', margin:'0 0 16px' }}>
        <input type="hidden" name="type" value={type}/>
        <label>
          Condition:&nbsp;
          <select name="cond" defaultValue={cond} style={{ padding:'6px 8px', borderRadius:8, border:'1px solid #bbb' }}>
            <option value="">Any</option>
            <option value="N">New</option>
            <option value="U">Used</option>
          </select>
        </label>
        <label>
          Search:&nbsp;
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Name or number…"
            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #bbb', minWidth:220 }}
          />
        </label>
        <button type="submit" style={{
          padding:'8px 12px', borderRadius:8, border:'2px solid #204d69', color:'#204d69', fontWeight:700, background:'transparent'
        }}>Apply</button>
      </form>

      {/* Grid */}
      <div className="grid" style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',
        gap:16
      }}>
        {items.map(p => {
          const id = p.inventoryId ?? 0
          return (
            <article key={p._id ?? id} className="card" style={{
              background:'#fff', borderRadius:12, padding:12,
              boxShadow:'0 2px 8px rgba(0,0,0,.06)'
            }}>
              <Link href={`/minifig/${id}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div className="imgBox" style={{
                  position:'relative', width:'100%', height:220,
                  borderRadius:10, overflow:'hidden', background:'#fff',
                  display:'grid', placeItems:'center'
                }}>
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name || p.itemNo || 'Minifig'}
                      fill
                      sizes="(max-width: 900px) 50vw, 240px"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="noImg" style={{ color:'#999' }}>No image</div>
                  )}
                </div>

                <h3 style={{ margin:'10px 0 4px', fontSize:16, lineHeight:1.25, minHeight:40 }}>
                  {p.name || p.itemNo}
                </h3>
                <div style={{ color:'#666', fontSize:13, marginBottom:6 }}>{p.itemNo}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:800 }}>
                    {p.price != null ? `$${p.price.toFixed(2)}` : '—'}
                  </div>
                  {p.condition && (
                    <span style={{ padding:'2px 6px', border:'1px solid #999', borderRadius:6, fontSize:12 }}>
                      {p.condition === 'N' ? 'New' : p.condition === 'U' ? 'Used' : p.condition}
                    </span>
                  )}
                </div>
              </Link>
            </article>
          )
        })}
      </div>

      {/* Pager */}
      <div style={{ display:'flex', gap:8, alignItems:'center', margin:'16px 0' }}>
        <span>Page {page} of {totalPages}</span>
        {page > 1 && (
          <Link href={`/minifigs?type=${encodeURIComponent(type)}&cond=${encodeURIComponent(cond)}&q=${encodeURIComponent(q)}&limit=${limit}&page=${page-1}`}>
            Prev
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/minifigs?type=${encodeURIComponent(type)}&cond=${encodeURIComponent(cond)}&q=${encodeURIComponent(q)}&limit=${limit}&page=${page+1}`}>
            Next
          </Link>
        )}
      </div>
    </>
  )
}