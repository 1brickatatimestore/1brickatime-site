import Link from "next/link";
import Image from "next/image";
import styles from "./MinifigCard.module.css";

interface MinifigCardProps {
  id: string;
  name: string;
  imgUrl: string;
  price: number;
}

const MinifigCard = ({ id, name, imgUrl, price }: MinifigCardProps) => {
  return (
    <Link href={`/minifigs/${id}`} className={styles.card}>
      <div>
        <Image
          src={imgUrl}
          alt={name}
          width={200}
          height={200}
          className={styles.image}
        />
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.price}>${price.toFixed(2)}</p>
      </div>
    </Link>
  );
};

export default MinifigCard;
