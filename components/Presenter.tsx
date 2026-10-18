"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ExternalLink, GalleryHorizontal, Maximize, Minimize, X } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import { fullImageUrl, previewUrl, type Item } from "@/lib/types";
import { useEscape, useKeydown, useLockBodyScroll } from "@/lib/client-utils";

const slide = {
  enter: (dir: number) => ({ x: dir * 90, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir * -90, opacity: 0, scale: 0.98 }),
};

export default function Presenter({
  items,
  startIndex = 0,
  title,
  onClose,
}: {
  items: Item[];
  startIndex?: number;
  title?: string;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [[index, dir], setPos] = useState<[number, number]>([Math.min(startIndex, items.length - 1), 0]);
  const [thumbs, setThumbs] = useState(false);
  const [idle, setIdle] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const n = items.length;
  const item = items[index];

  const go = useCallback((d: number) => setPos(([i]) => [(i + d + n) % n, d]), [n]);
  const jump = (i: number) => setPos(([cur]) => [i, i >= cur ? 1 : -1]);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  }, [onClose]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else root.current?.requestFullscreen?.().catch(() => {});
  };

  useLockBodyScroll();
  useEscape(close);
  useKeydown((e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) go(1);
    else if (["ArrowLeft", "PageUp"].includes(e.key)) go(-1);
    else if (e.key === "Home") jump(0);
    else if (e.key === "End") jump(n - 1);
    else if (e.key.toLowerCase() === "f") toggleFullscreen();
    else if (e.key.toLowerCase() === "g") setThumbs((t) => !t);
    else return;
    e.preventDefault();
    wake();
  });

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    for (const d of [1, -1]) {
      const next = items[(index + d + n) % n];
      const src = next && fullImageUrl(next);
      if (src) new Image().src = src;
    }
  }, [index, items, n]);

  const wake = () => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2600);
  };
  useEffect(() => {
    wake();
    return () => clearTimeout(idleTimer.current);
  }, []);

  if (!item) return null;
  const meta = [item.category, item.client || item.industry].filter(Boolean).join(" · ");

  return (
    <motion.div
      ref={root}
      className={`presenter${idle ? " is-idle" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Presenting ${title ?? "work"}`}
      onMouseMove={wake}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="presenter__top">
        <div className="presenter__title">
          {title && <strong>{title}</strong>}
          <span>
            {index + 1} / {n}
          </span>
        </div>
        <div className="presenter__tools">
          <button className="icon-btn icon-btn--on-dark" onClick={() => setThumbs((t) => !t)} title="All slides (G)">
            <GalleryHorizontal size={18} />
          </button>
          <button className="icon-btn icon-btn--on-dark" onClick={toggleFullscreen} title="Full screen (F)">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <button className="icon-btn icon-btn--on-dark" onClick={close} title="Exit (Esc)">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="presenter__stage">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.figure
            key={item.id}
            className="presenter__slide"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag={n > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) go(1);
              else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
            }}
          >
            <SlideMedia item={item} />
          </motion.figure>
        </AnimatePresence>
        {n > 1 && (
          <>
            <button className="presenter__nav presenter__nav--prev" onClick={() => go(-1)} aria-label="Previous">
              <ChevronLeft size={28} />
            </button>
            <button className="presenter__nav presenter__nav--next" onClick={() => go(1)} aria-label="Next">
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={item.id}
          className="presenter__caption"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
        >
          <p className="presenter__meta">{meta}</p>
          <h2>{item.title}</h2>
          {item.description && <p className="presenter__desc">{item.description}</p>}
          {item.link_url && (
            <a className="btn btn--light btn--sm" href={item.link_url} target="_blank" rel="noreferrer">
              View live project <ExternalLink size={14} />
            </a>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="presenter__progress" aria-hidden>
        <motion.span animate={{ width: `${((index + 1) / n) * 100}%` }} />
      </div>

      <AnimatePresence>
        {thumbs && (
          <motion.div
            className="presenter__thumbs"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
          >
            {items.map((it, i) => (
              <button
                key={it.id}
                className={`presenter__thumb${i === index ? " is-active" : ""}`}
                onClick={() => jump(i)}
                aria-label={`Go to ${it.title}`}
              >
                <FadeImage src={previewUrl(it) ?? undefined} alt="" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideMedia({ item }: { item: Item }) {
  if (item.media_type === "video" && item.file_url) {
    return (
      <video
        className="presenter__media"
        src={item.file_url}
        poster={item.thumb_url ?? undefined}
        controls
        autoPlay
        playsInline
        draggable={false}
      />
    );
  }
  const src = fullImageUrl(item);
  return (
    <div className="presenter__media-wrap">
      <FadeImage
        className="presenter__media"
        src={src ?? undefined}
        alt={item.title}
        draggable={false}
        loading="eager"
      />
      {item.media_type === "link" && item.link_url && (
        <a className="presenter__live" href={item.link_url} target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> Open live site
        </a>
      )}
    </div>
  );
}
