"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 380, damping: 34 }}>
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
