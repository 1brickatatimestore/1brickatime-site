import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Minifig = {
  _id: string
  name: string
  theme?: string
  image?: string
}

type Props = {
  items: Minifig[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const res = await fetch('http://localhost:3000/api/minifigs')
  const items: Minifig[] = await res.json()
  return { props: { items } }
}

export default function MinifigsByTheme({ items }: Props) {
  const themes = Array.from(new Set(items.map((i) => i.theme).filter(Boolean)))

  return (
    <>
      <Head>
        <title>Minifigs by Theme</title>
      </Head>
      <main>
        <h1>Minifigs by Theme</h1>
        <ul>
          {themes.map((t) => (
            <li key={t}>
              <Link href={`/minifigs?theme=${encodeURIComponent(t!)}`}>{t}</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}