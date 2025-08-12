// src/pages/api/checkout/paypal.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import * as paypal from '@paypal/checkout-server-sdk'

const siteUrl = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000'

function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ''
  const clientSecret = process. PAYPAL_CLIENT_SECRET_REDACTED|| ''
  const envName = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()

  const environment =
    envName === 'live'
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret)

  return new paypal.core.PayPalHttpClient(environment)
}

type Item = {
  sku: string
  name: string
  price: number     // AUD dollars
  quantity: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const items: Item[] = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'No items' })

    const value = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const client = paypalClient()

    const request = new paypal.orders.OrdersCreateRequest()
    request.prefer('return=representation')
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'AUD',
            value: value.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'AUD',
                value: value.toFixed(2),
              },
            },
          },
          items: items.map(i => ({
            name: i.name || i.sku,
            sku: i.sku,
            unit_amount: { currency_code: 'AUD', value: i.price.toFixed(2) },
            quantity: String(i.quantity || 1),
          })),
        },
      ],
      application_context: {
        brand_name: '1 Brick at a Time',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${siteUrl}/checkout?status=paypal_success`,
        cancel_url: `${siteUrl}/checkout?status=paypal_cancel`,
      },
    })

    const order = await client.execute(request)
    const approveUrl =
      order?.result?.links?.find((l: any) => l.rel === 'approve')?.href || null

    if (!approveUrl) return res.status(500).json({ error: 'No approval URL returned' })

    return res.status(200).json({ approveUrl })
  } catch (err: any) {
    console.error('PayPal order create error:', err)
    return res.status(500).json({ error: err?.message || 'PayPal error' })
  }
}