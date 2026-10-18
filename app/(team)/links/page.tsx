import type { Metadata } from "next";
import LinksList from "@/components/links/LinksList";
import { listCollections } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Share links" };

export default async function LinksPage() {
  return <LinksList links={await listCollections()} />;
}
