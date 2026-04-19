import Link from "next/link";
import { HelpCircle, Info } from "lucide-react";

const LogoSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 600 600"
    style={{ borderRadius: "8px", flexShrink: 0 }}
    aria-hidden
  >
    <rect width="600" height="600" rx="125" ry="125" fill="#0A0A0F" />
    <svg
      x="75"
      y="75"
      width="450"
      height="450"
      viewBox="0 0 24 24"
      fill="#0A0A0F"
      stroke="#2D6FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  </svg>
);

export default function Footer() {
  return (
    <>
      <footer className="mx-auto flex max-w-6xl flex-col gap-8 text-secondary">
        <div>
          <div className="flex items-center gap-2">
            <LogoSvg />
            <span className="font-bold text-primary">AlphaTradeX</span>
          </div>
          <p className="mt-2 text-sm">Votre analyste IA personnel sur les marchés</p>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          <a href="mailto:contact@alphatradex.ai" className="hover:text-primary">
            contact@alphatradex.ai
          </a>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="inline-flex items-center gap-1 hover:text-primary">
              <Info className="h-4 w-4" aria-hidden />
              À propos de nous
            </button>
            <button type="button" className="inline-flex items-center gap-1 hover:text-primary">
              <HelpCircle className="h-4 w-4" aria-hidden />
              Aide
            </button>
          </div>
        </div>
      </footer>
      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-2 text-xs text-secondary">
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
          <Link href="/legal/risques" className="hover:text-primary">
            Mentions de risque
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-sm text-secondary">
        © 2026 AlphaTradeX. Élaboré pour les traders sérieux.
      </p>
    </>
  );
}
