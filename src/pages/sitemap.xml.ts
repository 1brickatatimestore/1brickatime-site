import type { NextApiRequest, NextApiResponse } from 'next'

type ThemeOpt = { key: string; label: string; count: number }

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const site = (process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000').replace(/\/+$/, '')
  const now = new Date().toISOString()

  // Core URLs
  const urls: string[] = [
    `${site}/`,
    `${site}/minifigs`,
    `${site}/minifigs-by-theme`,
    `${site}/cart`,
    `${site}/checkout`,
    `${site}/thank-you`,
    `${site}/privacy`,
    `${site}/terms`,
  ]

  // Try to include theme pages (live counts)
  try {
    const r = await fetch(`${site}/api/themes?type=MINIFIG&onlyInStock=1`, { headers: { 'Accept': 'application/json' } })
    if (r.ok) {
      const data = await r.json()
      const opts: ThemeOpt[] = Array.isArray(data.options) ? data.options : []
      for (const t of opts) {
        if (t && t.key && t.count > 0) {
          urls.push(`${site}/minifigs-by-theme?theme=${encodeURIComponent(t.key)}`)
        }
      }
    }
  } catch {
    // ignore; sitemap still valid with static routes
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map(u => [
      `<url>`,
      `<loc>${u}</loc>`,
      `<lastmod>${now}</lastmod>`,
      `<changefreq>daily</changefreq>`,
      `<priority>0.7</priority>`,
      `</url>`
    ].join('')),
    `</urlset>`
  ].join('')

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.status(200).send(xml)
}