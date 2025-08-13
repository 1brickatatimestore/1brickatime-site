import nodemailer from 'nodemailer'

export function mailEnvOk() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SALES_EMAIL_TO)
}

export async function sendOrderEmail(order: any) {
  if (!mailEnvOk()) throw new Error('smtp_not_configured')

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  })

  const to = process.env.SALES_EMAIL_TO!
  const from = process.env.SALES_EMAIL_FROM || process.env.SALES_EMAIL_TO!

  const lines = (order?.items || []).map((it:any) =>
    `• ${it.name} ×${it.qty} — $${Number(it.price || 0).toFixed(2)}`
  )

  const total = order?.totals?.total
  const currency = order?.currency || process. PAYPAL_CLIENT_SECRET_REDACTED|| 'AUD'
  const buyer = [order?.payer?.name, order?.payer?.email].filter(Boolean).join(' · ')
  const subject = `New order ${order?.orderId || ''} — ${total ? `${total.toFixed(2)} ${currency}` : ''}`.trim()

  const text = [
    `Order: ${order?.orderId || '—'}`,
    `Capture: ${order?.captureId || '—'}`,
    `Status: ${order?.status || '—'}`,
    buyer ? `Buyer: ${buyer}` : null,
    '',
    'Items:',
    ...lines,
    '',
    total ? `Total: ${total.toFixed(2)} ${currency}` : null,
    '',
    `Placed: ${order?.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}`,
  ].filter(Boolean).join('\n')

  await transporter.sendMail({ to, from, subject, text })
  return { ok: true }
}