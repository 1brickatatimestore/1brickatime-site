// src/pages/minifigs.tsx
import type { GetServerSideProps } from 'next'
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/minifigs-by-theme', permanent: true }
})
export default function Redirect(){ return null }
