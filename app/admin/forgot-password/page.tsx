import type { Metadata } from "next";
import AdminForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Admin Password",
};

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-dark-green">Reset admin password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your admin email and we&apos;ll send a reset link. You&apos;ll get an alert either
          way if it&apos;s the real admin account.
        </p>

        <div className="mt-6">
          <AdminForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
