import type { Metadata, ResolvingMetadata } from "next";

const title = "Prix - AlphaTradeX";
const description = "Accès anticipé à vie. Plans Pro, Premium, Élite.";

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

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
