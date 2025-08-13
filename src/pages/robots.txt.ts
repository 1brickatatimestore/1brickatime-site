import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${site.replace(/\/+$/, '')}/sitemap.xml`,
  ].join('\n')

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.send(body)
}