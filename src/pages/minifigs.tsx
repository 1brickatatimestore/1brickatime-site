import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const Minifigs = () => {
  const [minifigs, setMinifigs] = useState([]);

  useEffect(() => {
    fetch('/api/minifigs')
      .then((res) => res.json())
      .then((data) => setMinifigs(data));
  }, []);

  return (
    <div>
      <h1>All Minifigs</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {minifigs.map((fig) => (
          <Link key={fig.id} href={`/minifig/${fig.id}`}>
            <div className="p-2 border rounded cursor-pointer hover:shadow">
              <img src={fig.image} alt={fig.name} className="w-full h-auto" />
              <h2 className="text-center mt-2">{fig.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Minifigs;