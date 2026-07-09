import type { Metadata } from "next";
import Link from "next/link";
import AdminResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Admin Password",
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-dark-green">Set a new admin password</h1>

        {error === "invalid_link" ? (
          <>
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/admin/forgot-password"
              className="mt-4 inline-block text-sm font-semibold text-brand-green hover:underline"
            >
              Request a new reset link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">Choose a new password for your admin account.</p>
            <div className="mt-6">
              <AdminResetPasswordForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
