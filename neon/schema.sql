-- Applied by `npm run db:setup`. Safe to re-run: every statement is idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  industry text,
  description text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'link')),
  file_url text,
  link_url text,
  thumb_url text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE items ADD COLUMN IF NOT EXISTS client text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  title text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS views int NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id uuid NOT NULL REFERENCES collections ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, item_id)
);

CREATE INDEX IF NOT EXISTS items_created_at_idx ON items (created_at DESC);
CREATE INDEX IF NOT EXISTS collection_items_item_idx ON collection_items (item_id);
CREATE INDEX IF NOT EXISTS collections_created_at_idx ON collections (created_at DESC);
