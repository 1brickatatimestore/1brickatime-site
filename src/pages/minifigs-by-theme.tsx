import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

type ThemeOpt = { key: string; label: string; count: number }
type SeriesOpt = { key: string; label: string; count: number }
type ThemesResp = { options: ThemeOpt[]; cmfSeries?: SeriesOpt[] }

type Item = {
  _id?: string
  inventoryId?: number
  itemNo?: string
  name?: string
  price?: number
  imageUrl?: string
}

type PageProps = {
  items: Item[]
  total: number
  page: number
  limit: number
  theme: string
  series: string
  inStock: boolean
  themes: ThemesResp
}

const SITE =
  process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'

export default function ByThemePage(props: PageProps) {
  const router = useRouter()
  const [theme, setTheme] = useState(props.theme)
  const [series, setSeries] = useState(props.series)
  const [limit, setLimit] = useState(props.limit)
  const [inStock, setInStock] = useState(props.inStock)

  const isCMF = theme === 'collectible-minifigures'
  const cmfSeries = props.themes.cmfSeries || []

  function apply() {
    const query: Record<string, string> = {
      limit: String(limit),
      page: '1',
      theme,
    }
    if (isCMF && series) query.series = series
    if (inStock) query.inStock = '1'
    router.push({ pathname: '/minifigs-by-theme', query })
  }
  function reset() {
    router.push({ pathname: '/minifigs-by-theme', query: { limit: '36', page: '1' } })
  }

  const headerCount = useMemo(() => props.total ?? 0, [props.total])

  return (
    <>
      <Head>
        <title>Minifigs by Theme ({headerCount})</title>
      </Head>

      <h1 style={{ margin: '18px 0 14px' }}>
        Minifigs by Theme <small style={{ fontWeight: 400, fontSize: 16 }}>({headerCount})</small>
      </h1>

      <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom: 12 }}>
        <label style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
          Theme:
          <select value={theme} onChange={(e)=>{ setTheme(e.target.value); setSeries('') }}>
            <option value="">All Minifigs</option>
            {props.themes.options
              .slice()
              .sort((a,b)=>a.label.localeCompare(b.label))
              .map(o => (
              <option key={o.key} value={o.key}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
        </label>

        {isCMF && (
          <label style={{ display:'inline-flex', gap:6, alignItems:'center' }}>
            Series:
            <select value={series} onChange={(e)=> setSeries(e.target.value)}>
              <option value="">All</option>
              {cmfSeries
                .slice()
                .sort((a,b)=>a.label.localeCompare(b.label))
                .map(s=>(
                <option key={s.key} value={s.key}>
                  {s.label} ({s.count})
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display:'inline-flex', gap:6, alignItems:'center', marginLeft: 'auto' }}>
          Per page:
          <select value={limit} onChange={(e)=> setLimit(Number(e.target.value))}>
            {[12,24,36,48,72].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <input type="checkbox" checked={inStock} onChange={(e)=> setInStock(e.target.checked)} />
          Only in stock
        </label>

        <button onClick={apply}>Apply</button>
        <button onClick={reset} style={{ marginLeft: 4 }}>Reset</button>

        <Link href="/minifigs" style={{ marginLeft: 8 }}>All Minifigs</Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))',
          gap: 14
        }}
      >
        {props.items.map((p) => (
          <div key={(p._id || p.inventoryId || p.itemNo) as any}
               style={{ background: '#fff', borderRadius: 10, border: '1px solid #e3ddd1' }}>
            <div style={{ padding: 14 }}>
              <div style={{
                position: 'relative',
                width: '100%', aspectRatio: '1 / 1',
                background: '#f7f5f0', borderRadius: 8, overflow: 'hidden'
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
                  <div style={{ display:'grid', placeItems:'center', height:'100%', color:'#98a' }}>
                    No image
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, minHeight: 46, fontSize: 14, lineHeight: 1.3 }}>
                {p.name || p.itemNo}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 8 }}>
                <span style={{ fontWeight: 700 }}>
                  {typeof p.price === 'number' ? `$${p.price.toFixed(2)}` : '$0.00'}
                </span>
                <Link href={`/minifig/${p._id ?? p.inventoryId ?? p.itemNo}`} title="Details">Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export async function getServerSideProps(ctx: any) {
  const { query } = ctx
  const page = Math.max(1, parseInt(String(query.page || '1'), 10))
  const limit = Math.min(72, Math.max(6, parseInt(String(query.limit || '36'), 10)))
  const theme = String(query.theme || '')
  const series = String(query.series || '')
  const inStock = String(query.inStock || '') === '1'

  const params = new URLSearchParams({
    type: 'MINIFIG',
    page: String(page),
    limit: String(limit),
  })
  if (theme) params.set('theme', theme)
  if (series) params.set('series', series)
  if (inStock) params.set('inStock', '1')

  const base = SITE
  const [themesRes, prodsRes] = await Promise.all([
    fetch(`${base}/api/themes?includeSeries=1`),
    fetch(`${base}/api/products?${params.toString()}`),
  ])

  const themes = await themesRes.json()
  const data = await prodsRes.json()

  return {
    props: {
      items: data.items ?? [],
      total: data.total ?? 0,
      page, limit, theme, series, inStock,
      themes: themes as ThemesResp,
    }
  }
}