import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const site = process. PAYPAL_CLIENT_SECRET_REDACTED|| 'http://localhost:3000';
  const body = `User-agent: *
Allow: /
Sitemap: ${site}/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(body);
}