import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import ShareView from "@/components/ShareView";
import { getCollectionBySlug, recordCollectionView } from "@/lib/queries";
import { isTeamMember } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
const load = cache((slug: string) => getCollectionBySlug(slug));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const collection = await load((await params).slug);
  if (!collection) return { title: "Link not found" };
  return {
    title: collection.title,
    description:
      collection.note ??
      `Selected work by Techwitpro${collection.client_name ? ` for ${collection.client_name}` : ""}.`,
    robots: { index: false },
  };
}

export default async function Collection({ params }: { params: Params }) {
  const collection = await load((await params).slug);
  if (!collection) notFound();

  if (!(await isTeamMember())) after(() => recordCollectionView(collection.id));

  return (
    <ShareView
      title={collection.title}
      clientName={collection.client_name}
      note={collection.note}
      items={collection.items}
    />
  );
}
