"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Play, Presentation } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import Presenter from "@/components/Presenter";
import { plural } from "@/lib/format";
import { fullImageUrl, previewUrl, type Item } from "@/lib/types";

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 160, damping: 22 } },
} as const;

export default function ShareView({
  title,
  clientName,
  note,
  items,
}: {
  title: string;
  clientName?: string | null;
  note?: string | null;
  items: Item[];
}) {
  const [present, setPresent] = useState<number | null>(null);
  const single = items.length === 1;
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="share">
      <header className="share__bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Techwitpro" width={140} height={17} />
        {items.length > 0 && (
          <button className="btn btn--light btn--sm" onClick={() => setPresent(0)}>
            <Presentation size={16} /> Present
          </button>
        )}
      </header>

      <motion.section
        className="share__hero"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p className="eyebrow" variants={rise}>
          {clientName ? `Prepared for ${clientName}` : single ? items[0].category : "Selected work"}
        </motion.p>
        <motion.h1 variants={rise}>{title}</motion.h1>
        {!single && (
          <motion.p className="share__meta" variants={rise}>
            {plural(items.length, "project")} · {categories.join(", ")}
          </motion.p>
        )}
        {note && (
          <motion.blockquote className="share__note" variants={rise}>
            {note}
          </motion.blockquote>
        )}
      </motion.section>

      {single ? (
        <SingleProject item={items[0]} onPresent={() => setPresent(0)} />
      ) : (
        <section className="share__grid">
          {items.map((item, i) => (
            <motion.article
              key={item.id}
              className={`work${i === 0 && items.length % 2 === 1 ? " work--wide" : ""}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", stiffness: 140, damping: 22, delay: (i % 2) * 0.08 }}
            >
              <button className="work__media" onClick={() => setPresent(i)} aria-label={`View ${item.title}`}>
                <FadeImage src={previewUrl(item) ?? undefined} alt={item.title} />
                {item.media_type === "video" && (
                  <span className="work__play">
                    <Play size={22} fill="currentColor" />
                  </span>
                )}
              </button>
              <div className="work__body">
                <p className="work__meta">{[item.category, item.industry].filter(Boolean).join(" · ")}</p>
                <h2>{item.title}</h2>
                {item.description && <p className="work__desc">{item.description}</p>}
                {item.link_url && (
                  <a className="link-arrow" href={item.link_url} target="_blank" rel="noreferrer">
                    View live project <ArrowUpRight size={16} />
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </section>
      )}

      <footer className="share__foot">
        <h2>Like what you see?</h2>
        <p>Reply to the message this link came with and we&apos;ll put together ideas for your project.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Techwitpro" width={120} height={15} className="share__foot-logo" />
      </footer>

      <AnimatePresence>
        {present !== null && (
          <Presenter items={items} startIndex={present} title={title} onClose={() => setPresent(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SingleProject({ item, onPresent }: { item: Item; onPresent: () => void }) {
  const image = fullImageUrl(item);
  return (
    <motion.section
      className="single"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.15 }}
    >
      <div className="single__media">
        {item.media_type === "video" && item.file_url ? (
          <video src={item.file_url} poster={item.thumb_url ?? undefined} controls playsInline />
        ) : (
          <button onClick={onPresent} aria-label="View full screen">
            <FadeImage src={image ?? undefined} alt={item.title} loading="eager" />
          </button>
        )}
      </div>
      <div className="single__body">
        <p className="work__meta">{[item.category, item.industry].filter(Boolean).join(" · ")}</p>
        {item.description && <p className="single__desc">{item.description}</p>}
        {item.tags.length > 0 && (
          <div className="tag-row">
            {item.tags.map((t) => (
              <span key={t} className="tag tag--static">
                #{t}
              </span>
            ))}
          </div>
        )}
        {item.link_url && (
          <a className="btn" href={item.link_url} target="_blank" rel="noreferrer">
            View live project <ArrowUpRight size={16} />
          </a>
        )}
      </div>
    </motion.section>
  );
}
