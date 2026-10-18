"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { Check, ChevronDown, Copy, ExternalLink, GripVertical, Loader2, Presentation, Send, X } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import { useToast } from "@/components/Toast";
import { createShareLink } from "@/app/actions";
import { copyText, useEscape } from "@/lib/client-utils";
import { plural } from "@/lib/format";
import { previewUrl, type Item } from "@/lib/types";

type Props = {
  items: Item[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPresent: () => void;
};

export default function ShareTray({ items, onReorder, onRemove, onClear, onPresent }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, start] = useTransition();

  useEscape(() => (link ? finish() : setOpen(false)), open || Boolean(link));

  const create = () =>
    start(async () => {
      try {
        const slug = await createShareLink({ title, clientName: client, note, itemIds: items.map((i) => i.id) });
        const url = `${location.origin}/s/${slug}`;
        setLink(url);
        const ok = await copyText(url);
        setCopied(ok);
        toast(ok ? "Share link created and copied" : "Share link created");
      } catch (e) {
        toast((e as Error).message || "Couldn't create the link. Try again.", "error");
      }
    });

  const finish = () => {
    setLink("");
    setOpen(false);
    setTitle("");
    setClient("");
    setNote("");
    onClear();
  };

  const visible = items.length > 0 || Boolean(link);

  return (
    <div className="tray-dock">
      <AnimatePresence>
        {visible && (
          <motion.div
            className={`tray${open || link ? " is-open" : ""}`}
            layout
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            style={{ borderRadius: 20 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {link ? (
                <motion.div key="done" className="tray__done" {...fade}>
                  <motion.div
                    className="tray__check"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
                  >
                    <Check size={26} strokeWidth={3} />
                  </motion.div>
                  <h3>Your link is ready</h3>
                  <p>
                    {copied ? "It's already on your clipboard. Paste" : "Copy it and paste"} it into WhatsApp, email or
                    LinkedIn.
                  </p>
                  <div className="tray__link">
                    <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Share link" />
                    <button
                      className="btn btn--sm"
                      onClick={async () => toast((await copyText(link)) ? "Link copied" : "Couldn't copy", "ok")}
                    >
                      <Copy size={15} /> Copy
                    </button>
                  </div>
                  <div className="tray__row">
                    <a className="btn btn--ghost-light btn--sm" href={link} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} /> Preview as client
                    </a>
                    <button className="btn btn--ghost-light btn--sm" onClick={finish}>
                      Done
                    </button>
                  </div>
                </motion.div>
              ) : open ? (
                <motion.div key="compose" className="tray__compose" {...fade}>
                  <div className="tray__head">
                    <h3>Create a share link</h3>
                    <button className="icon-btn icon-btn--on-dark" onClick={() => setOpen(false)} aria-label="Collapse">
                      <ChevronDown size={20} />
                    </button>
                  </div>
                  <div className="tray__fields">
                    <label className="field field--dark">
                      <span>Link title</span>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Branding work for Café Mondo"
                        autoFocus
                        maxLength={120}
                      />
                    </label>
                    <label className="field field--dark">
                      <span>Client name</span>
                      <input
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        placeholder="Optional"
                        maxLength={120}
                      />
                    </label>
                    <label className="field field--dark field--wide">
                      <span>Personal note</span>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Hi! Here are a few projects similar to what we discussed…"
                        rows={2}
                        maxLength={1000}
                      />
                    </label>
                  </div>
                  <p className="tray__hint">
                    {plural(items.length, "project")} · drag to set the order your client sees
                  </p>
                  <Reorder.Group axis="y" values={items.map((i) => i.id)} onReorder={onReorder} className="tray__list">
                    {items.map((item) => (
                      <TrayRow key={item.id} item={item} onRemove={onRemove} />
                    ))}
                  </Reorder.Group>
                  <div className="tray__row tray__row--end">
                    <button className="btn btn--ghost-light btn--sm" onClick={onPresent}>
                      <Presentation size={15} /> Present
                    </button>
                    <motion.button className="btn" onClick={create} disabled={busy} whileTap={{ scale: 0.97 }}>
                      {busy ? <Loader2 size={17} className="spin" /> : <Send size={16} />}
                      {busy ? "Creating…" : "Create link"}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="bar" className="tray__bar" {...fade}>
                  <div className="tray__stack">
                    <AnimatePresence initial={false}>
                      {items.slice(-4).map((item) => (
                        <motion.span
                          key={item.id}
                          className="tray__avatar"
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <FadeImage src={previewUrl(item) ?? undefined} alt="" />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  <motion.strong key={items.length} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    {plural(items.length, "project")}
                  </motion.strong>
                  <div className="tray__actions">
                    <button className="btn btn--ghost-light btn--sm" onClick={onClear}>
                      Clear
                    </button>
                    <button className="icon-btn icon-btn--on-dark" onClick={onPresent} title="Present selection">
                      <Presentation size={18} />
                    </button>
                    <motion.button className="btn btn--sm" onClick={() => setOpen(true)} whileTap={{ scale: 0.96 }}>
                      <Send size={15} /> Share
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

function TrayRow({ item, onRemove }: { item: Item; onRemove: (id: string) => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item.id}
      className="tray__item"
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 30px rgba(0,0,0,.35)" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <button className="tray__grip" onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder">
        <GripVertical size={16} />
      </button>
      <FadeImage className="tray__thumb" src={previewUrl(item) ?? undefined} alt="" />
      <span className="tray__name">
        {item.title}
        <small>{item.category}</small>
      </span>
      <button
        className="icon-btn icon-btn--on-dark"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.title}`}
      >
        <X size={16} />
      </button>
    </Reorder.Item>
  );
}
