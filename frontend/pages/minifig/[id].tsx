// pages/minifig/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import SiteLayout from '@/components/SiteLayout';

interface Minifig {
  _id: string;
  figNumber: string;
  name: string;
  bricklinkName?: string;
  theme?: string;
  priceAUD?: number;
  qty: number;
  condition?: string;
  status?: string;
  lotId?: string;
  myDesc?: string;
  myRemark?: string;
  image?: string;
}

export default function MinifigDetail() {
  const { query } = useRouter();
  const { id } = query;
  const [minifig, setMinifig] = useState<Minifig | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchMinifig = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/minifigs/${id}`);
        setMinifig(res.data);
      } catch (err) {
        console.error('Failed to fetch minifig:', err);
      }
    };
    fetchMinifig();
  }, [id]);

  if (!minifig) return <SiteLayout>Loading…</SiteLayout>;

  const imageUrl =
    minifig.image || `https://img.bricklink.com/ItemImage/MN/0/${minifig.figNumber}.png`;

  return (
    <SiteLayout>
      <Head>
        <title>{minifig.name} – 1Brick at a Time</title>
      </Head>

      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">{minifig.name}</h1>
        <img
          src={imageUrl}
          alt={minifig.name}
          className="w-64 h-auto mb-4 border rounded"
          onError={(e) => (e.currentTarget.src = '/placeholder.png')}
        />
        <ul className="space-y-1 text-sm">
          <li>
            <strong>Figure Number:</strong> {minifig.figNumber}
          </li>
          <li>
            <strong>Theme:</strong> {minifig.theme}
          </li>
          <li>
            <strong>Price (AUD):</strong> ${minifig.priceAUD?.toFixed(2) ?? 'N/A'}
          </li>
          <li>
            <strong>Quantity:</strong> {minifig.qty}
          </li>
          <li>
            <strong>Condition:</strong> {minifig.condition ?? 'Unknown'}
          </li>
          <li>
            <strong>Status:</strong> {minifig.status ?? 'N/A'}
          </li>
          <li>
            <strong>Lot ID:</strong> {minifig.lotId ?? 'N/A'}
          </li>
          <li>
            <strong>My Description:</strong> {minifig.myDesc ?? 'N/A'}
          </li>
          <li>
            <strong>My Remark:</strong> {minifig.myRemark ?? 'N/A'}
          </li>
        </ul>
      </div>
    </SiteLayout>
  );
}
