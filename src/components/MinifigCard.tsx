import React from 'react'

export type Minifig = {
  id: string | number
  name: string
  price?: number
  currency?: string
  condition?: string
  remarks?: string
  imageUrl?: string
  // keep extra fields harmlessly
  [key: string]: any
}

type Props = { item: Minifig }

export default function MinifigCard({ item }: Props) {
  const {
    id,
    name,
    price,
    currency = 'USD',
    condition,
    remarks,
    imageUrl,
  } = item

  return (
    <article className="mfCard" data-id={id}>
      <div className="mfThumb">
        {/* Use <img> to avoid Next image domain config issues */}
        <img
          src={imageUrl || '/file.svg'}
          alt={name}
          loading="lazy"
        />
      </div>

      <div className="mfBody">
        <h3 className="mfTitle" title={name}>{name}</h3>

        <div className="mfMeta">
          {condition && <span className="mfPill">{condition}</span>}
          {typeof price === 'number' && (
            <span className="mfPrice">
              {currency} {price.toFixed(2)}
            </span>
          )}
        </div>

        {remarks && (
          <p className="mfNotes" title={remarks}>
            {remarks.length > 90 ? remarks.slice(0, 87) + '…' : remarks}
          </p>
        )}
      </div>

      <style jsx>{`
        .mfCard {
          display: grid;
          grid-template-rows: 184px auto;
          background: #fff;
          border: 1px solid rgba(0,0,0,.08);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,.06);
        }
        .mfThumb {
          background: #f3f3f3;
          display: grid;
          place-items: center;
        }
        .mfThumb img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .mfBody { padding: 10px 12px 12px; }
        .mfTitle {
          margin: 0 0 6px;
          font-size: 16px;
          line-height: 1.2;
        }
        .mfMeta {
          display: flex; gap: 8px; align-items: center;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .mfPill {
          background: #ffe5e0;
          color: #b5463b;
          border: 1px solid #f2b6ad;
          padding: 2px 8px;
          border-radius: 999px;
        }
        .mfPrice {
          margin-left: auto;
          font-weight: 700;
          color: #204d69;
          background: #e7f1f6;
          border: 1px solid #c8dbe6;
          padding: 2px 8px;
          border-radius: 8px;
        }
        .mfNotes {
          margin: 8px 0 0;
          font-size: 13px;
          color: #333;
        }
      `}</style>
    </article>
  )
}