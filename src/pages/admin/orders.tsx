import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

type OrderItem = {
  id?: string
  inventoryId?: number
  productId?: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type OrderRow = {
  _id: string
  orderId?: string
  captureId?: string
  status?: string
  currency?: string
  totals?: { items?: number; shipping?: number; total?: number }
  payer?: { name?: string; email?: string }
  items: OrderItem[]
  createdAt?: string
}

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [limit, setLimit] = useState(25)
  const [queryId, setQueryId] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(`/api/checkout/orders-list?limit=${limit}`)
      if (!r.ok) throw new Error(`orders-list ${r.status}`)
      const data = await r.json()
      setRows(Array.isArray(data) ? data : [])
    } catch (e:any) {
      setErr(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [limit])

  const onRefund = async (captureId?: string, orderId?: string) => {
    if (!captureId && !orderId) { setErr('Need captureId or orderId'); return }
    setBusyId(captureId || orderId || null)
    setNote(null)
    try {
      const p = new URLSearchParams()
      if (captureId) p.set('captureId', captureId)
      if (orderId) p.set('orderId', orderId)
      const r = await fetch(`/api/checkout/refund-and-restock?${p.toString()}`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok || j.error) throw new Error(j.error || `Refund failed (${r.status})`)
      setNote(`✔ Refunded ${j.refund?.amount?.value ?? ''} ${j.refund?.amount?.currency_code ?? ''} • Restocked ${j.restockedCount} items`)
      await load()
    } catch (e:any) {
      setErr(e.message || 'Refund failed')
    } finally {
      setBusyId(null)
    }
  }

  const onSendEmail = async (orderId?: string) => {
    if (!orderId) { setErr('No orderId'); return }
    setBusyId(orderId)
    setNote(null)
    try {
      const r = await fetch(`/api/checkout/send-confirmation?orderId=${encodeURIComponent(orderId)}`, { method:'POST' })
      const j = await r.json()
      if (!r.ok || j.error) throw new Error(j.error || `Email failed (${r.status})`)
      setNote('✔ Sales email queued/sent')
    } catch (e:any) {
      setErr(e.message || 'Email failed')
    } finally {
      setBusyId(null)
    }
  }

  const hasRows = useMemo(() => Array.isArray(rows) && rows.length > 0, [rows])

  return (
    <>
      <Head><title>{`Admin — Orders`}</title></Head>
      <main className="wrap">
        <h1>Admin · Orders</h1>

        <div className="bar">
          <label>Show
            <select value={limit} onChange={e=>setLimit(Number(e.target.value))}>
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>

          <div className="refBox">
            <input
              value={queryId}
              onChange={e=>setQueryId(e.target.value)}
              placeholder="Paste captureId or orderId…"
            />
            <button
              onClick={() => onRefund(
                queryId.startsWith('0') || queryId.length > 20 ? undefined : queryId,
                (queryId.startsWith('0') || queryId.length > 20) ? queryId : undefined
              )}
              disabled={!queryId || !!busyId}
            >
              Refund + Restock
            </button>
          </div>

          <button onClick={load} disabled={loading}>Reload</button>
        </div>

        {err && <p className="err">⚠ {err}</p>}
        {note && <p className="ok">{note}</p>}

        {!loading && !hasRows && (
          <div className="empty">
            <p>No saved orders yet.</p>
            <p className="hint">After a PayPal capture, your capture endpoint should save an order doc to Mongo. This page reads from that collection.</p>
          </div>
        )}

        {hasRows && (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Order</th>
                <th>Capture</th>
                <th>Status</th>
                <th>Total</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows!.map(o => (
                <tr key={o._id}>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                  <td className="mono">{o.orderId || '—'}</td>
                  <td className="mono">{o.captureId || '—'}</td>
                  <td>{o.status || '—'}</td>
                  <td>{o.totals?.total ? `${o.totals.total.toFixed(2)} ${o.currency || ''}` : '—'}</td>
                  <td>{o.payer?.name || '—'}<br/><span className="muted">{o.payer?.email || ''}</span></td>
                  <td>
                    {o.items?.length ? (
                      <details>
                        <summary>{o.items.length} item(s)</summary>
                        <ul>
                          {o.items.map((it, i) => (
                            <li key={i}>
                              {it.name} ×{it.qty} — ${it.price?.toFixed?.(2) ?? it.price}
                              {it.inventoryId ? <span className="muted"> · inv #{it.inventoryId}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={()=>onRefund(o.captureId, o.orderId)}
                        disabled={!!busyId}
                        title="Refund on PayPal and add items back to stock"
                      >
                        Refund + Restock
                      </button>
                      <button
                        onClick={()=>onSendEmail(o.orderId)}
                        disabled={!!busyId}
                        title="Send sales summary email"
                      >
                        Send Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 120px; }
        h1 { margin: 6px 0 14px; }
        .bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
        .refBox { display:flex; gap:8px; }
        .refBox input { padding:8px 10px; border:1px solid #bbb; border-radius:8px; min-width:320px; }
        button { padding:8px 12px; border-radius:8px; border:2px solid #204d69; background:#e7f1f7; font-weight:700; }
        .err { color:#8b0000; font-weight:700; }
        .ok { color:#126312; font-weight:700; }
        .table { width:100%; border-collapse: collapse; margin-top:14px; }
        th, td { border-bottom:1px solid #eee; padding:8px; vertical-align: top; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
        .muted { color:#666; font-size:12px; }
        .actions { display:flex; gap:8px; }
        .empty .hint { color:#555; font-size:13px; }
        @media (max-width:900px){ .wrap{ margin-left:64px; padding:14px 16px 110px; } .table{ font-size:14px; } }
      `}</style>
    </>
  )
}