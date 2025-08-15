// src/components/Layout.tsx
import React, { PropsWithChildren } from 'react'
import Link from 'next/link'

export default function Layout({ children }: PropsWithChildren<{}>) {
  // Decorative “studs” row colors (repeat to taste)
  const studs = [
    '#d7ccc8', '#a1887f', '#ffffff', '#c8e6c9', '#ffecb3', '#ffe0b2', '#bbdefb', '#f8bbd0',
    '#d7ccc8', '#a1887f', '#ffffff', '#c8e6c9', '#ffecb3', '#ffe0b2', '#bbdefb', '#f8bbd0',
  ]

  return (
    <>
      <a href="#content" className="skip">Skip to content</a>

      <header id="site-header" className="siteHeader">
        <div className="wrap">
          <Link href="/" className="brand">1 Brick at a Time</Link>

          <nav className="nav" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link href="/minifigs?type=MINIFIG&limit=36">Minifigs</Link>
            <Link href="/minifigs-by-theme?limit=36">By Theme</Link>
            <Link href="/cart">Cart</Link>
          </nav>
        </div>

        {/* stud bar */}
        <div className="studBar" aria-hidden="true">
          {studs.map((c, i) => (
            <span key={i} className="stud" style={{ background: c }} />
          ))}
        </div>
      </header>

      <main id="content" className="siteMain">
        {children}
      </main>

      <footer className="siteFooter">
        © {new Date().getFullYear()} 1 Brick at a Time
      </footer>

      <style jsx>{`
        /* accessibility */
        .skip {
          position: absolute;
          left: -9999px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        .skip:focus {
          position: fixed;
          left: 16px;
          top: 12px;
          width: auto;
          height: auto;
          padding: 8px 12px;
          background: #fff;
          border: 2px solid #204d69;
          border-radius: 8px;
          z-index: 100;
        }

        /* header */
        .siteHeader {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #f7f2eb;
          border-bottom: 1px solid #e7dccb;
        }
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand {
          font-weight: 800;
          color: #1a1a1a;
          text-decoration: none;
        }
        .nav {
          display: flex;
          gap: 16px;
        }
        .nav :global(a) {
          color: #204d69;
          text-decoration: none;
          font-weight: 600;
        }

        /* stud bar */
        .studBar {
          display: flex;
          gap: 6px;
          padding: 8px 16px;
          justify-content: center;
          background: #f3ece1;
          border-top: 1px solid #e7dccb;
        }
        .stud {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow:
            inset -2px -3px 0 rgba(0,0,0,0.12),
            0 1px 0 rgba(255,255,255,0.8);
          flex: 0 0 16px;
        }

        /* main */
        .siteMain {
          max-width: 1080px;
          margin: 0 auto;
          padding: 24px 16px;
          min-height: 60vh;
        }

        /* footer */
        .siteFooter {
          max-width: 1080px;
          margin: 40px auto 24px;
          padding: 0 16px;
          color: #777;
          text-align: center;
          border-top: 1px solid #eee;
        }

        @media (max-width: 920px) {
          .wrap { padding: 10px 12px; }
          .nav { gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
        }
      `}</style>
    </>
  )
}