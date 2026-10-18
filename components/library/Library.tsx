"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Presentation, Search, SearchX, Star, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Presenter from "@/components/Presenter";
import { useToast } from "@/components/Toast";
import WorkCard from "@/components/library/WorkCard";
import ItemModal from "@/components/library/ItemModal";
import ItemForm from "@/components/library/ItemForm";
import ShareTray from "@/components/library/ShareTray";
import { setFeatured } from "@/app/actions";
import { copyText, hasOpenLayer, isTypingTarget, useKeydown } from "@/lib/client-utils";
import { plural } from "@/lib/format";
import { CATEGORIES, type Item } from "@/lib/types";

export type Filters = { q: string; cat: string; industry: string; sort: Sort; featured: boolean; item: string };
type Sort = "featured" | "newest" | "az";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "az", label: "A to Z" },
];
const STORAGE_KEY = "tw-share-list";

export default function Library({ items: initialItems, initial }: { items: Item[]; initial: Filters }) {
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState(initial.q);
  const [cat, setCat] = useState(initial.cat);
  const [industry, setIndustry] = useState(initial.industry);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [featuredOnly, setFeaturedOnly] = useState(initial.featured);
  const [openId, setOpenId] = useState(initial.item);
  const [picked, setPicked] = useState<string[]>([]);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [presenting, setPresenting] = useState<{ items: Item[]; index: number; title: string } | null>(null);
  const query = useDeferredValue(q);

  useEffect(() => setItems(initialItems), [initialItems]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setPicked(saved.filter((id) => typeof id === "string"));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
  }, [picked]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const haystacks = useMemo(
    () =>
      new Map(
        items.map((i) => [
          i.id,
          [i.title, i.client, i.industry, i.description, i.category, ...i.tags, ...i.tags.map((t) => `#${t}`)]
            .join(" ")
            .toLowerCase(),
        ]),
      ),
    [items],
  );

  const industries = useMemo(
    () => [...new Set(items.map((i) => i.industry).filter((x): x is string => Boolean(x)))].sort(),
    [items],
  );
  const clients = useMemo(
    () => [...new Set(items.map((i) => i.client).filter((x): x is string => Boolean(x)))].sort(),
    [items],
  );

  const baseFiltered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(
      (i) =>
        (!industry || i.industry === industry) &&
        (!featuredOnly || i.featured) &&
        tokens.every((t) => haystacks.get(i.id)!.includes(t)),
    );
  }, [items, query, industry, featuredOnly, haystacks]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of baseFiltered) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    return m;
  }, [baseFiltered]);

  const shown = useMemo(() => {
    const list = cat === "All" ? baseFiltered : baseFiltered.filter((i) => i.category === cat);
    if (sort === "newest") return [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [baseFiltered, cat, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (cat !== "All") params.set("cat", cat);
    if (industry) params.set("industry", industry);
    if (sort !== "featured") params.set("sort", sort);
    if (featuredOnly) params.set("featured", "1");
    if (openId) params.set("item", openId);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }, [query, cat, industry, sort, featuredOnly, openId]);

  useKeydown((e) => {
    if (isTypingTarget(e.target) || hasOpenLayer()) return;
    if (e.key === "/" || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    }
  });

  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const toggleSelect = useCallback(
    (id: string) => {
      const has = pickedRef.current.includes(id);
      if (!has) toast(`Added "${byId.get(id)?.title}" to share list`);
      setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    },
    [byId, toast],
  );

  const copyLink = useCallback(
    async (item: Item) => {
      const ok = await copyText(`${location.origin}/p/${item.id}`);
      toast(ok ? `Link to "${item.title}" copied` : "Couldn't copy the link", ok ? "ok" : "error");
    },
    [toast],
  );

  const toggleFeatured = async (item: Item) => {
    const next = !item.featured;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, featured: next } : i)));
    try {
      await setFeatured(item.id, next);
      toast(next ? "Marked as featured" : "Removed from featured");
    } catch (e) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, featured: !next } : i)));
      toast((e as Error).message, "error");
    }
  };

  const clearFilters = () => {
    setQ("");
    setCat("All");
    setIndustry("");
    setFeaturedOnly(false);
  };

  const selection = picked.map((id) => byId.get(id)).filter((i): i is Item => Boolean(i));
  const openItem = openId ? byId.get(openId) : undefined;
  const filtersActive = Boolean(query.trim() || cat !== "All" || industry || featuredOnly);
  const featuredCount = items.filter((i) => i.featured).length;

  return (
    <>
      <AppHeader
        actions={
          <button className="btn btn--sm" onClick={() => setEditing("new")}>
            <Plus size={16} /> <span className="hide-sm">Add work</span>
          </button>
        }
      >
        <div className="search">
          <Search size={18} className="search__icon" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQ("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search by client, industry, style or tag…"
            aria-label="Search work"
          />
          {q ? (
            <button className="search__clear" onClick={() => setQ("")} aria-label="Clear search">
              <X size={16} />
            </button>
          ) : (
            <kbd className="search__kbd">/</kbd>
          )}
        </div>
      </AppHeader>

      <main className="page">
        <section className="intro">
          <div>
            <h1>Work library</h1>
            <p>
              {plural(items.length, "project")} across {CATEGORIES.length} categories. Pick your best matches, then
              share a link or present them live.
            </p>
          </div>
          {shown.length > 0 && (
            <button
              className="btn btn--ghost"
              onClick={() => setPresenting({ items: shown, index: 0, title: cat === "All" ? "Work library" : cat })}
            >
              <Presentation size={17} /> Present{" "}
              {shown.length === items.length ? "all" : plural(shown.length, "project")}
            </button>
          )}
        </section>

        <div className="toolbar">
          <div className="cats" role="tablist" aria-label="Categories">
            {["All", ...CATEGORIES].map((c) => {
              const n = c === "All" ? baseFiltered.length : (counts.get(c) ?? 0);
              const active = cat === c;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={active}
                  className={`cat${active ? " is-active" : ""}${n === 0 && !active ? " is-empty" : ""}`}
                  onClick={() => setCat(c)}
                >
                  {active && <motion.span layoutId="cat-pill" className="cat__pill" />}
                  <span className="cat__label">{c}</span>
                  <span className="cat__count">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="results-bar">
          <span>
            {filtersActive ? `${shown.length} of ${plural(items.length, "project")}` : plural(shown.length, "project")}
          </span>
          {filtersActive && (
            <button className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <div className="filters">
            <select
              className="select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              aria-label="Industry"
            >
              <option value="">All industries</option>
              {industries.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              className={`chip-toggle${featuredOnly ? " is-on" : ""}`}
              onClick={() => setFeaturedOnly((f) => !f)}
              aria-pressed={featuredOnly}
            >
              <Star size={14} fill={featuredOnly ? "currentColor" : "none"} /> Featured
              <span className="cat__count">{featuredCount}</span>
            </button>
          </div>
        </div>

        {shown.length === 0 ? (
          <motion.div className="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SearchX size={36} />
            <h2>{query ? `Nothing matches “${query}”` : "No work in this view yet"}</h2>
            <p>Try a client name, an industry like “restaurant”, or a style like “minimal”.</p>
            <div className="empty__actions">
              <button className="btn btn--ghost" onClick={clearFilters}>
                Clear filters
              </button>
              <button className="btn" onClick={() => setEditing("new")}>
                <Plus size={16} /> Add work
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div className="grid" layout>
            <AnimatePresence mode="popLayout">
              {shown.map((item, i) => (
                <WorkCard
                  key={item.id}
                  item={item}
                  index={i}
                  selected={picked.includes(item.id)}
                  onOpen={setOpenId}
                  onToggleSelect={toggleSelect}
                  onCopyLink={copyLink}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <ShareTray
        items={selection}
        onReorder={setPicked}
        onRemove={(id) => setPicked((p) => p.filter((x) => x !== id))}
        onClear={() => setPicked([])}
        onPresent={() => setPresenting({ items: selection, index: 0, title: "Share list" })}
      />

      <AnimatePresence>
        {openItem && (
          <ItemModal
            key="detail"
            item={openItem}
            list={shown.some((i) => i.id === openItem.id) ? shown : items}
            all={items}
            selected={picked.includes(openItem.id)}
            paused={Boolean(presenting || editing)}
            onClose={() => setOpenId("")}
            onOpen={setOpenId}
            onToggleSelect={toggleSelect}
            onPresent={(it) => {
              const list = shown.some((i) => i.id === it.id) ? shown : [it];
              setPresenting({ items: list, index: list.findIndex((i) => i.id === it.id), title: it.title });
            }}
            onEdit={(it) => setEditing(it)}
            onFeatured={toggleFeatured}
            onTag={(t) => {
              setOpenId("");
              setCat("All");
              setQ(`#${t}`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <ItemForm
            key="form"
            item={editing === "new" ? null : editing}
            industries={industries}
            clients={clients}
            onClose={() => setEditing(null)}
            onSaved={(id) => {
              setEditing(null);
              setOpenId(id);
            }}
            onDeleted={(id) => {
              setEditing(null);
              setOpenId("");
              setPicked((p) => p.filter((x) => x !== id));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {presenting && presenting.items.length > 0 && (
          <Presenter
            key="presenter"
            items={presenting.items}
            startIndex={Math.max(0, presenting.index)}
            title={presenting.title}
            onClose={() => setPresenting(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
