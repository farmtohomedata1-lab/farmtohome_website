"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pages } from "@/lib/cms/sections.config";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-gray-200 bg-white py-6">
      <p className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Pages
      </p>
      <ul>
        {pages.map((p) => {
          const href = `/admin/cms/${p.page}`;
          const isActive = pathname === href;
          return (
            <li key={p.page}>
              <Link
                href={href}
                className={`block px-5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-l-2 border-brand-green bg-brand-green/5 text-dark-green"
                    : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Orders
      </p>
      <ul>
        <li>
          <Link
            href="/admin/orders"
            className={`block px-5 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/admin/orders")
                ? "border-l-2 border-brand-green bg-brand-green/5 text-dark-green"
                : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50"
            }`}
          >
            All Orders
          </Link>
        </li>
      </ul>

      <p className="mt-6 px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Catalog
      </p>
      <ul>
        {[
          { href: "/admin/products", label: "Products" },
          { href: "/admin/categories", label: "Categories" },
          { href: "/admin/brands", label: "Brands" },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block px-5 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "border-l-2 border-brand-green bg-brand-green/5 text-dark-green"
                  : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Settings
      </p>
      <ul>
        {[
          { href: "/admin/shipping-settings", label: "Shipping Settings" },
          { href: "/admin/coupons", label: "Coupons" },
          { href: "/admin/activity-log", label: "Activity Log" },
        ].map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block px-5 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "border-l-2 border-brand-green bg-brand-green/5 text-dark-green"
                  : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
