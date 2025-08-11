import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>1 Brick at a Time</title>
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="mb-8 text-center text-4xl font-bold">
          Welcome to 1 Brick at a Time
        </h1>
        <p className="mb-4 text-center text-lg">
          Explore our collection of LEGO® minifigs and accessories.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/minifigs">
            <span className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition">
              View Minifigs
            </span>
          </Link>
          <Link href="/themes">
            <span className="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 transition">
              Browse Themes
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}