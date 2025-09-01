import nodemailer from 'nodemailer'

type OrderLike = {
  _id?: string
  orderId?: string
  captureId?: string
  payer?: { email?: string; name?: string }
  totals?: { currency?: string; items?: number; postage?: number; grand?: number }
  items?: Array<{ name?: string; qty?: number; price?: number }>
  createdAt?: string | Date
}

function bool(v: any) {
  if (v === true) return true
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
}

export async function sendOrderEmail(order: OrderLike) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SALES_EMAIL_FROM || process.env.SMTP_USER
  const to = process.env.SALES_EMAIL_TO || process.env.SMTP_USER

  if (!host || !user || !pass || !from || !to) {
    return { ok: false, skipped: true, reason: 'SMTP env incomplete' }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  })

  const lines = (order.items || []).map(
    (it) => `• ${it.name || ''} — x${it.qty ?? 1} @ ${it.price ?? 0}`
  )

  const siteUrl = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'
  const subject = `New order: ${order.orderId || order.captureId || order._id || 'unknown'}`
  const text = [
    `Order: ${order.orderId || ''}`,
    `Capture: ${order.captureId || ''}`,
    `Payer: ${order.payer?.email || ''}`,
    `Totals: ${order.totals?.currency || ''} ${order.totals?.grand ?? ''}`,
    '',
    'Items:',
    ...lines,
    '',
    `Admin: ${siteUrl}/admin/orders`,
  ].join('\n')

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: `
      <h2>New order</h2>
      <p><b>Order:</b> ${order.orderId || ''}</p>
      <p><b>Capture:</b> ${order.captureId || ''}</p>
      <p><b>Payer:</b> ${order.payer?.email || ''}</p>
      <p><b>Totals:</b> ${order.totals?.currency || ''} ${order.totals?.grand ?? ''}</p>
      <h3>Items</h3>
      <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
      <p><a href="${siteUrl}/admin/orders">Open admin orders</a></p>
    `,
  })

  return { ok: true }
}