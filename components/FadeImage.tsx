"use client";

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";

/** Image that fades in once decoded and degrades to a quiet placeholder if the URL fails. */
export default function FadeImage({ className = "", alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const img = ref.current;
    if (img?.complete) setState(img.naturalWidth ? "loaded" : "error");
  }, [props.src]);

  if (state === "error" || !props.src) {
    return (
      <div className={`${className} img-fallback`} role="img" aria-label={alt}>
        <ImageOff size={22} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
      className={`${className} fade-img${state === "loaded" ? " is-loaded" : ""}`}
      onLoad={() => setState("loaded")}
      onError={() => setState("error")}
    />
  );
}
