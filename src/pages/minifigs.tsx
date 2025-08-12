import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Item = {
  _id?: string
  inventoryId?: number | null
  itemNo?: string | null
  name?: string | null
  price?: number | null
  imageUrl?: string | null
  condition?: string | null
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req }) => {
  const base = process. PAYPAL_CLIENT_SECRET_REDACTED|| `http://${req.headers.host}`
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
}

export default function MinifigsPage({ items, page, limit, count, type, cond, q }: Props) {
  const totalPages = Math.max(1, Math.ceil(count / limit))

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