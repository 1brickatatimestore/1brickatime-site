import Image from "next/image";

interface Minifig {
  _id: string;
  name: string;
  imageUrl: string;
}

export default function MinifigCard({ minifig }: { minifig: Minifig }) {
  return (
    <div className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="relative h-32 w-32">
        <Image
          src={minifig.imageUrl}
          alt={minifig.name}
          layout="fill"
          objectFit="contain"
        />
      </div>
      <div className="text-center text-sm font-medium">{minifig.name}</div>
    </div>
  );
}