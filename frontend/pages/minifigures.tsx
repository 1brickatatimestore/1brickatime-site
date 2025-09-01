// pages/minifigures.tsx
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function MinifiguresPage() {
  const { data, error } = useSWR('/api/sync-bricklink', fetcher);

  if (error) return <div>Failed to load minifigures</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {data.map((fig: any) => (
        <div key={fig.no} className="border p-2 rounded shadow bg-white">
          <img src={fig.img_url} alt={fig.name} className="w-full h-32 object-contain mb-2" />
          <h2 className="text-md font-semibold">{fig.name}</h2>
          <p className="text-sm text-gray-600">{fig.no}</p>
        </div>
      ))}
    </div>
  );
}