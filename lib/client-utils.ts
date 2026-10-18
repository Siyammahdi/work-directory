"use client";

import { useEffect, useRef } from "react";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function toPng(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/png"));
}

export async function copyImage(url: string): Promise<boolean> {
  try {
    const blob = await (await fetch(url)).blob();
    const png = blob.type === "image/png" ? blob : await toPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    return true;
  } catch {
    return false;
  }
}

export async function downloadFile(url: string, name: string) {
  try {
    const blob = await (await fetch(url)).blob();
    const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: `${slugify(name)}.${ext}` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "file";

export const isTypingTarget = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** Locks page scroll while a modal-like surface is mounted. */
export function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}

const escapeStack: { current: () => void }[] = [];
let escapeBound = false;

/** Escape closes only the top-most layer (presenter above modal above tray). */
export function useEscape(handler: () => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    if (!escapeBound) {
      escapeBound = true;
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && escapeStack.length) {
          e.preventDefault();
          escapeStack[escapeStack.length - 1].current();
        }
      });
    }
    const entry = ref;
    escapeStack.push(entry);
    return () => {
      const i = escapeStack.lastIndexOf(entry);
      if (i !== -1) escapeStack.splice(i, 1);
    };
  }, [active]);
}

export const hasOpenLayer = () => escapeStack.length > 0;

/** Calls the latest handler on keydown without re-binding the listener each render. */
export function useKeydown(handler: (e: KeyboardEvent) => void, active = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const fn = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [active]);
}
