import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import { safeRedirect } from "@/lib/auth/safeRedirect";

export const metadata: Metadata = {
  title: "Log In | Farm To Home",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect, reset } = await searchParams;
  const redirectTo = safeRedirect(redirect, "/account");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-dark-green">Log In</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and password. First time here? We&apos;ll let you know right
          here if you need to create an account — no separate signup page.
        </p>

        {reset && (
          <p className="mt-4 rounded-md bg-brand-green/10 px-3 py-2 text-sm text-dark-green">
            Password updated — please log in.
          </p>
        )}

        <div className="mt-6">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
