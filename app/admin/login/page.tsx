import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-dark-green">Admin Login</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage site content.</p>

        {expired && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your session expired due to inactivity. Please sign in again.
          </p>
        )}

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
