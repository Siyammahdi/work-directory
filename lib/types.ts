export const CATEGORIES = [
  "Logo & Branding",
  "UI/UX Design",
  "Web Design",
  "Mobile App",
  "Menu Design",
  "Video",
  "Marketing",
] as const;

export const MEDIA_TYPES = ["image", "video", "link"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export type Item = {
  id: string;
  title: string;
  category: string;
  industry: string | null;
  client: string | null;
  description: string | null;
  media_type: MediaType;
  file_url: string | null;
  link_url: string | null;
  thumb_url: string | null;
  tags: string[];
  featured: boolean;
  created_at: string;
};

export type ItemInput = Omit<Item, "id" | "created_at">;

export type CollectionSummary = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  note: string | null;
  views: number;
  last_viewed_at: string | null;
  created_at: string;
  item_count: number;
  previews: string[];
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  note: string | null;
  items: Item[];
};

export const previewUrl = (i: Pick<Item, "thumb_url" | "file_url" | "media_type">) =>
  i.thumb_url || (i.media_type === "image" ? i.file_url : null);

export const fullImageUrl = (i: Item) => (i.media_type === "image" && i.file_url) || previewUrl(i);
