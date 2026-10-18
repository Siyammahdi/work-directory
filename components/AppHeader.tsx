"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { LayoutGrid, Link2, LogOut } from "lucide-react";
import { logout } from "@/app/actions";

const NAV = [
  { href: "/", label: "Library", icon: LayoutGrid },
  { href: "/links", label: "Share links", icon: Link2 },
];

export default function AppHeader({ children, actions }: { children?: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link href="/" className="brand" aria-label="Techwitpro work library home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Techwitpro" width={140} height={17} />
        </Link>
        <nav className="app-nav" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`app-nav__link${active ? " is-active" : ""}`}>
                {active && <motion.span layoutId="nav-pill" className="app-nav__pill" />}
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="app-header__slot">{children}</div>
        <div className="app-header__actions">
          {actions}
          <form action={logout}>
            <button className="icon-btn icon-btn--on-dark" title="Sign out" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
