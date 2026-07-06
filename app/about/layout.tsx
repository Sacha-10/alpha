import type { Metadata, ResolvingMetadata } from "next";

const title = "À propos - AlphaTradeX";
const description = "Genèse du service et vision du fondateur.";

export async function generateMetadata(
  _props: object,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { openGraph, twitter } = await parent;
  return {
    title,
    description,
    openGraph: { ...openGraph, title, description },
    twitter: { ...twitter, title, description },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
