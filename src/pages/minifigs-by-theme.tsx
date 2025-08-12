import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef } from 'react'
import { useCart } from '@/context/CartContext'

type ThemeOpt = { key: string; label: string; count: number }
type Item = {
  _id?: string
  inventoryId?: number
  name?: string
  itemNo?: string
  price?: number
  condition?: string
  imageUrl?: string
}

type Props = {
  options: ThemeOpt[]
  selectedKey: string
  selectedLabel: string
  items: Item[]
  count: number
  page: number
  limit: number
}

export default function MinifigsByThemePage({
  options, selectedKey, selectedLabel, items, count, page, limit,
}: Props) {
  const router = useRouter()
  const { add } = useCart()
  const selectRef = useRef<HTMLSelectElement>(null)

  const pages = Math.max(1, Math.ceil(count / Math.max(1, limit)))
  const sorted = useMemo(() => [...options].sort((a, b) => a.label.localeCompare(b.label)), [options])

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    params.set('theme', selectedKey)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    return `/minifigs-by-theme?${params.toString()}`
  }

  useEffect(() => { if (!selectedKey && selectRef.current) selectRef.current.focus() }, [selectedKey])

  return (
    <>
      <Head>
        <title>{`Minifigs by Theme — 1 Brick at a Time`}</title>
      </Head>

      <main className="wrap">
        <form
          className="filters"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const key = (fd.get('theme') as string) || ''
            const params = new URLSearchParams()
            if (key) params.set('theme', key)
            params.set('limit', String(limit))
            params.set('page', '1')
            router.push(`/minifigs-by-theme?${params.toString()}`)
          }}
        >
          <label className="lbl">
            Theme
            <select
              ref={selectRef}
              name="theme"
              defaultValue={selectedKey}
              className="select"
              onChange={(e) => {
                const key = e.target.value
                const params = new URLSearchParams()
                if (key) params.set('theme', key)
                params.set('limit', String(limit))
                params.set('page', '1')
                router.push(`/minifigs-by-theme?${params.toString()}`)
              }}
            >
              <option value="">— Select a theme —</option>
              {sorted.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.count})
                </option>
              ))}
            </select>
          </label>

          {selectedKey && (
            <>
              <span className="meta">{selectedLabel || 'Selected'} — {count} items</span>
              <Link className="btnGhost" href="/minifigs-by-theme">Clear</Link>
            </>
          )}
        </form>

        {selectedKey ? (
          items.length ? (
            <>
              <div className="grid">
                {items.map((p) => (
                  <article key={p.inventoryId ?? p._id} className="card">
                    <div className="imgBox">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name || p.itemNo || 'Minifig'}
                          fill
                          sizes="(max-width: 900px) 50vw, 240px"
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="noImg">No image</div>
                      )}
                    </div>

                    <h3 className="name" title={p.name}>{p.name || p.itemNo || 'Minifig'}</h3>

                    <div className="priceRow">
                      <span className="price">
                        ${Number(p.price ?? 0).toFixed(2)} {p.condition ? `• ${p.condition}` : ''}
                      </span>

                      <button
                        className="addBtn"
                        onClick={() =>
                          add({
                            id: p.inventoryId ? String(p.inventoryId) : (p._id as string),
                            name: p.name ?? p.itemNo ?? 'Minifig',
                            price: Number(p.price ?? 0),
                            qty: 1,
                            imageUrl: p.imageUrl,
                          })
                        }
                      >
                        Add to cart
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {pages > 1 && (
                <nav className="pager" aria-label="Pagination">
                  <Link className="pbtn" href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
                    ← Prev
                  </Link>
                  <span className="pmeta">Page {page} / {pages}</span>
                  <Link className="pbtn" href={buildHref(Math.min(pages, page + 1))} aria-disabled={page >= pages}>
                    Next →
                  </Link>
                </nav>
              )}
            </>
          ) : (
            <p className="empty">No items found for this theme.</p>
          )
        ) : (
          <p className="empty">Pick a theme from the dropdown to start.</p>
        )}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; max-width:1200px; }
        .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:6px 0 14px; }
        .lbl { display:flex; gap:8px; align-items:center; font-weight:700; color:#1f1f1f; }
        .select { padding:8px 10px; border-radius:8px; border:1px solid #bdb7ae; background:#fff; min-width:260px; }
        .btnGhost { border:2px solid #204d69; color:#204d69; padding:8px 14px; border-radius:8px; font-weight:600; }
        .meta { margin-left:auto; font-size:13px; color:#333; }
        .empty { color:#333; font-size:15px; padding:8px 2px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:16px; }
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; }
        .pager { display:flex; gap:12px; align-items:center; justify-content:center; margin:18px 0 6px; }
        .pbtn { border:2px solid #204d69; color:#204d69; padding:6px 12px; border-radius:8px; font-weight:700; }
        .pmeta { color:#333; font-weight:600; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:14px 16px 110px; } }
      `}</style>
    </>
  )
}

export async function getServerSideProps(ctx: any) {
  const { req, query } = ctx
  const host = req?.headers?.host || 'localhost:3000'
  const proto = (req?.headers?.['x-forwarded-proto'] as string) || 'http'

  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.max(1, Math.min(72, Number(query.limit ?? 36)))
  const selectedKey = typeof query.theme === 'string' ? query.theme : ''

  // Themes
  const themesRes = await fetch(`${proto}://${host}/api/themes`)
  const tj = themesRes.ok ? await themesRes.json() : {}
  const options: ThemeOpt[] = Array.isArray(tj?.options)
    ? tj.options
    : Array.isArray(tj?.themes)
    ? tj.themes.map((t: any) => ({ key: t.code, label: t.label, count: t.count }))
    : []
  const selectedLabel = options.find(o => o.key === selectedKey)?.label || (selectedKey || '')

  // Items for a selected theme
  let items: Item[] = []
  let count = 0
  if (selectedKey) {
    const params = new URLSearchParams()
    params.set('type', 'MINIFIG')
    params.set('theme', selectedKey)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await fetch(`${proto}://${host}/api/products?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      const arr =
        (Array.isArray(data.inventory) && data.inventory) ||
        (Array.isArray(data.items) && data.items) ||
        (Array.isArray(data.results) && data.results) ||
        []
      items = arr
      count = Number(data.count ?? arr.length ?? 0)
    }
  }

  return { props: { options, selectedKey, selectedLabel, items, count, page, limit } }
}