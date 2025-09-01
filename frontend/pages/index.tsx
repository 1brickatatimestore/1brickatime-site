// pages/index.tsx
import Image from 'next/image'
import Link from 'next/link'
import styles from './index.module.css'

export default function Home() {
  return (
    <div className={styles.hero}>
      <Image
        src="/logo.png"
        alt="1 Brick at a Time Logo"
        width={200}
        height={200}
        className={styles.logo}
      />
      <h1 className={styles.heading}>
        <span>1 Brick at a </span>
        <span className={styles.red}>time.</span>
      </h1>
      <p className={styles.owner}>
        Owned by K & K Enterprises — Director: Kamila McT. Building connections — human and LEGO ones — since 2023.
      </p>

      <div className={styles.buttons}>
        <Link href="/shop" className={styles.yellowButton}>Shop Now</Link>
        <Link href="/minifigures" className={styles.outlineButton}>See All Items</Link>
      </div>

      <div className={styles.greeting}>
        <h2>G’day,</h2>
        <p>we strive for 100% customer satisfaction, so please let us know if there’s anything else we can do for you.</p>
      </div>
    </div>
  )
}