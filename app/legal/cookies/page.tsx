import Link from "next/link";

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">Politique de cookies</h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la
            visite d&apos;un site web. Il permet de mémoriser des informations relatives à votre navigation ou à votre
            compte, pendant une durée déterminée.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Qui est responsable ?</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Le site{" "}<strong className="text-primary">https://alphatradex.ai</strong>{" "}et le service{" "}
            <strong className="text-primary">AlphaTradeX</strong>{" "}(analyse IA d&apos;historiques de trades -{" "}
            <strong className="text-primary">non conseil en investissement</strong>,{" "}
            <strong className="text-primary">pas de gestion de fonds</strong>) sont édités depuis la{" "}
            <strong className="text-primary">France</strong>. Pour toute question relative aux cookies :{" "}
            <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
              contact@alphatradex.ai
            </a>
            .
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Types de cookies et traceurs utilisés</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>Selon les évolutions techniques du Site, peuvent être utilisés notamment :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-primary">Cookies strictement nécessaires</strong>{" "}: session, sécurité, équilibrage
                de charge, mémorisation du choix sur la bannière cookies lorsque applicable. Ces traceurs sont dispensés de
                consentement lorsqu&apos;ils sont indispensables à la fourniture du service expressément demandé par
                l&apos;utilisateur (lignes directrices ePrivacy / pratique CNIL).
              </li>
              <li>
                <strong className="text-primary">Cookies de mesure d&apos;audience</strong>{" "}: le cas échéant, sous réserve
                d&apos;anonymisation conforme aux recommandations de la CNIL ou du consentement préalable.
              </li>
              <li>
                <strong className="text-primary">Stockage local / technologies similaires</strong>{" "}: préférences d&apos;interface,
                jetons d&apos;authentification persistants lorsque vous choisissez « Se souvenir de moi » ou équivalent.
              </li>
              <li>
                <strong className="text-primary">Cookies tiers liés au paiement</strong>{" "}: lors du passage par{" "}
                <strong className="text-primary">Stripe</strong>, des cookies peuvent être déposés par Stripe pour la
                prévention de la fraude et l&apos;exécution du paiement ; nous vous invitons à consulter la politique cookies
                de Stripe.
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Consentement et bandeau cookies</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Lorsque des traceurs non exemptés sont utilisés, votre{" "}<strong className="text-primary">consentement</strong>{" "}
              est collecté via un bandeau ou un module dédié avant tout dépôt, conformément aux recommandations de la CNIL
              (refus aussi simple que l&apos;acceptation, information claire).
            </p>
            <p>
              Vous pouvez modifier vos préférences à tout moment via le lien ou le bouton « Cookies » lorsqu&apos;il est
              proposé sur le Site, ou en supprimant les cookies depuis les paramètres de votre navigateur.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Durée de conservation</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Chaque cookie a une durée de vie limitée (de la session à plusieurs mois maximum pour les préférences). Les
            durées précises sont précisées dans l&apos;outil de gestion du consentement lorsqu&apos;il est déployé.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Vos droits</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Outre le retrait du consentement, vous disposez des droits prévus par le RGPD et la loi « Informatique et
            Libertés » sur les données personnelles associées aux traceurs (accès, rectification, effacement, etc.) - voir{" "}
            notre{" "}
            <Link href="/legal/confidentialite" className="text-blue underline-offset-2 hover:underline">
              Politique de confidentialité
            </Link>
            . Réclamation possible auprès de la CNIL.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Hébergement et prestataires</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Le Site est hébergé sur{" "}<strong className="text-primary">Vercel</strong>. D&apos;autres sociétés (Stripe, OpenAI
            pour les fonctionnalités IA, outils d&apos;analytics) peuvent déposer ou lire des cookies depuis leurs domaines
            lorsque vous interagissez avec leurs composants intégrés.
          </p>
        </section>
      </div>
    </main>
  );
}
