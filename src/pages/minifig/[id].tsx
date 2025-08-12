import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const MinifigDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [minifig, setMinifig] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/minifigs/${id}`)
        .then((res) => res.json())
        .then((data) => setMinifig(data));
    }
  }, [id]);

  if (!minifig) return <div>Loading...</div>;

  return (
    <div>
      <h1>{minifig.name}</h1>
      <img src={minifig.image} alt={minifig.name} />
      <p>{minifig.description}</p>
    </div>
  );
};

export default MinifigDetail;
