"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Copy, Eye, EyeOff, ExternalLink, Link2, Search, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FadeImage from "@/components/FadeImage";
import { useToast } from "@/components/Toast";
import { deleteShareLink } from "@/app/actions";
import { copyText } from "@/lib/client-utils";
import { formatDate, plural, timeAgo } from "@/lib/format";
import type { CollectionSummary } from "@/lib/types";

export default function LinksList({ links: initial }: { links: CollectionSummary[] }) {
  const toast = useToast();
  const [links, setLinks] = useState(initial);
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState("");
  const [, start] = useTransition();
  useEffect(() => setLinks(initial), [initial]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? links.filter((l) => `${l.title} ${l.client_name ?? ""} ${l.note ?? ""}`.toLowerCase().includes(t))
      : links;
  }, [links, q]);

  const opened = links.filter((l) => l.views > 0).length;
  const totalViews = links.reduce((s, l) => s + l.views, 0);

  const copy = async (slug: string) =>
    toast((await copyText(`${location.origin}/s/${slug}`)) ? "Link copied" : "Couldn't copy", "ok");

  const remove = (id: string) =>
    start(async () => {
      const before = links;
      setLinks((l) => l.filter((x) => x.id !== id));
      setConfirm("");
      try {
        await deleteShareLink(id);
        toast("Link deleted. Clients can no longer open it");
      } catch (e) {
        setLinks(before);
        toast((e as Error).message, "error");
      }
    });

  return (
    <>
      <AppHeader>
        <div className="search">
          <Search size={18} className="search__icon" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search links by title or client…"
            aria-label="Search share links"
          />
        </div>
      </AppHeader>
      <main className="page">
        <section className="intro">
          <div>
            <h1>Share links</h1>
            <p>See which clients opened the work you sent, so you know when to follow up.</p>
          </div>
        </section>

        <div className="stats">
          <Stat label="Links sent" value={links.length} />
          <Stat label="Opened by clients" value={opened} />
          <Stat label="Total views" value={totalViews} />
        </div>

        {shown.length === 0 ? (
          <div className="empty">
            <Link2 size={36} />
            <h2>{links.length ? "No links match your search" : "No share links yet"}</h2>
            <p>Pick projects in the library and press Share to create your first client link.</p>
            <div className="empty__actions">
              <Link className="btn" href="/">
                Go to library
              </Link>
            </div>
          </div>
        ) : (
          <motion.ul className="links" layout>
            <AnimatePresence initial={false}>
              {shown.map((l, i) => (
                <motion.li
                  key={l.id}
                  className="link-card"
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                  exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                >
                  <div className="link-card__mosaic" data-count={Math.min(l.previews.length, 4)}>
                    {l.previews.slice(0, 4).map((src, j) => (
                      <FadeImage key={j} src={src} alt="" />
                    ))}
                  </div>
                  <div className="link-card__body">
                    <h3>{l.title}</h3>
                    <p className="link-card__meta">
                      {l.client_name && <strong>{l.client_name}</strong>}
                      <span>{plural(l.item_count, "project")}</span>
                      <span>Sent {formatDate(l.created_at)}</span>
                    </p>
                    {l.views > 0 && l.last_viewed_at ? (
                      <p className="status status--seen" suppressHydrationWarning>
                        <Eye size={15} /> Opened {plural(l.views, "time")} · last {timeAgo(l.last_viewed_at)}
                      </p>
                    ) : (
                      <p className="status">
                        <EyeOff size={15} /> Not opened yet
                      </p>
                    )}
                  </div>
                  <div className="link-card__actions">
                    {confirm === l.id ? (
                      <div className="confirm">
                        <span>Delete link?</span>
                        <button className="btn btn--danger btn--sm" onClick={() => remove(l.id)}>
                          Delete
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => setConfirm("")}>
                          Keep
                        </button>
                      </div>
                    ) : (
                      <>
                        <button className="btn btn--sm" onClick={() => copy(l.slug)}>
                          <Copy size={15} /> Copy
                        </button>
                        <a
                          className="icon-btn"
                          href={`/s/${l.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Open as client"
                        >
                          <ExternalLink size={17} />
                        </a>
                        <button
                          className="icon-btn icon-btn--danger"
                          onClick={() => setConfirm(l.id)}
                          title="Delete link"
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <motion.strong key={value} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {value}
      </motion.strong>
      <span>{label}</span>
    </div>
  );
}
