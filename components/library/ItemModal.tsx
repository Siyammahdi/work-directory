"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Link2,
  Pencil,
  Plus,
  Presentation,
  Star,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import FadeImage from "@/components/FadeImage";
import { useToast } from "@/components/Toast";
import { copyImage, copyText, downloadFile, useKeydown } from "@/lib/client-utils";
import { fullImageUrl, previewUrl, type Item } from "@/lib/types";

type Props = {
  item: Item;
  list: Item[];
  all: Item[];
  selected: boolean;
  paused: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onPresent: (item: Item) => void;
  onEdit: (item: Item) => void;
  onFeatured: (item: Item) => void;
  onTag: (tag: string) => void;
};

export default function ItemModal(props: Props) {
  const { item, list, all, selected, paused, onClose, onOpen, onToggleSelect, onPresent, onEdit, onFeatured, onTag } =
    props;
  const toast = useToast();
  const [dir, setDir] = useState(0);
  const index = list.findIndex((i) => i.id === item.id);

  const step = (d: number) => {
    if (list.length < 2 || index === -1) return;
    setDir(d);
    onOpen(list[(index + d + list.length) % list.length].id);
  };

  useKeydown((e) => {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key.toLowerCase() === "a" && !e.metaKey && !e.ctrlKey) onToggleSelect(item.id);
    else return;
    e.preventDefault();
  }, !paused);

  const related = useMemo(() => {
    const score = (o: Item) =>
      (o.category === item.category ? 2 : 0) +
      (o.industry && o.industry === item.industry ? 2 : 0) +
      (o.client && o.client === item.client ? 3 : 0) +
      o.tags.filter((t) => item.tags.includes(t)).length;
    return all
      .filter((o) => o.id !== item.id)
      .map((o) => [o, score(o)] as const)
      .filter(([, s]) => s > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([o]) => o);
  }, [all, item]);

  const projectUrl = () => `${location.origin}/p/${item.id}`;
  const copyLink = async () =>
    toast((await copyText(projectUrl())) ? "Client link copied" : "Couldn't copy. Try again.", "ok");
  const copyPic = async () => {
    const src = fullImageUrl(item);
    if (!src) return;
    const ok = await copyImage(src);
    toast(
      ok ? "Image copied. Paste it into your chat or email" : "This image can't be copied. Use Download instead.",
      ok ? "ok" : "error",
    );
  };
  const image = fullImageUrl(item);
  const meta = [item.client, item.industry].filter(Boolean).join(" · ");

  return (
    <Modal label={item.title} onClose={onClose} className="detail">
      <div className="detail__media">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={item.id}
            className="detail__media-inner"
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {item.media_type === "video" && item.file_url ? (
              <video src={item.file_url} poster={item.thumb_url ?? undefined} controls playsInline autoPlay muted />
            ) : image ? (
              <FadeImage src={image} alt={item.title} loading="eager" />
            ) : (
              <div className="img-fallback" />
            )}
          </motion.div>
        </AnimatePresence>
        {list.length > 1 && index !== -1 && (
          <>
            <button className="detail__nav detail__nav--prev" onClick={() => step(-1)} aria-label="Previous project">
              <ChevronLeft size={22} />
            </button>
            <button className="detail__nav detail__nav--next" onClick={() => step(1)} aria-label="Next project">
              <ChevronRight size={22} />
            </button>
            <span className="detail__counter">
              {index + 1} / {list.length}
            </span>
          </>
        )}
      </div>

      <aside className="detail__info">
        <div className="detail__top">
          <span className="chip">{item.category}</span>
          <div className="detail__top-actions">
            <button
              className={`icon-btn${item.featured ? " is-on" : ""}`}
              onClick={() => onFeatured(item)}
              title={item.featured ? "Remove from featured" : "Mark as featured"}
              aria-pressed={item.featured}
            >
              <Star size={18} fill={item.featured ? "currentColor" : "none"} />
            </button>
            <button className="icon-btn" onClick={() => onEdit(item)} title="Edit project">
              <Pencil size={17} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close (Esc)">
              <X size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <h2 className="detail__title">{item.title}</h2>
            {meta && <p className="detail__meta">{meta}</p>}
            {item.description && <p className="detail__desc">{item.description}</p>}
            {item.tags.length > 0 && (
              <div className="tag-row">
                {item.tags.map((t) => (
                  <button key={t} className="tag" onClick={() => onTag(t)} title={`Find work tagged "${t}"`}>
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="detail__primary">
          <motion.button
            className={`btn btn--block${selected ? " btn--success" : ""}`}
            onClick={() => onToggleSelect(item.id)}
            whileTap={{ scale: 0.97 }}
          >
            {selected ? <Check size={18} /> : <Plus size={18} />}
            {selected ? "In share list" : "Add to share list"}
            <kbd>A</kbd>
          </motion.button>
          <div className="detail__grid">
            <button className="btn btn--ghost" onClick={copyLink}>
              <Link2 size={16} /> Copy link
            </button>
            <button className="btn btn--ghost" onClick={() => onPresent(item)}>
              <Presentation size={16} /> Present
            </button>
            {item.media_type === "image" && image && (
              <button className="btn btn--ghost" onClick={copyPic}>
                <ImageIcon size={16} /> Copy image
              </button>
            )}
            {item.file_url && (
              <button className="btn btn--ghost" onClick={() => downloadFile(item.file_url!, item.title)}>
                <Download size={16} /> Download
              </button>
            )}
            {item.link_url && (
              <a className="btn btn--ghost" href={item.link_url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Open live
              </a>
            )}
            <a className="btn btn--ghost" href={`/p/${item.id}`} target="_blank" rel="noreferrer">
              <Eye size={16} /> Client view
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <div className="related">
            <h3>More like this</h3>
            <div className="related__grid">
              {related.map((r) => (
                <button key={r.id} className="related__item" onClick={() => onOpen(r.id)}>
                  <FadeImage src={previewUrl(r) ?? undefined} alt="" />
                  <span>{r.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </Modal>
  );
}
