// middleware.ts (repo root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  // If no token is set, let everything through (nothing to protect against).
  if (!token) return NextResponse.next();

  const auth = req.headers.get('authorization') || '';
  const expected = 'Basic ' + Buffer.from(`admin:${token}`).toString('base64');

  if (auth === expected) {
    return NextResponse.next();
  }

  // Challenge
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin"',
      // Optional: avoid caching the challenge
      'Cache-Control': 'no-store',
    },
  });
}