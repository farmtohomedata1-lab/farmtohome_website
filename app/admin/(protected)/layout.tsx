import { requireAuthedUser } from "@/lib/auth/session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: proxy.ts already redirects unauthenticated visitors,
  // but every protected render re-checks independently rather than trusting
  // the request made it this far.
  const user = await requireAuthedUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between bg-dark-green px-6 py-3">
        <div>
          <p className="text-sm font-bold text-white">Farm To Home — Admin CMS</p>
          <p className="text-xs text-white/60">{user.email}</p>
        </div>
        <SignOutButton />
      </header>
      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
