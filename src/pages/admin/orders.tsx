import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

type Line = { name?: string; qty?: number; price?: number; id?: string }
type OrderLite = {
  orderId?: string
  captureId?: string
  email?: string
  name?: string
  total?: number
  currency?: string
  status?: string
  createdAt?: string
  items?: Line[]
  raw?: any
}

type Props = { authed: boolean }

export default function AdminOrdersPage({ authed }: Props) {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string>('')

  useEffect(() => {
    if (!authed) return
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch('/api/checkout/orders-list?limit=100')
        const data = await r.json()
        if (!Array.isArray(data)) throw new Error('Unexpected response')
        setOrders(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [authed])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return orders
    return orders.filter(o =>
      [o.orderId, o.captureId, o.email, o.name, o.status]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(s))
    )
  }, [orders, q])

  async function doRefundAndRestock(o: OrderLite) {
    const id = o.captureId || o.orderId
    if (!id) return alert('No captureId/orderId available for this order.')
    if (!confirm('Refund on PayPal and restock items?')) return
    setBusyId(o.orderId || o.captureId || 'busy')
    try {
      const u = o.captureId
        ? `/api/checkout/refund-and-restock?captureId=${encodeURIComponent(o.captureId!)}`
        : `/api/checkout/refund-and-restock?orderId=${encodeURIComponent(o.orderId!)}`
      const r = await fetch(u, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.message || 'Refund failed')
      alert('Refund + restock succeeded.')
    } catch (e: any) {
      alert(`Refund failed: ${e?.message || e}`)
    } finally {
      setBusyId('')
    }
  }

  async function doResendEmail(o: OrderLite) {
    if (!o.orderId) return alert('No orderId found.')
    setBusyId(o.orderId)
    try {
      const r = await fetch(`/api/checkout/send-confirmation?orderId=${encodeURIComponent(o.orderId)}`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.message || 'Email failed')
      alert('Email sent.')
    } catch (e: any) {
      alert(`Email failed: ${e?.message || e}`)
    } finally {
      setBusyId('')
    }
  }

  function exportCSV() {
    const rows = [
      ['date','orderId','captureId','email','name','total','currency','status','items']
    ]
    for (const o of filtered) {
      const items = (o.items || []).map(i => `${i.qty} x ${i.name} @ ${i.price}`).join(' | ')
      rows.push([
        o.createdAt || '',
        o.orderId || '',
        o.captureId || '',
        o.email || '',
        o.name || '',
        String(o.total ?? ''),
        o.currency || '',
        o.status || '',
        items
      ])
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <>
        <Head><title>Admin — Sign in</title><meta name="robots" content="noindex" /></Head>
        <main className="adminWrap">
          <div className="box">
            <h1>Admin access required</h1>
            <p>Set <code>ADMIN_TOKEN</code> in <code>.env.local</code>, then visit:</p>
            <pre>/admin/orders?key=YOUR_ADMIN_TOKEN</pre>
          </div>
        </main>
        <style jsx>{`
          .adminWrap{min-height:70vh;display:grid;place-items:center;padding:24px}
          .box{background:#fff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.08);padding:24px;max-width:720px}
          pre{background:#f6f6f6;padding:8px 10px;border-radius:8px;overflow:auto}
        `}</style>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`Admin Orders — 1 Brick at a Time`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="wrap">
        <header className="head">
          <h1>Orders</h1>
          <div className="actions">
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Search email / order / capture…"
              className="search"
            />
            <button className="btnGhost" onClick={exportCSV}>Export CSV</button>
          </div>
        </header>

        {loading && <p>Loading…</p>}
        {error && <p className="err">Error: {error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p>No orders yet.</p>
        )}

        <ul className="list">
          {filtered.map(o => (
            <li key={(o.orderId||'')+(o.captureId||'')} className="row">
              <div className="col main">
                <div className="line1">
                  <strong>{o.name || 'Customer'}</strong>
                  <span className="muted"> • {o.email || '—'}</span>
                </div>
                <div className="line2">
                  <code>{o.orderId || 'orderId:—'}</code>
                  {o.captureId ? <code className="chip">cap:{o.captureId}</code> : null}
                  <span className="muted"> • {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</span>
                  <span className="muted"> • {o.status || 'paid'}</span>
                </div>
                <div className="line3">
                  {(o.items||[]).slice(0,4).map((it, i)=>(
                    <span key={i} className="pill">{it.qty}× {it.name}</span>
                  ))}
                  {(o.items||[]).length > 4 && <span className="pill">+{(o.items||[]).length-4} more</span>}
                </div>
              </div>

              <div className="col right">
                <div className="total">{o.currency || ''} {typeof o.total==='number' ? o.total.toFixed(2) : '—'}</div>
                <div className="btns">
                  <button
                    disabled={!!busyId}
                    className="btnGhost"
                    onClick={()=>doResendEmail(o)}
                  >
                    {busyId===(o.orderId||'') ? 'Sending…' : 'Resend Email'}
                  </button>
                  <button
                    disabled={!!busyId}
                    className="btnDanger"
                    onClick={()=>doRefundAndRestock(o)}
                  >
                    {busyId && (busyId===o.orderId || busyId===o.captureId) ? 'Processing…' : 'Refund + Restock'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <style jsx>{`
        .wrap{ max-width:1100px; margin:18px auto 80px; padding:0 16px; }
        .head{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .head h1{ margin:0; }
        .actions{ margin-left:auto; display:flex; gap:8px; }
        .search{ padding:8px 10px; border:1px solid #cfc9be; border-radius:8px; min-width:280px; }
        .btnGhost{ border:2px solid #204d69; color:#204d69; padding:8px 12px; border-radius:8px; font-weight:700; background:#fff; }
        .btnDanger{ border:2px solid #8a1a1a; color:#8a1a1a; padding:8px 12px; border-radius:8px; font-weight:800; background:#fff; }
        .list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
        .row{ display:flex; gap:12px; justify-content:space-between; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.08); padding:12px; }
        .col.main{ min-width:0; }
        .line1{ font-size:16px; }
        .line2{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; color:#444; font-size:13px; }
        .line3{ display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
        .muted{ color:#666; }
        code{ background:#f6f6f6; padding:2px 6px; border-radius:6px; }
        .chip{ background:#eef7ff; border:1px solid #b9d6f5; }
        .pill{ background:#f0efe9; padding:4px 8px; border-radius:999px; font-size:12px; }
        .col.right{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width:240px; }
        .total{ font-weight:900; font-size:18px; }
        .btns{ display:flex; gap:8px; }
        .err{ color:#8a1a1a; }
        @media (max-width:800px){
          .col.right{ align-items:flex-start; }
          .row{ flex-direction:column; }
          .actions{ width:100%; justify-content:flex-end; }
        }
      `}</style>
    </>
  )
}

// --- Minimal server-side guard (optional): set ADMIN_TOKEN in .env.local ---
export async function getServerSideProps(ctx: any) {
  const token = process.env.ADMIN_TOKEN || ''
  if (!token) {
    return { props: { authed: true } } // unlocked if no token set
  }
  const { req, res, query } = ctx
  const cookie = req.cookies?.admin || ''
  if (cookie === token) return { props: { authed: true } }
  if (query?.key === token) {
    res.setHeader('Set-Cookie', `admin=${token}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`)
    return { redirect: { destination: '/admin/orders', permanent: false } }
  }
  return { props: { authed: false } }
}