// middleware.ts (in repo root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };

export function middleware(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN ?? '';
  const url = new URL(req.url);

  const tag = (r: NextResponse) => { r.headers.set('x-admin-guard', 'on'); return r; };

  if (!token) return tag(NextResponse.next()); // if token missing, don’t block

  if (url.searchParams.get('key') === token) return tag(NextResponse.next());

  const auth = req.headers.get('authorization') ?? '';
  const expected = 'Basic ' + Buffer.from(`admin:${token}`).toString('base64');
  if (auth === expected) return tag(NextResponse.next());

  return tag(new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  }));
}