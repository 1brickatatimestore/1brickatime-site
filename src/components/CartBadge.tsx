import Link from 'next/link'
import { useCart } from '@/context/CartContext'

export default function CartBadge() {
  const { totalCount } = useCart()
  return (
    <Link href="/checkout" style={{
      position:'relative',
      padding:'6px 10px',
      border:'2px solid #ffd969',
      borderRadius:8,
      color:'#ffd969',
      fontWeight:700
    }}>
      Cart
      {totalCount > 0 && (
        <span style={{
          position:'absolute', top:-8, right:-8,
          minWidth:22, height:22, borderRadius:11,
          display:'grid', placeItems:'center',
          background:'#ffd969', color:'#1f5376',
          fontSize:12, fontWeight:800, padding:'0 6px'
        }}>
          {totalCount}
        </span>
      )}
    </Link>
  )
}