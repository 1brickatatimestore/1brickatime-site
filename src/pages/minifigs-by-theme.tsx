// src/pages/minifigs-by-theme.tsx
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { GetServerSideProps } from 'next'

type Product = {
  _id?: string
  inventoryId?: number
  name: string
  itemNo?: string
  imageUrl: string
  price?: number
  qty?: number
}

type GroupKey = 'main' | 'collectibles' | 'other' | null

type ThemeOpt = {
  value: string
  label: string
  count: number | null            // <— never undefined
  group?: GroupKey
}

type Props = {
  items: Product[]
  total: number
  page: number
  limit: number
  onlyInStock: boolean
  options: ThemeOpt[]
  currentTheme: string
  allCount: number
}

function decodeHtml(s: string) {
  if (!s) return ''
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&#40;', '(')
    .replaceAll('&#41;', ')')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

const num = (n?: number) =>
  typeof n === 'number' ? n.toLocaleString() : ''

export default function MinifigsByTheme(props: Props) {
  // Component implementation continues...
}