"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE, authEnabled, sessionToken } from "@/lib/auth";
import { requireTeam } from "@/lib/session";
import * as db from "@/lib/queries";
import { CATEGORIES, MEDIA_TYPES, type ItemInput, type MediaType } from "@/lib/types";

export async function login(_prev: { error?: string } | undefined, form: FormData) {
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  if (!authEnabled() || password !== process.env.TEAM_PASSWORD) {
    return { error: "That password isn't right. Ask your team lead for the current one." };
  }
  (await cookies()).set(AUTH_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

export async function createShareLink(input: { title: string; clientName: string; note: string; itemIds: string[] }) {
  await requireTeam();
  const slug = await db.createCollection({
    title: clean(input.title, 120) || "Selected work",
    clientName: clean(input.clientName, 120),
    note: clean(input.note, 1000),
    itemIds: input.itemIds.slice(0, 100),
  });
  revalidatePath("/links");
  return slug;
}

export async function deleteShareLink(id: string) {
  await requireTeam();
  await db.deleteCollection(id);
  revalidatePath("/links");
}

export async function saveItem(id: string | null, raw: ItemInput) {
  await requireTeam();
  const input = validateItem(raw);
  const savedId = id ? (await db.updateItem(id, input), id) : await db.createItem(input);
  revalidatePath("/", "layout");
  return savedId;
}

export async function setFeatured(id: string, featured: boolean) {
  await requireTeam();
  await db.setItemFeatured(id, featured);
  revalidatePath("/", "layout");
}

export async function removeItem(id: string) {
  await requireTeam();
  await db.deleteItem(id);
  revalidatePath("/", "layout");
}

function clean(value: unknown, max: number): string | null {
  const s = typeof value === "string" ? value.trim().slice(0, max) : "";
  return s || null;
}

function cleanUrl(value: unknown, label: string): string | null {
  const s = clean(value, 2000);
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
  } catch {}
  throw new Error(`${label} must be a full web address starting with https://`);
}

function validateItem(raw: ItemInput): ItemInput {
  const title = clean(raw.title, 120);
  if (!title) throw new Error("Give the project a title.");
  if (!(CATEGORIES as readonly string[]).includes(raw.category)) throw new Error("Pick a category.");
  const media_type: MediaType = (MEDIA_TYPES as readonly string[]).includes(raw.media_type) ? raw.media_type : "image";

  const item: ItemInput = {
    title,
    category: raw.category,
    industry: clean(raw.industry, 80),
    client: clean(raw.client, 120),
    description: clean(raw.description, 2000),
    media_type,
    file_url: cleanUrl(raw.file_url, media_type === "video" ? "Video URL" : "Image URL"),
    link_url: cleanUrl(raw.link_url, "Project link"),
    thumb_url: cleanUrl(raw.thumb_url, "Thumbnail URL"),
    tags: [...new Set((raw.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12),
    featured: Boolean(raw.featured),
  };

  if (media_type !== "link" && !item.file_url) {
    throw new Error(media_type === "video" ? "Add the video file URL." : "Add the image URL.");
  }
  if (media_type === "link" && !item.link_url) throw new Error("Add the project link.");
  return item;
}
