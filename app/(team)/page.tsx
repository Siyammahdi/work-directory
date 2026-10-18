import Library, { type Filters } from "@/components/library/Library";
import { listItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const [items, params] = await Promise.all([listItems(), searchParams]);
  const get = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const sort = get("sort");
  const initial: Filters = {
    q: get("q"),
    cat: get("cat") || "All",
    industry: get("industry"),
    sort: sort === "newest" || sort === "az" ? sort : "featured",
    featured: get("featured") === "1",
    item: get("item"),
  };
  return <Library items={items} initial={initial} />;
}
