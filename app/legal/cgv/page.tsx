import Link from "next/link";

export default function CGVPage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">
        Conditions générales de vente (CGV)
      </h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Champ d&apos;application</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les présentes Conditions générales de vente (ci-après les « CGV ») régissent les ventes de services ou
              d&apos;abonnements proposés par{" "}<strong className="text-primary">AlphaTradeX</strong>{" "}via le site{" "}
              <strong className="text-primary">https://alphatradex.ai</strong>, édité depuis la{" "}
              <strong className="text-primary">France</strong>.
            </p>
            <p>
              AlphaTradeX fournit un{" "}<strong className="text-primary">service d&apos;analyse par IA</strong>{" "}de{" "}
              <strong className="text-primary">l&apos;historique de trades</strong>{" "}des utilisateurs (import notamment en{" "}
              <strong className="text-primary">CSV</strong>). Le service{" "}
              <strong className="text-primary">ne constitue pas un conseil en investissement</strong>{" "}et ne constitue pas une{" "}
              <strong className="text-primary">gestion de fonds</strong>.
            </p>
            <p>
              Toute commande implique l&apos;acceptation pleine et entière des CGV sans réserve. Les conditions particulières
              affichées au moment de la commande prévalent en cas de contradiction avec une version antérieure archivée.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Produits et prix</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les caractéristiques essentielles des offres (fonctionnalités, limites d&apos;usage, durée) et les prix TTC
              applicables sont présentés sur les pages d&apos;offre ou de paiement. Les prix peuvent être modifiés pour les
              nouvelles commandes ; les tarifs en vigueur sont ceux affichés au moment de la validation de la commande.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Commande et paiement (Stripe)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le paiement est réalisé par carte bancaire ou moyens proposés via notre prestataire{" "}
              <strong className="text-primary">Stripe</strong>. Les données de carte sont traitées directement par Stripe
              conformément à ses propres conditions et à la norme PCI-DSS ; AlphaTradeX ne conserve pas vos numéros complets
              de carte bancaire.
            </p>
            <p>
              La commande est ferme et définitive après confirmation du paiement par Stripe, sous réserve du droit de
              rétractation pour les consommateurs (voir ci-dessous).
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Exécution du service</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Après validation du paiement, l&apos;accès aux fonctionnalités payantes est activé dans les délais
              techniquement raisonnables. Le service repose sur des infrastructures tierces (notamment{" "}
              <strong className="text-primary">Vercel</strong>{" "}pour l&apos;hébergement et{" "}
              <strong className="text-primary">OpenAI GPT-5.4</strong>{" "}pour l&apos;analyse IA) ; une indisponibilité
              ponctuelle ne donne droit à aucune indemnisation au-delà des obligations légales applicables.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Droit de rétractation (consommateurs)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Lorsque vous agissez en qualité de{" "}<strong className="text-primary">consommateur</strong>{" "}au sens du Code de la
              consommation, vous disposez d&apos;un délai de{" "}<strong className="text-primary">14 jours</strong>{" "}à compter de
              la conclusion du contrat pour exercer votre droit de rétractation, sans avoir à motiver votre décision,
              conformément aux articles L.221-18 et suivants du Code de la consommation.
            </p>
            <p>
              Toutefois, si vous avez{" "}<strong className="text-primary">demandé l&apos;exécution immédiate</strong>{" "}du service
              numérique avant la fin du délai de rétractation et que l&apos;exécution a commencé avec votre accord exprès,
              vous reconnaissez que vous{" "}<strong className="text-primary">perdez votre droit de rétractation</strong>{" "}une fois
              l&apos;exécution entièrement réalisée avec votre accord préalable, dans les conditions prévues par l&apos;article
              L.221-28 du Code de la consommation.
            </p>
            <p>
              Le formulaire-type de rétractation peut être obtenu sur le site de la DGCCRF ou en écrivant à{" "}
              <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
                contact@alphatradex.ai
              </a>
              .
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Garanties légales</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Sont applicables les garanties légales (notamment conformité du bien au contrat pour les éléments tangibles, le
            cas échéant, et conformité du contenu numérique / service numérique selon les articles L.224-25-12 et suivants du
            Code de la consommation lorsque le cadre légal s&apos;applique). Les exclusions abusives sont réputées non{" "}
            écrites.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Résiliation et remboursement</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les abonnements récurrents peuvent être résiliés selon les modalités indiquées dans l&apos;interface ou par
              e-mail à{" "}<strong className="text-primary">contact@alphatradex.ai</strong>. Les sommes déjà acquises pour la
              période en cours restent dues sauf disposition contraire légale ou commerciale affichée au moment de la vente.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">8. Responsabilité</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              AlphaTradeX ne saurait être tenu responsable des pertes financières résultant des décisions de trading prises
              par l&apos;utilisateur. Les analyses IA sont fournies « en l&apos;état », avec les limites inhérentes aux
              modèles probabilistes (<strong className="text-primary">GPT-5.4</strong>).
            </p>
            <p>
              Les limitations de responsabilité ne s&apos;appliquent pas aux garanties légales ni aux cas où la loi interdit
              toute limitation.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">9. Médiation et litiges</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Conformément aux articles L.612-1 et R.612-1 du Code de la consommation, tout consommateur a le droit de recourir
            gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige qui l&apos;oppose au
            professionnel. Les modalités de saisine seront communiquées sur demande. La plateforme européenne de RLL est
            accessible en ligne.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">10. Droit applicable</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Les CGV sont soumises au{" "}<strong className="text-primary">droit français</strong>. Pour les litiges avec des
            professionnels, compétence exclusive peut être attribuée aux tribunaux français selon les règles de droit
            commun ; pour les consommateurs, les règles impératives de compétence territoriale s&apos;appliquent.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">11. Contact</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            AlphaTradeX -{" "}
            <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
              contact@alphatradex.ai
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
