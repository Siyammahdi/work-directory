"use client";

import { memo, useState } from "react";
import { motion } from "motion/react";
import { Check, Globe, Link2, Play, Star } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import { previewUrl, type Item } from "@/lib/types";

type Props = {
  item: Item;
  index: number;
  selected: boolean;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onCopyLink: (item: Item) => void;
};

function WorkCard({ item, index, selected, onOpen, onToggleSelect, onCopyLink }: Props) {
  const [hover, setHover] = useState(false);
  const src = previewUrl(item);
  const sub = [item.client, item.industry].filter(Boolean).join(" · ");

  return (
    <motion.article
      layout="position"
      className={`card${selected ? " is-selected" : ""}`}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(index, 12) * 0.025 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      <button className="card__hit" onClick={() => onOpen(item.id)} aria-label={`Open ${item.title}`} />
      <div className="card__media">
        {src ? <FadeImage className="card__img" src={src} alt="" /> : <div className="card__img img-fallback" />}
        {item.media_type === "video" && item.file_url && hover && (
          <video className="card__video" src={item.file_url} muted autoPlay loop playsInline preload="none" />
        )}
        <div className="card__badges">
          {item.featured && (
            <span className="badge badge--featured" title="Featured work">
              <Star size={12} fill="currentColor" /> Featured
            </span>
          )}
          {item.media_type === "video" && (
            <span className="badge" title="Video">
              <Play size={12} fill="currentColor" /> Video
            </span>
          )}
          {item.media_type === "link" && (
            <span className="badge" title="Live link">
              <Globe size={12} /> Live
            </span>
          )}
        </div>
        <motion.button
          className="card__select"
          onClick={() => onToggleSelect(item.id)}
          aria-pressed={selected}
          aria-label={selected ? `Remove ${item.title} from share list` : `Add ${item.title} to share list`}
          title={selected ? "Remove from share list" : "Add to share list"}
          whileTap={{ scale: 0.85 }}
        >
          <motion.span
            initial={false}
            animate={{ scale: selected ? 1 : 0.4, opacity: selected ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 24 }}
          >
            <Check size={14} strokeWidth={3} />
          </motion.span>
        </motion.button>
        <button className="card__quick" onClick={() => onCopyLink(item)} title="Copy client link">
          <Link2 size={14} /> Copy link
        </button>
      </div>
      <div className="card__body">
        <h3 className="card__title">{item.title}</h3>
        <p className="card__sub">{sub || item.category}</p>
        <span className="chip chip--sm">{item.category}</span>
      </div>
    </motion.article>
  );
}

export default memo(WorkCard);
