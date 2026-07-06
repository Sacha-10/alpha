import type { Metadata, ResolvingMetadata } from "next";

const title = "Analyse gratuite - AlphaTradeX";
const description = "Testez l'analyste IA sur un compte de trading. Sans inscription, sans carte.";

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

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
