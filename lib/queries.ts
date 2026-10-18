import "server-only";
import { getSql } from "@/lib/db";
import type { Collection, CollectionSummary, Item, ItemInput } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

const ITEM_COLUMNS = `id, title, category, industry, client, description, media_type,
  file_url, link_url, thumb_url, tags, featured, created_at`;

export async function listItems(): Promise<Item[]> {
  const rows = await getSql().query(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY featured DESC, created_at DESC`);
  return rows as Item[];
}

export async function getItemById(id: string): Promise<Item | null> {
  if (!isUuid(id)) return null;
  const rows = await getSql().query(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = $1`, [id]);
  return (rows[0] as Item | undefined) ?? null;
}

export async function createItem(input: ItemInput): Promise<string> {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO items (title, category, industry, client, description, media_type,
                       file_url, link_url, thumb_url, tags, featured)
    VALUES (${input.title}, ${input.category}, ${input.industry}, ${input.client}, ${input.description},
            ${input.media_type}, ${input.file_url}, ${input.link_url}, ${input.thumb_url},
            ${input.tags}, ${input.featured})
    RETURNING id
  `;
  return row.id as string;
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
  if (!isUuid(id)) throw new Error("Unknown project.");
  await getSql()`
    UPDATE items SET
      title = ${input.title}, category = ${input.category}, industry = ${input.industry},
      client = ${input.client}, description = ${input.description}, media_type = ${input.media_type},
      file_url = ${input.file_url}, link_url = ${input.link_url}, thumb_url = ${input.thumb_url},
      tags = ${input.tags}, featured = ${input.featured}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function setItemFeatured(id: string, featured: boolean): Promise<void> {
  if (!isUuid(id)) throw new Error("Unknown project.");
  await getSql()`UPDATE items SET featured = ${featured}, updated_at = now() WHERE id = ${id}`;
}

export async function deleteItem(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error("Unknown project.");
  await getSql()`DELETE FROM items WHERE id = ${id}`;
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const sql = getSql();
  const [collection] = await sql`
    SELECT id, slug, title, client_name, note FROM collections WHERE slug = ${slug} LIMIT 1
  `;
  if (!collection) return null;
  const items = await sql.query(
    `SELECT ${ITEM_COLUMNS.replace(/(\w+)/g, "i.$1")}
     FROM collection_items ci JOIN items i ON i.id = ci.item_id
     WHERE ci.collection_id = $1 ORDER BY ci.position`,
    [collection.id],
  );
  return { ...(collection as Omit<Collection, "items">), items: items as Item[] };
}

export async function recordCollectionView(id: string): Promise<void> {
  await getSql()`UPDATE collections SET views = views + 1, last_viewed_at = now() WHERE id = ${id}`;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const rows = await getSql()`
    SELECT c.id, c.slug, c.title, c.client_name, c.note, c.views, c.last_viewed_at, c.created_at,
           count(i.id)::int AS item_count,
           coalesce(
             (array_agg(coalesce(i.thumb_url, CASE WHEN i.media_type = 'image' THEN i.file_url END)
                        ORDER BY ci.position)
              FILTER (WHERE coalesce(i.thumb_url, CASE WHEN i.media_type = 'image' THEN i.file_url END) IS NOT NULL))[1:4],
             '{}'
           ) AS previews
    FROM collections c
    LEFT JOIN collection_items ci ON ci.collection_id = c.id
    LEFT JOIN items i ON i.id = ci.item_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  return rows as CollectionSummary[];
}

export async function createCollection(input: {
  title: string;
  clientName: string | null;
  note: string | null;
  itemIds: string[];
}): Promise<string> {
  const ids = [...new Set(input.itemIds.filter(isUuid))];
  if (ids.length === 0) throw new Error("Pick at least one project to share.");
  const [row] = await getSql()`
    WITH c AS (
      INSERT INTO collections (title, client_name, note)
      VALUES (${input.title}, ${input.clientName}, ${input.note})
      RETURNING id, slug
    ), linked AS (
      INSERT INTO collection_items (collection_id, item_id, position)
      SELECT c.id, x.id, x.ord - 1
      FROM c, unnest(${ids}::uuid[]) WITH ORDINALITY AS x(id, ord)
      WHERE EXISTS (SELECT 1 FROM items WHERE items.id = x.id)
    )
    SELECT slug FROM c
  `;
  return row.slug as string;
}

export async function deleteCollection(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error("Unknown link.");
  await getSql()`DELETE FROM collections WHERE id = ${id}`;
}
