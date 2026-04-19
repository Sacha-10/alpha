import Link from "next/link";

export default function RisquesPage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">Mentions de risque</h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Nature du service AlphaTradeX</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              <strong className="text-primary">AlphaTradeX</strong>{" "}est un service d&apos;
              <strong className="text-primary">analyse par intelligence artificielle</strong>{" "}de l&apos;
              <strong className="text-primary">historique de trades</strong>{" "}que vous importez (notamment via fichiers{" "}
              <strong className="text-primary">CSV</strong>) sur le site{" "}
              <strong className="text-primary">https://alphatradex.ai</strong>.
            </p>
            <p>
              Ce service{" "}<strong className="text-primary">n&apos;est pas un conseil en investissement</strong>, ne constitue
              pas une recommandation personnalisée au sens des textes relatifs aux services d&apos;investissement, et ne
              relève en aucun cas d&apos;une{" "}<strong className="text-primary">gestion de fonds</strong>{" "}ou d&apos;une
              gestion pour compte de tiers.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Risques liés aux marchés financiers</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le trading sur les marchés financiers (actions, obligations, devises, cryptomonnaies, produits dérivés, etc.)
              comporte un{" "}<strong className="text-primary">risque élevé de perte en capital</strong>. Les performances passées
              - y compris celles déduites de vos historiques - ne préjugent pas des performances futures.
            </p>
            <p>
              Les marchés peuvent être volatils, illiquides ou soumis à des événements imprévisibles. Vous ne devez engager
              que des fonds dont vous acceptez une perte partielle ou totale.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Limites de l&apos;intelligence artificielle (OpenAI GPT-5.4)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les analyses sont produites notamment via le modèle{" "}<strong className="text-primary">OpenAI GPT-5.4</strong>.
              Les modèles d&apos;IA peuvent produire des{" "}<strong className="text-primary">erreurs</strong>, des{" "}
              <strong className="text-primary">hallucinations</strong>, des généralisations abusives ou des interprétations
              incomplètes des données fournies.
            </p>
            <p>
              L&apos;IA ne « comprend » pas les marchés au sens humain ; elle traite des motifs statistiques et linguistiques
              à partir des informations qui lui sont transmises. La qualité de l&apos;analyse dépend de la qualité, de
              l&apos;exhaustivité et de l&apos;exactitude de vos données sources.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Absence de garantie de résultat</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            AlphaTradeX ne garantit aucun résultat financier, aucune amélioration de performance, aucun retour sur investissement
            ni aucune adéquation à vos objectifs personnels. Toute décision de trading demeure de votre seule et entière
            responsabilité.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Conformité réglementaire personnelle</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Selon votre situation (résidence fiscale, statut professionnel, produits tradés), des règles spécifiques peuvent
              s&apos;appliquer (déclarations fiscales, statut de client professionnel vs non professionnel, restrictions sur
              certains instruments). Il vous appartient de vous conformer à la réglementation applicable.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Conseil professionnel</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Pour tout conseil en investissement personnalisé, fiscalité, ou juridique, vous devez consulter des professionnels
            habilités (CIF, avocat, expert-comptable) indépendamment de l&apos;usage d&apos;AlphaTradeX.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Contact</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Pour toute question sur ces mentions :{" "}
            <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
              contact@alphatradex.ai
            </a>
            . Pour les données personnelles, voir la{" "}
            <Link href="/legal/confidentialite" className="text-blue underline-offset-2 hover:underline">
              Politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
