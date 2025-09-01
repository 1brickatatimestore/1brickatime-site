// components/Footer.tsx
import styles from './Footer.module.css'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cta}>
        <Image src="/sunflower-block.png" alt="Build alongside us!" width={260} height={65} />
      </div>
    </footer>
  )
}