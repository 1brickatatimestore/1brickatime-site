import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'

export type MinifigItem = {
  _id?: string
  inventoryId?: number
  name?: string
  itemNo?: string
  price?: number
  condition?: string
  imageUrl?: string
  qty?: number
}

type Props = { item: MinifigItem }

export default function MinifigTile({ item }: Props) {
  const { add, getQty } = useCart()
  const id = item.inventoryId ? String(item.inventoryId) : (item._id as string)
  const stock = Math.max(0, Number(item.qty ?? 0))
  const inCart = getQty(id)
  const disabled = stock <= 0 || inCart >= stock

  return (
    <article className="card">
      <Link href={`/minifig/${id}`} className="imgLink" title={item.name || item.itemNo || 'Minifig'}>
        <div className="imgBox">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name || item.itemNo || 'Minifig'}
              fill
              sizes="(max-width: 900px) 50vw, 240px"
              // We set style below, but CSS forces it globally too (see :global override)
              style={{ objectFit: 'contain' }}
              priority={false}
            />
          ) : (
            <div className="noImg">No image</div>
          )}
        </div>
      </Link>

      <h3 className="name" title={item.name}>
        <Link href={`/minifig/${id}`}>{item.name || item.itemNo || 'Minifig'}</Link>
      </h3>

      <div className="priceRow">
        <span className="price">
          ${Number(item.price ?? 0).toFixed(2)} {item.condition ? `• ${item.condition}` : ''}
        </span>
        <button
          className="addBtn"
          disabled={disabled}
          onClick={() =>
            add({
              id,
              name: item.name ?? item.itemNo ?? 'Minifig',
              price: Number(item.price ?? 0),
              qty: 1,
              imageUrl: item.imageUrl,
              stock,
            })
          }
        >
          {disabled ? 'Sold out' : 'Add to cart'}
        </button>
      </div>

      <style jsx>{`
        .card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:10px; display:flex; flex-direction:column; gap:8px; }
        .imgLink { display:block; cursor:pointer; }
        .imgBox { position:relative; width:100%; padding-top:100%; background:#f7f5f2; border-radius:10px; overflow:hidden; }
        .noImg { position:absolute; inset:0; display:grid; place-items:center; color:#666; font-size:14px; }
        .name { font-size:14px; margin:0 0 6px; min-height:34px; color:#1e1e1e; }
        .name :global(a){ color:inherit; text-decoration:none; }
        .name :global(a:hover){ text-decoration:underline; }

        .priceRow { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
        .price { font-weight:700; color:#2a2a2a; }
        .addBtn { background:#e1b946; border:2px solid #a2801a; color:#1a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; cursor:pointer; }
        .addBtn[disabled] { opacity:.6; cursor:not-allowed; }
      `}</style>

      {/* CRUSH any legacy global CSS that was forcing cover/stretch */}
      <style jsx global>{`
        .imgBox img {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          inset: 0 !important;
          position: absolute !important;
        }
      `}</style>
    </article>
  )
}