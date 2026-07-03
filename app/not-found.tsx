import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-7xl font-bold text-primary">404</p>
      <p className="mt-6 text-base text-secondary">Cette page n&apos;existe pas.</p>
      <Link href="/" className="btn-primary mt-10 inline-flex items-center gap-2">
        <ArrowLeft size={16} aria-hidden />
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
