import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";
import { createCustomerClient } from "@/lib/supabase/customerServer";

export const metadata: Metadata = {
  title: "Set New Password | Farm To Home",
};

// Verification itself now happens in app/reset-password/confirm/route.ts (a
// Route Handler, which — unlike this Server Component — is actually allowed
// to persist the resulting session cookie). By the time a browser lands
// here, either that cookie is already set (real reset flow) or it isn't
// (stale/expired/tampered link, or someone linking here directly).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createCustomerClient();
  const { data } = await supabase.auth.getUser();
  const verified = !error && !!data.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-dark-green">Set New Password</h1>
        {verified ? (
          <>
            <p className="mt-1 text-sm text-gray-500">Choose a new password for your account.</p>
            <div className="mt-6">
              <ResetPasswordForm />
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This link has expired or is invalid. Please request a new one from the login page.
          </p>
        )}
      </div>
    </div>
  );
}
