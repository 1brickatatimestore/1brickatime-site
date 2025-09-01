// src/components/MinifigCard.tsx
import Image from "next/image";
import React from "react";
import styles from "./MinifigCard.module.css";

export type Minifig = {
  _id?: string; // backend sometimes uses _id
  id?: string; // or id
  name: string;
  price?: number; // some docs use price
  priceAUD?: number; // some docs use priceAUD
  condition?: "N" | "U" | string;
  imageUrl?: string; // some docs use imageUrl
  image?: string; // others use image
  theme?: string;
  inStock?: boolean;
  qty?: number; // derive inStock if present
};

type Props = {
  fig?: Minifig; // be defensive (avoid runtime null/undefined)
  onAdd?: (fig: Minifig) => void;
  onDetails?: (id: string) => void;
};

export default function MinifigCard({ fig, onAdd, onDetails }: Props) {
  // If parent passes nothing, render nothing (prevents runtime errors)
  if (!fig) return null;

  // Normalize fields coming from various sources
  const id = fig._id ?? fig.id ?? "";
  const priceValue = (fig.price ?? fig.priceAUD ?? 0) as number;
  const imgSrc = fig.imageUrl || fig.image || "/placeholder-minifig.png";
  const cond = (fig.condition as "N" | "U" | string) ?? "N";
  const conditionLabel = cond === "N" ? "New" : "Used";
  const derivedInStock =
    fig.inStock ?? (typeof fig.qty === "number" ? fig.qty > 0 : undefined);

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={imgSrc}
          alt={fig.name}
          width={240}
          height={200}
          className={styles.img}
          priority={false}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.title}>{fig.name}</div>

        <div className={styles.meta}>
          {fig.theme ? <span className={styles.badge}>{fig.theme}</span> : null}
          {derivedInStock === false ? (
            <span className={styles.badge}>Out of stock</span>
          ) : null}
        </div>

        <div className={styles.priceRow}>
          <div className={styles.price}>
            ${Number(priceValue).toFixed(2)} • {cond}
          </div>
          <div className={styles.cond}>{conditionLabel}</div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.addBtn}
            onClick={() => onAdd?.(fig)}
            aria-label={`Add ${fig.name} to cart`}
          >
            Add to cart
          </button>
          <button
            className={styles.detailsBtn}
            onClick={() => id && onDetails?.(id)}
            aria-label={`See details for ${fig.name}`}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
