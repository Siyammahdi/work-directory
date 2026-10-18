import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="login">
      <div className="login__glow" aria-hidden />
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </main>
  );
}
