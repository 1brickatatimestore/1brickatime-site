<<<<<<< HEAD:src/pages/_document.tsx
<<<<<<< HEAD
// src/pages/_document.tsx
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#ffffff" />
          <link rel="icon" href="/favicon.ico" />
          {/* put fonts or analytics meta here if you use them */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
=======
import { Html, Head, Main, NextScript } from 'next/document'
=======
import { Html, Head, Main, NextScript } from "next/document";
>>>>>>> ed05686 (Stable backup - September 1st, 2025):_attic/pre_restore_20250830-1919/src/pages/_document.tsx

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
<<<<<<< HEAD:src/pages/_document.tsx
  )
}
>>>>>>> 92a5210 (Lock layout: header/rail/footer finalized)
=======
  );
}
>>>>>>> ed05686 (Stable backup - September 1st, 2025):_attic/pre_restore_20250830-1919/src/pages/_document.tsx
