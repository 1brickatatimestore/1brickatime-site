// src/components/MinifigCard.tsx
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export type MinifigUi = {
  id: string;
  itemNo: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  condition?: string; // "New" | "Used"
  remarks?: string;
};

export default function MinifigCard({ item }: { item: MinifigUi }) {
  const { add, getQty } = useCart();
  const inCart = getQty(item.id || item.itemNo);
  const left = Math.max(0, (item.stock || 0) - inCart);
  const disabled = left <= 0;

  return (
    <article className="card">
      <Link href={`/minifig/${encodeURIComponent(item.itemNo)}`} className="imgWrap">
        {item.imageUrl ? (
          // Use plain <img> to avoid Next/Image config and keep it crisp
          <img
            src={item.imageUrl}
            alt=""
            className="img"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="noimg">No image</div>
        )}
      </Link>

      <div className="meta">
        <Link href={`/minifig/${encodeURIComponent(item.itemNo)}`} className="name">
          {item.name || item.itemNo}
        </Link>

        <div className="sub">
          <span className="price">
            {Number.isFinite(item.price) ? `$${item.price.toFixed(2)}` : "—"}
          </span>
          <span className={`stock ${left > 0 ? "ok" : "out"}`}>
            {left > 0 ? `${left} left` : "Sold out"}
          </span>
        </div>

        {/* Optional condition + remarks from BrickLink */}
        {(item.condition || item.remarks) && (
          <div className="extra">
            {item.condition && <span className="pill">{item.condition}</span>}
            {item.remarks && <span className="remarks" title={item.remarks}>{item.remarks}</span>}
          </div>
        )}

        <button
          className="addBtn"
          disabled={disabled}
          onClick={() =>
            add({
              id: item.id || item.itemNo,
              name: item.name || item.itemNo || "Minifig",
              price: Number(item.price ?? 0),
              qty: 1,
              imageUrl: item.imageUrl,
            })
          }
        >
          {disabled ? "Sold out" : "Add to cart"}
        </button>
      </div>

      <style jsx>{`
        .card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr;
        }
        .imgWrap {
          display: block;
          background: #f6f6f6;
          height: 180px;
          overflow: hidden;
        }
        .img {
          width: 100%;
          height: 180px;
          object-fit: contain;
          image-rendering: auto; /* crisp without pixelation */
        }
        .noimg {
          height: 180px;
          display: grid;
          place-items: center;
          color: #999;
          font-size: 12px;
        }
        .meta {
          padding: 10px;
          display: grid;
          gap: 6px;
        }
        .name {
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-decoration: none;
          color: #222;
        }
        .sub {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
          font-size: 14px;
        }
        .price {
          font-weight: 700;
        }
        .stock.ok {
          color: #1a7f37;
          font-weight: 600;
        }
        .stock.out {
          color: #a40000;
          font-weight: 600;
        }
        .extra {
          display: flex;
          gap: 8px;
          align-items: center;
          min-height: 18px;
        }
        .pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid #ddd;
          font-size: 12px;
          color: #333;
          background: #fafafa;
        }
        .remarks {
          font-size: 12px;
          color: #555;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .addBtn {
          height: 36px;
          border-radius: 10px;
          border: 1px solid #c9c9c9;
          background: #f6f6f6;
          font-weight: 600;
        }
        .addBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </article>
  );
}