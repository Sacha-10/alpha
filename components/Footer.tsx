import Link from "next/link";
import { HelpCircle, Info } from "lucide-react";
import LogoSvg from "@/components/LogoSvg";

export default function Footer() {
  return (
    <>
      <footer className="mx-auto flex max-w-[1200px] flex-col gap-8 text-secondary">
        <div>
          <div className="flex items-center gap-2">
            <LogoSvg />
            <span className="font-bold text-primary">AlphaTradeX</span>
          </div>
          <p className="mt-2 text-sm">Votre analyste IA sur les marchés</p>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          <a href="mailto:contact@alphatradex.ai" className="hover:text-primary">
            contact@alphatradex.ai
          </a>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="inline-flex items-center gap-1 hover:text-primary">
              <Info className="h-4 w-4" aria-hidden />
              À propos
            </Link>
            <Link href="/help" className="inline-flex items-center gap-1 hover:text-primary">
              <HelpCircle className="h-4 w-4" aria-hidden />
              Aide
            </Link>
          </div>
        </div>
      </footer>
      <div className="mx-auto mt-6 flex max-w-[1200px] flex-col gap-2 text-xs text-secondary">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/legal/mentions-legales" className="hover:text-primary">
            Mentions légales
          </Link>
          <Link href="/legal/cgu" className="hover:text-primary">
            CGU
          </Link>
          <Link href="/legal/confidentialite" className="hover:text-primary">
            Politique de confidentialité
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/legal/cookies" className="hover:text-primary">
            Politique de cookies
          </Link>
          <Link href="/legal/cgv" className="hover:text-primary">
            CGV
          </Link>
          <Link href="/legal/risque" className="hover:text-primary">
            Mentions de risque
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-[1200px] text-sm text-secondary">
        © 2026 AlphaTradeX. Élaboré pour les traders sérieux.
      </p>
    </>
  );
}
