"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Globe, Image as ImageIcon, Loader2, Play, Star, Trash2, X } from "lucide-react";
import Modal from "@/components/Modal";
import FadeImage from "@/components/FadeImage";
import { useToast } from "@/components/Toast";
import { removeItem, saveItem } from "@/app/actions";
import { CATEGORIES, previewUrl, type Item, type ItemInput, type MediaType } from "@/lib/types";

const MEDIA: { value: MediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Play },
  { value: "link", label: "Live link", icon: Globe },
];

const blank = (): ItemInput => ({
  title: "",
  category: CATEGORIES[0],
  industry: "",
  client: "",
  description: "",
  media_type: "image",
  file_url: "",
  link_url: "",
  thumb_url: "",
  tags: [],
  featured: false,
});

type Props = {
  item: Item | null;
  industries: string[];
  clients: string[];
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted: (id: string) => void;
};

export default function ItemForm({ item, industries, clients, onClose, onSaved, onDeleted }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<ItemInput>(() => (item ? { ...item } : blank()));
  const [tagsText, setTagsText] = useState(() => (item?.tags ?? []).join(", "));
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, start] = useTransition();
  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      try {
        const tags = tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const id = await saveItem(item?.id ?? null, { ...form, tags });
        toast(item ? "Changes saved" : "Project added to the library");
        onSaved(id);
      } catch (err) {
        setError((err as Error).message || "Couldn't save. Try again.");
      }
    });
  };

  const destroy = () =>
    start(async () => {
      try {
        await removeItem(item!.id);
        toast("Project deleted");
        onDeleted(item!.id);
      } catch (err) {
        setError((err as Error).message);
      }
    });

  const preview = previewUrl({ ...form, thumb_url: form.thumb_url || null, file_url: form.file_url || null });

  return (
    <Modal label={item ? "Edit project" : "Add project"} onClose={onClose} className="form-modal">
      <form onSubmit={submit} className="item-form">
        <header className="item-form__head">
          <div>
            <h2>{item ? "Edit project" : "Add work to the library"}</h2>
            <p>Paste links to images or videos hosted anywhere (Drive, Dropbox, Behance, CDN).</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="item-form__body">
          <div className="item-form__fields">
            <label className="field field--wide">
              <span>Title *</span>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                maxLength={120}
                autoFocus
              />
            </label>
            <label className="field">
              <span>Category *</span>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Industry</span>
              <input
                value={form.industry ?? ""}
                onChange={(e) => set("industry", e.target.value)}
                list="industry-options"
                placeholder="e.g. Restaurant"
              />
              <datalist id="industry-options">
                {industries.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </label>
            <label className="field field--wide">
              <span>Client</span>
              <input
                value={form.client ?? ""}
                onChange={(e) => set("client", e.target.value)}
                list="client-options"
                placeholder="e.g. Kopi Kita Roasters"
              />
              <datalist id="client-options">
                {clients.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="field field--wide">
              <span>Description</span>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="What we did and the result. Sales will read this to clients."
              />
            </label>

            <div className="field field--wide">
              <span>Media type</span>
              <div className="segmented" role="radiogroup">
                {MEDIA.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    role="radio"
                    aria-checked={form.media_type === value}
                    className={`segmented__opt${form.media_type === value ? " is-active" : ""}`}
                    onClick={() => set("media_type", value)}
                  >
                    {form.media_type === value && <motion.span layoutId="media-seg" className="segmented__pill" />}
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {form.media_type !== "link" && (
              <label className="field field--wide">
                <span>{form.media_type === "video" ? "Video file URL *" : "Image URL *"}</span>
                <input
                  type="url"
                  value={form.file_url ?? ""}
                  onChange={(e) => set("file_url", e.target.value)}
                  placeholder="https://…"
                />
              </label>
            )}
            <label className="field field--wide">
              <span>{form.media_type === "link" ? "Project link *" : "Project link"}</span>
              <input
                type="url"
                value={form.link_url ?? ""}
                onChange={(e) => set("link_url", e.target.value)}
                placeholder="Live site, Behance, Figma prototype…"
              />
            </label>
            <label className="field field--wide">
              <span>
                Thumbnail URL {form.media_type === "image" && <em>(optional, smaller version for faster grids)</em>}
              </span>
              <input
                type="url"
                value={form.thumb_url ?? ""}
                onChange={(e) => set("thumb_url", e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="field field--wide">
              <span>Tags</span>
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="minimal, packaging, dark-mode"
              />
            </label>
          </div>

          <div className="item-form__side">
            <div className="item-form__preview">
              {preview ? <FadeImage key={preview} src={preview} alt="Preview" /> : <span>Preview appears here</span>}
            </div>
            <label className={`toggle${form.featured ? " is-on" : ""}`}>
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              <span className="toggle__track">
                <motion.span
                  className="toggle__thumb"
                  layout
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                />
              </span>
              <Star size={15} /> Featured work
            </label>
            <p className="muted small">Featured projects show first so sales reach for your best work.</p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="form-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <footer className="item-form__foot">
          {item &&
            (confirmDelete ? (
              <div className="confirm">
                <span>Delete this project for everyone?</span>
                <button type="button" className="btn btn--danger btn--sm" onClick={destroy} disabled={busy}>
                  Yes, delete
                </button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn--ghost btn--danger-text" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Delete
              </button>
            ))}
          <div className="item-form__spacer" />
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy && <Loader2 size={16} className="spin" />}
            {item ? "Save changes" : "Add project"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
