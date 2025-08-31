// frontend/pages/minifigures.tsx

import { useEffect, useState } from "react";
import axios from "axios";
import Head from "next/head";
import SiteLayout from "@/components/SiteLayout";
import MinifigCard from "@/components/MinifigCard";
import { THEME_LABELS, mapThemeKey, ThemeKey } from "@/lib/theme-map";

interface Minifig {
  _id: string;
  figNumber: string;
  name: string;
  theme?: ThemeKey;
  priceAUD?: number;
  qty: number;
  condition?: string;
  status?: string;
  lotId?: string;
  myDesc?: string;
  myRemark?: string;
  image?: string;
}

export default function MinifiguresPage() {
  const [minifigs, setMinifigs] = useState<Minifig[]>([]);
  const [filtered, setFiltered] = useState<Minifig[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeKey | "all">("all");

  useEffect(() => {
    const fetchMinifigs = async () => {
      try {
        const res = await axios.get("/api/minifigs");
        const data = res.data?.inventory ?? [];
        const enriched = data.map((item: any) => ({
          _id: item._id ?? item.itemNo,
          figNumber: item.itemNo,
          name: item.name,
          theme: mapThemeKey(item.itemNo),
          priceAUD: item.price,
          qty: item.qty,
          condition: item.condition,
          myRemark: item.remarks,
          myDesc: item.description,
          image: item.imageUrl,
        }));
        setMinifigs(enriched);
        setFiltered(enriched);
      } catch (err) {
        console.error("Failed to load minifigs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMinifigs();
  }, []);

  useEffect(() => {
    if (theme === "all") {
      setFiltered(minifigs);
    } else {
      setFiltered(minifigs.filter((fig) => fig.theme === theme));
    }
  }, [theme, minifigs]);

  return (
    <SiteLayout>
      <Head>
        <title>Minifigures – 1Brick at a Time</title>
      </Head>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">
            Minifigures ({filtered.length}/{minifigs.length})
          </h1>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeKey | "all")}
            className="border px-3 py-2 rounded"
          >
            <option value="all">All Themes</option>
            {Object.entries(THEME_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading minifigs…</p>
        ) : filtered.length === 0 ? (
          <p>No minifigs found for this theme.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((fig) => (
              <MinifigCard key={fig._id} minifig={fig} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
