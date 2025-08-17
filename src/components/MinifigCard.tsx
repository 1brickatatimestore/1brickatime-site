// src/components/MinifigCard.tsx
import Link from 'next/link'

type P = {
  _id?: string
  itemNo?: string
  name?: string
  price?: number
  qty?: number
  imageUrl?: string | null
}

function imgFor(p: P): string {
  // If the DB already has a URL, use it.
  if (p.imageUrl && p.imageUrl.trim()) return p.imageUrl.trim()
  // Fallback for minifigs: BrickLink’s standard image path.
  // Example: https://img.bricklink.com/ItemImage/MN/0/sw0257a.png
  const code = (p.itemNo || '').trim()
  if (!code) return '/no-image.png' // absolute last resort (never used if code exists)
  return `https://img.bricklink.com/ItemImage/MN/0/${code}.png`
}

export default function MinifigCard({ p }: { p: P }) {
  const href = `/minifig/${p.itemNo || p._id}`
  const img = imgFor(p)

  return (
    <div className="card">
      <Link href={href} className="imgLink" aria-label={p.name || p.itemNo || 'Minifig'}>
        {/* using <img> keeps it simple and fast here */}
        <img src={img} alt={p.name || p.itemNo || 'Minifig'} width={360} height={360} />
      </Link>

      <div className="cardBody">
        <h3>
          <Link href={href}>{p.name || p.itemNo || 'Minifig'}</Link>
        </h3>

        <div className="meta">
          {typeof p.price === 'number' ? (
            <span className="price">
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(p.price)}
            </span>
          ) : <span className="price">—</span>}

          {typeof p.qty === 'number' && p.qty > 0 ? (
            <span className="stock ok">{p.qty} in stock</span>
          ) : (
            <span className="stock out">Sold out</span>
          )}
        </div>

        <button className="btn" type="button">Add to cart</button>
      </div>

      <style jsx>{`
        .card { background:#fff; border-radius:12px; padding:12px; box-shadow:0 1px 4px rgba(0,0,0,.06); }
        .imgLink { display:block; border-radius:10px; background:#f4f4f4; overflow:hidden; text-align:center; }
        .imgLink img { width:100%; height:auto; display:block; }
        .cardBody { padding:10px 4px 2px; }
        h3 { margin:0 0 6px; font-size:15px; line-height:1.25; }
        .meta { display:flex; gap:10px; align-items:center; margin:6px 0 10px; }
        .price { font-weight:700; }
        .stock.ok { color:#1a7f37; }
        .stock.out { color:#8a8a8a; }
        .btn { background:#e1b946; border:2px solid #a2801a; padding:8px 12px; border-radius:8px; font-weight:700; }
      `}</style>
    </div>
  )
}