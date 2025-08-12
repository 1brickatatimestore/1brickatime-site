// src/pages/minifigs-by-theme.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Bucket = { slug: string; title: string; count: number }
type ThemesPayload = {
  ok: boolean
  totals: { all: number; mainThemes: number; collectibles: number; otherSingles: number }
  mainThemes: Bucket[]
  collectibles: Bucket[]
  otherSingles: number
}

type Item = {
  _id?: string
  inventoryId?: number
  itemNo: string
  name: string
  price?: number
  qty?: number
  imageUrl?: string
}

export default function MinifigsByThemePage() {
  const [themes, setThemes] = useState<ThemesPayload | null>(null)
  const [sel, setSel] = useState<string>('') // value in <select>
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(36)
  const [loading, setLoading] = useState(false)

  // Load theme buckets
  useEffect(() => {
    ;(async () => {
      const resp = await fetch('/api/themes')
      const data: ThemesPayload = await resp.json()
      setThemes(data)
    })()
  }, [])

  // Fetch items when selection changes
  useEffect(() => {
    if (!themes) return
    setLoading(true)
    ;(async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('inStockOnly', '0')

      // selection value encoding:
      //  - "all" => show everything
      //  - "other-singles" => the singleton bucket
      //  - "theme:slug" => a main theme
      //  - "series:cmf-col21" => a CMF series
      if (sel === 'all') {
        // nothing extra
      } else if (sel === 'other-singles') {
        params.set('theme', 'other-singles')
      } else if (sel.startsWith('theme:')) {
        params.set('theme', sel.replace(/^theme:/, ''))
      } else if (sel.startsWith('series:')) {
        params.set('series', sel.replace(/^series:/, ''))
      }

      const r = await fetch(`/api/minifigs?${params.toString()}`)
      const data = await r.json()
      setItems(data.items || [])
      setLoading(false)
    })()
  }, [sel, page, limit, themes])

  const title = useMemo(() => {
    if (!themes) return 'Minifigs by Theme'
    if (sel === 'all' || !sel) return 'All Minifigs'
    if (sel === 'other-singles') return 'Other (Singles)'
    const bucketFinder = (arr: Bucket[], slug: string) => arr.find(b => b.slug === slug)?.title
    if (sel.startsWith('theme:')) {
      const slug = sel.replace(/^theme:/, '')
      return bucketFinder(themes.mainThemes, slug) || 'Minifigs by Theme'
    }
    if (sel.startsWith('series:')) {
      const slug = sel.replace(/^series:/, '')
      return themes.collectibles.find(b => `cmf-${slug}` === b.slug)?.title || 'Collectible Minifigures'
    }
    return 'Minifigs by Theme'
  }, [sel, themes])

  return (
    <>
      <Head><title>Minifigs by Theme</title></Head>
      <main className="wrap">
        <div className="top">
          <h1>Minifigs by Theme</h1>
          <Link href="/minifigs">All Minifigs</Link>
        </div>

        <div className="controls">
          <label htmlFor="themeSel">Theme: </label>
          <select
            id="themeSel"
            value={sel}
            onChange={(e) => { setSel(e.target.value); setPage(1) }}
          >
            <option value="all">All Minifigs</option>
            <option value="other-singles">
              Other (Singles) — {themes?.otherSingles ?? 0}
            </option>

            {themes && (
              <optgroup label="Main themes">
                {themes.mainThemes.map(b => (
                  <option key={b.slug} value={`theme:${b.slug}`}>
                    {b.title} — {b.count}
                  </option>
                ))}
              </optgroup>
            )}

            {themes && themes.collectibles.length > 0 && (
              <optgroup label="Collectible Minifigures">
                {themes.collectibles.map(b => (
                  <option key={b.slug} value={`series:${b.slug.replace(/^cmf-/, '')}`}>
                    {b.title} — {b.count}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <label htmlFor="perpage" style={{ marginLeft: 16 }}>Per page:</label>
          <select id="perpage" value={limit} onChange={e => setLimit(parseInt(e.target.value, 10))}>
            {[12,24,36,48,72,96].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <h2 style={{ marginTop: 12 }}>{title}</h2>

        {loading && <p>Loading…</p>}
        {!loading && items.length === 0 && <p>No items found.</p>}

        <div className="grid">
          {items.map(p => (
            <article key={p.inventoryId ?? p._id} className="card">
              <div className="imgBox">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={300}
                    height={300}
                    unoptimized
                  />
                ) : (
                  <div className="noimg">No image</div>
                )}
              </div>
              <div className="meta">
                <div className="name">{p.name}</div>
                <div className="sub">{p.itemNo}</div>
              </div>
            </article>
          ))}
        </div>

        <style jsx>{`
          .wrap { max-width: 1100px; margin: 0 auto; padding: 20px; }
          .top { display: flex; align-items: baseline; gap: 18px; }
          .controls { margin: 12px 0 8px; display: flex; align-items: center; gap: 8px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 14px;
          }
          @media (max-width: 1200px) {
            .grid { grid-template-columns: repeat(5, 1fr); }
          }
          @media (max-width: 980px) {
            .grid { grid-template-columns: repeat(4, 1fr); }
          }
          @media (max-width: 760px) {
            .grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (max-width: 560px) {
            .grid { grid-template-columns: repeat(2, 1fr); }
          }
          .card {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,.08);
            overflow: hidden;
          }
          .imgBox {
            background: #f8f8f8;
            display: grid; place-items: center;
            height: 170px;
          }
          .noimg { color: #888; font-size: 14px; }
          .meta { padding: 10px; }
          .name { font-weight: 600; font-size: 14px; line-height: 1.25; }
          .sub { color: #666; font-size: 12px; margin-top: 3px; }
        `}</style>
      </main>
    </>
  )
}