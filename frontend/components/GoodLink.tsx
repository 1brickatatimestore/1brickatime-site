// components/GoodLink.tsx
import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
};

export default function GoodLink({ href, children, className }: Props) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}