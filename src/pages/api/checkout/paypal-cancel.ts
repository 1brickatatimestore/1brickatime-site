import type { NextApiRequest, NextApiResponse } from 'next'

function siteUrl(req: NextApiRequest) {
  return (
    process. PAYPAL_CLIENT_SECRET_REDACTED||
    `${(req.headers['x-forwarded-proto'] as string) || 'http'}://${req.headers.host}`
  )
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const u = new URL('/checkout', siteUrl(req))
  u.searchParams.set('canceled', '1')
  res.writeHead(302, { Location: u.toString() })
  res.end()
}