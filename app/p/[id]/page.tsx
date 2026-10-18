import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareView from "@/components/ShareView";
import { getItemById } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
const load = cache((id: string) => getItemById(id));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await load((await params).id);
  if (!item) return { title: "Project not found" };
  return { title: item.title, description: item.description ?? undefined, robots: { index: false } };
}

export default async function Project({ params }: { params: Params }) {
  const item = await load((await params).id);
  if (!item) notFound();
  return <ShareView title={item.title} clientName={null} items={[item]} />;
}
