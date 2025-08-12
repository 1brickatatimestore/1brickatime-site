import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Opt = { key: string; label: string; count: number }
type Item = { _id?: string; inventoryId?: number; itemNo?: string; name?: string; price?: number; condition?: string; imageUrl?: string }
type Props = { options: Opt[]; selected?: string | null; items: Item[]; count: number; page: number; limit: number }

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, query }) => {
  const base =
    process. PAYPAL_CLIENT_SECRET_REDACTED||
    `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`

  const optionsRes = await fetch(`${base}/api/themes`, { headers: { accept: 'application/json' } })
  const optionsJson = await optionsRes.json()
  const options: Opt[] = optionsJson.options || []

  const selected = typeof query.theme === 'string' ? query.theme : ''
  const page = Number(query.page || 1)
  const limit = Number(query.limit || 36)

  let items: Item[] = []
  let count = 0

  if (selected) {
    const params = new URLSearchParams({ type: 'MINIFIG', theme: selected, page: String(page), limit: String(limit) })
    const itemsRes = await fetch(`${base}/api/products?${params.toString()}`, { headers: { accept: 'application/json' } })
    const itemsJson = await itemsRes.json()
    items = itemsJson.items || []
    count = itemsJson.count || 0
  }

  return { props: { options, selected: selected || null, items, count, page, limit } }
}

export default function Page({ options, selected, items, count, page, limit }: Props) {
  return (
    <>
      <Head>
        <title>Minifigs by Theme{selected ? ` — ${selected}` : ''}</title>
      </Head>

      <main style={{ marginLeft: 'var(--rail-w, 64px)', padding: 24 }}>
        <form method="get" action="/minifigs-by-theme" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontSize: 14 }}>Theme</label>
          <select
            name="theme"
            defaultValue={selected || ''}
            onChange={e => (window.location.href = `/minifigs-by-theme?theme=${encodeURIComponent(e.target.value)}&limit=${limit}`)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #b9c6cf', minWidth: 260 }}
          >
            <option value="">— Select a theme —</option>
            {options.map(o => (
              <option key={o.key} value={o.key}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
          {selected && <span style={{ fontSize: 13, color: '#333' }}>{count} items</span>}
        </form>

        {!selected && (
          <p style={{ color: '#333' }}>Pick a theme from the dropdown to see items.</p>
        )}

        {selected && items.length === 0 && <p>No items found for this theme.</p>}

        {selected && items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {items.map(p => {
              const key = p.inventoryId ? String(p.inventoryId) : (p._id as string)
              return (
                <article key={key} style={{ background: '#fff', borderRadius: 12, padding: 10, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f6f6f6', borderRadius: 8, overflow: 'hidden' }}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name || p.itemNo || 'Minifig'}
                        fill
                        sizes="(max-width: 900px) 50vw, 240px"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#888' }}>No image</div>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name || p.itemNo}</div>
                    <div style={{ fontSize: 13, color: '#2a2a2a' }}>
                      {p.itemNo} · {(p.condition || 'U').toUpperCase()} · ${Number(p.price || 0).toFixed(2)}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}