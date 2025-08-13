// src/pages/admin/orders.tsx
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'

type OrderRow = {
  _id: string
  provider: string
  orderId?: string
  captureIds?: string[]
  status: string
  payerEmail?: string
  grandTotal?: number
  currency?: string
  itemsCount: number
  createdAt: string
}

export default function AdminOrdersPage() {
  const [adminKey, setAdminKey] = useState<string>('')
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const hasKey = useMemo(() => (adminKey || '').trim().length > 0, [adminKey])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const r = await fetch('/api/checkout/orders-list?limit=50&compact=1')
      const j = await r.json()
      setRows(Array.isArray(j) ? j : [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const doRefund = async (row: OrderRow, captureId?: string) => {
    if (!hasKey) {
      alert('Enter ADMIN key first.')
      return
    }
    const cid = captureId || (row.captureIds?.[0] ?? '')
    const confirmTxt = `Refund + restock this order?\n\nOrder: ${row.orderId || row._id}\nCapture: ${cid || '(none)'}`
    if (!confirm(confirmTxt)) return

    const url = cid
      ? `/api/checkout/refund-and-restock?captureId=${encodeURIComponent(cid)}`
      : `/api/checkout/refund-and-restock?orderId=${encodeURIComponent(row.orderId || row._id)}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
    })
    const j = await r.json()
    if (!r.ok) {
      alert(`Refund failed: ${j?.error || r.status}`)
      return
    }
    alert('Refund + restock completed.')
    load()
  }

  return (
    <>
      <Head><title>Admin — Orders</title></Head>
      <main className="wrap">
        <h1>Admin — Orders</h1>

        <div className="controls">
          <input
            type="password"
            placeholder="ADMIN_KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Reload'}</button>
        </div>

        {error && <p className="err">{error}</p>}
        {!error && rows.length === 0 && <p>No orders yet.</p>}

        {rows.length > 0 && (
          <table className="tab">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Order ID</th>
                <th>Capture IDs</th>
                <th>Payer</th>
                <th>Total</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>{r.status}</td>
                  <td>{r.orderId}</td>
                  <td>
                    {r.captureIds?.length
                      ? r.captureIds.join(', ')
                      : '—'}
                  </td>
                  <td>{r.payerEmail || '—'}</td>
                  <td>{r.grandTotal != null ? `${r.grandTotal} ${r.currency || ''}` : '—'}</td>
                  <td>{r.itemsCount}</td>
                  <td>
                    <button onClick={() => doRefund(r)}>
                      Refund + Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <style jsx>{`
        .wrap { margin-left:64px; padding:18px 22px 100px; }
        .controls { display:flex; gap:10px; margin:10px 0 16px; }
        input { padding:8px 10px; border:1px solid #bbb; border-radius:8px; }
        button { padding:8px 12px; border-radius:8px; font-weight:700; border:2px solid #204d69; color:#204d69; background:white; }
        .tab { width:100%; border-collapse: collapse; }
        .tab th, .tab td { border-bottom:1px solid #eee; padding:8px 6px; text-align:left; }
        .err { color:#b00020; }
      `}</style>
    </>
  )
}