import Link from "next/link";
import TopBar from "@/components/home/TopBar";
import SiteHeader from "@/components/home/SiteHeader";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <NavBar />
      <main>
        <div className="mx-auto flex w-full max-w-[1320px] flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-6xl font-bold text-brand-green sm:text-7xl">404</p>
          <h1 className="mt-4 text-2xl font-bold text-dark-green sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-3 max-w-md text-sm text-gray-500">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved
            or no longer exists.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white"
            >
              Back to Home
            </Link>
            <Link
              href="/shop"
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Go to Shop
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
