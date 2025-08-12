import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'

type Product = {
  _id?: string
  inventoryId?: number
  type?: string
  itemNo?: string
  name?: string
  condition?: 'N' | 'U' | string
  price?: number
  qty?: number
  imageUrl?: string
}

type ApiResp = {
  count?: number
  items?: Product[]
  inventory?: Product[]
}

function toList(data: ApiResp | null): Product[] {
  if (!data) return []
  return (data.items ?? data.inventory ?? []) as Product[]
}

export default function MinifigsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResp | null>(null)

  // Controls
  const [q, setQ] = useState('')
  const [condition, setCondition] = useState<'All' | 'New' | 'Used'>('All')
  const [inStock, setInStock] = useState(false)
  const [limit, setLimit] = useState(36)
  const [page, setPage] = useState(1)

  // Fetch base list (server returns all MINIFIGs; we filter client-side)
  useEffect(() => {
    let alive = true
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/products?type=MINIFIG&page=${page}&limit=${limit}`)
        if (!res.ok) throw new Error(`API ${res.status}`)
        const json: ApiResp = await res.json()
        if (alive) setData(json)
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [page, limit])

  const list = toList(data)

  const filtered = useMemo(() => {
    let out = list
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      out = out.filter(p =>
        (p.name || '').toLowerCase().includes(needle) ||
        (p.itemNo || '').toLowerCase().includes(needle)
      )
    }
    if (condition !== 'All') {
      const want = condition === 'New' ? 'N' : 'U'
      out = out.filter(p => (p.condition || '').toUpperCase() === want)
    }
    if (inStock) {
      out = out.filter(p => (p.qty ?? 0) > 0)
    }
    return out
  }, [list, q, condition, inStock])

  const total = data?.count ?? list.length

  return (
    <>
      <Head>
        <title>{`Minifigs (${total} total)`}</title>
      </Head>

      <div className="wrap">
        <h1>Minifigs <small>({total} total)</small></h1>

        <form
          className="controls"
          onSubmit={e => { e.preventDefault(); /* filtering is live */ }}
        >
          <input
            className="search"
            placeholder="Search name or code..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />

          <select
            className="cond"
            value={condition}
            onChange={e => setCondition(e.target.value as any)}
            aria-label="Condition"
          >
            <option>All</option>
            <option>New</option>
            <option>Used</option>
          </select>

          <select
            className="perPage"
            value={String(limit)}
            onChange={e => { setPage(1); setLimit(parseInt(e.target.value, 10)) }}
            aria-label="Per page"
          >
            <option>12</option>
            <option>24</option>
            <option>36</option>
            <option>48</option>
          </select>

          <label className="stock">
            <input
              type="checkbox"
              checked={inStock}
              onChange={e => setInStock(e.target.checked)}
            />
            Only in stock
          </label>

          <button className="apply" type="submit">Apply</button>

          <a className="reset" onClick={() => {
            setQ(''); setCondition('All'); setInStock(false); setPage(1); setLimit(36)
          }}>Reset</a>
        </form>

        {loading && <p style={{margin:'12px 0'}}>Loading…</p>}
        {error && <p style={{color:'#b5463b'}}>Error: {error}</p>}
        {!loading && filtered.length === 0 && <p>No items found.</p>}

        <div className="grid">
          {filtered.map((p) => {
            const id = p.inventoryId ? String(p.inventoryId) : (p._id || '')
            const price = typeof p.price === 'number' ? p.price.toFixed(2) : '--'
            const cond = (p.condition || '').toUpperCase() === 'N' ? 'New' :
                         (p.condition || '').toUpperCase() === 'U' ? 'Used' : ''
            return (
              <article key={id} className="card">
                <div className="imgBox">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name || p.itemNo || 'Minifig'}
                      fill
                      sizes="(max-width: 900px) 50vw, 240px"
                      style={{ objectFit: 'contain', objectPosition: 'center' }}
                    />
                  ) : (
                    <div className="noImg">No image</div>
                  )}
                </div>

                <div className="meta">
                  <div className="name" title={p.name || p.itemNo}>
                    {p.name || p.itemNo}
                  </div>
                  <div className="sub">
                    <span>{p.itemNo || ''}</span>
                    {cond && <em className="pill">{cond}</em>}
                  </div>
                </div>

                <div className="row">
                  <div className="price">
                    {price !== '--' ? `$${price}` : ''}
                  </div>
                  <a className="ghost" href={`/minifig/${id}`}>Details</a>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .wrap{ padding: 24px 0 32px; }
        h1{ font-size: 28px; margin: 0 0 16px; }
        h1 small{ font-size: 0.7em; font-weight: 400; opacity: .8; }

        .controls{
          display:flex; gap:10px; align-items:center; flex-wrap:wrap;
          background:#e9dfd2; padding:10px 12px; border-radius:8px;
          border:1px solid #d7c9b7; margin-bottom:14px;
        }
        .controls :global(input), .controls :global(select){
          font-size:14px; padding:6px 8px; border-radius:6px; border:1px solid #c7b8a5;
          background:#fff;
        }
        .search{ min-width: 260px; flex:1 1 260px; }
        .cond{ width:80px; }
        .perPage{ width:64px; }
        .stock{ display:flex; align-items:center; gap:6px; font-size:14px; }
        .apply{
          padding:6px 10px; border-radius:6px; border:1px solid #a58e73;
          background:#f1e7d8; cursor:pointer;
        }
        .reset{ margin-left:6px; font-size:14px; cursor:pointer; text-decoration: underline; }

        .grid{
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap:14px;
        }
        .card{
          background:#fff; border:1px solid #e1d6c8; border-radius:12px;
          padding:10px; box-shadow: 0 1px 0 rgba(0,0,0,.04);
          display:flex; flex-direction:column; gap:10px;
        }
        .imgBox{
          position:relative; width:100%; height:220px;
          background:#f8f6f1; border-radius:10px; overflow:hidden;
          border:1px solid #eee3d6;
        }
        .noImg{ position:absolute; inset:0; display:grid; place-items:center; color:#777; font-size:13px; }
        .meta .name{ font-size:14px; line-height:1.2; margin:0 0 4px; }
        .meta .sub{ display:flex; gap:8px; align-items:center; color:#656; font-size:12px; }
        .pill{
          background:#eef6ea; color:#2e7d32; border:1px solid #cfe6c9;
          border-radius:999px; padding:2px 6px; font-style:normal; font-size:12px;
        }
        .row{
          display:flex; justify-content:space-between; align-items:center;
        }
        .price{ font-weight:700; }
        .ghost{
          border:1px solid #cdb89f; padding:6px 10px; border-radius:8px;
          text-decoration:none; font-size:14px; color:#333; background:#faf7f2;
        }
      `}</style>
    </>
  )
}