// src/pages/admin/orders.tsx
import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = process.env.ADMIN_TOKEN ?? '';
  const key = ctx.query.key;
  const auth = ctx.req.headers.authorization || '';
  const expected = 'Basic ' + Buffer.from(`admin:${token}`).toString('base64');

  const ok = token && (key === token || auth === expected);
  if (!ok) {
    ctx.res.statusCode = 401;
    ctx.res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
  }
  return { props: {} };
};