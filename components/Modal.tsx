"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { useEscape, useLockBodyScroll } from "@/lib/client-utils";

/** Backdrop + animated panel. Mount inside <AnimatePresence> so the exit animation plays. */
export default function Modal({
  label,
  onClose,
  className = "",
  children,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useLockBodyScroll();
  useEscape(onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  return (
    <div className="modal-root">
      <motion.div
        className="modal-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`modal-panel ${className}`}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16 } }}
      >
        {children}
      </motion.div>
    </div>
  );
}
