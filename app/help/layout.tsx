import type { Metadata, ResolvingMetadata } from "next";

const title = "Aide - AlphaTradeX";
const description = "Plateformes compatibles et questions fréquentes.";

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

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
