// components/Sidebar.tsx
import Image from 'next/image'

export default function Sidebar() {
  return (
    <aside className="w-10 md:w-16">
      <Image
        src="/stud-rail.png"
        alt="Stud Rail"
        width={64}
        height={800}
        style={{ height: '100vh', width: 'auto' }}
      />
    </aside>
  )
}