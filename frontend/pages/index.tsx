// pages/index.tsx
import Head from "next/head";
import Image from "next/image";
import Layout from "../components/Layout";
import Link from "next/link";

export default function HomePage() {
  return (
    <Layout>
      <Head>
        <title>1 Brick at a Time</title>
      </Head>

      <div className="flex flex-col items-center px-4 py-10 text-center">
        <div className="bg-white rounded-xl p-6 shadow-md max-w-2xl">
          <Image
            src="/logo.png"
            alt="1 Brick at a Time Logo"
            width={200}
            height={200}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-extrabold mb-2">
            1 Brick at a <span className="text-red-700 italic">time.</span>
          </h1>
          <p className="text-sm mb-6 text-gray-700">
            Owned by K & K Enterprises — Director: Kamila McT. Building
            connections — human and LEGO ones — since 2023.
          </p>

          <div className="flex justify-center gap-4 mb-6">
            <Link href="/minifigures">
              <a className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded">
                Shop Now
              </a>
            </Link>
            <Link href="/minifigures?type=MINIFIG&limit=72">
              <a className="bg-white border border-gray-300 hover:border-gray-500 text-gray-700 font-bold py-2 px-4 rounded">
                See All Items
              </a>
            </Link>
          </div>

          <p className="text-xl italic text-gray-800">
            G’day,
            <br />
            <span className="text-lg">
              we strive for 100% customer satisfaction, so please let us know if
              there’s anything else we can do for you.
            </span>
          </p>
        </div>
      </div>
    </Layout>
  );
}
