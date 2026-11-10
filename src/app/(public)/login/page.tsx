import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-sm text-mute">Loading sign in…</p>}>
      <LoginForm />
    </Suspense>
  );
}
