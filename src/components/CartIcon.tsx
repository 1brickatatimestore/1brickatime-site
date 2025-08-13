import Link from 'next/link'
import { memo } from 'react'

type Props = {
  count: number
}

function CartIconBase({ count }: Props) {
  const show = Number(count) > 0

  return (
    <Link href="/checkout" className="cart" aria-label={`Cart${show ? `, ${count} items` : ''}`}>
      {/* Pixel-aligned, crisp SVG */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="icon"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path vectorEffect="non-scaling-stroke" d="M3 3h2l2.2 10.4A2 2 0 0 0 9.16 15h7.84a2 2 0 0 0 1.95-1.56l1.67-7.44H6.16" />
          <circle vectorEffect="non-scaling-stroke" cx="10.5" cy="19.5" r="1.5" />
          <circle vectorEffect="non-scaling-stroke" cx="17.5" cy="19.5" r="1.5" />
        </g>
      </svg>

      {show && (
        <span className="badge" aria-live="polite" aria-atomic="true">
          {count}
        </span>
      )}

      <style jsx>{`
        .cart {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          color: #143a52;
          transition: background .15s ease, transform .05s ease;
          outline: none;
        }
        .cart:hover { background: rgba(20, 58, 82, .08); }
        .cart:active { transform: translateY(1px); }

        .icon {
          display: block;
          color: #143a52;
          /* ensure crisp lines */
          shape-rendering: geometricPrecision;
        }

        .badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #e63946; /* vivid red */
          color: #fff;
          font-weight: 800;
          font-size: 12px;
          line-height: 20px;
          text-align: center;
          box-shadow: 0 0 0 2px #0f2f42; /* rim against header */
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0); /* avoid blur on some GPUs */
        }
      `}</style>
    </Link>
  )
}

export default memo(CartIconBase)