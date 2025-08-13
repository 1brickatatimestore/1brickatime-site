// FULL FILE – sends a simple test email using the SMTP_* env vars.
//
// GET /api/debug/send-test-email
// Optional query: ?to=someone@example.com
//
// Returns { ok: true, to } if nodemailer accepted the message.

import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || ''
const port = Number(process.env.SMTP_PORT || 0) || 587
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''
const FROM = process.env.SALES_EMAIL_FROM || user
const DEFAULT_TO = process.env.SALES_EMAIL_TO || user

function buildTransport() {
  // If using port 465 use secure:true, otherwise STARTTLS on 587
  const secure = port === 465
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!host || !user || !pass) {
      return res.status(400).json({ ok: false, error: 'smtp_not_configured' })
    }
    const to = String(req.query.to || DEFAULT_TO)
    const transporter = buildTransport()
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Test email from 1 Brick at a Time',
      text: 'If you can read this, SMTP is working 🎉',
      html: '<p>If you can read this, <b>SMTP is working</b> 🎉</p>',
    })
    return res.status(200).json({ ok: true, to, messageId: info.messageId })
  } catch (e: any) {
    //  PAYPAL_CLIENT_SECRET_REDACTEDno-console
    console.error(e)
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}