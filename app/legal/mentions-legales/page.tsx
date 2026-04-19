import Link from "next/link";

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">Mentions légales</h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Éditeur du site</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le site accessible à l&apos;adresse{" "}<strong className="text-primary">https://alphatradex.ai</strong>{" "}(ci-après
              le « Site ») est édité dans le cadre de l&apos;activité de la marque et du service{" "}
              <strong className="text-primary">AlphaTradeX</strong>, proposant une{" "}
              <strong className="text-primary">analyse par intelligence artificielle de l&apos;historique de trades</strong>{" "}
              des utilisateurs à partir de fichiers qu&apos;ils importent (notamment au format CSV).
            </p>
            <p>
              L&apos;éditeur est une entité exploitant AlphaTradeX, dont le siège social est situé en{" "}
              <strong className="text-primary">France</strong>. Pour toute demande relative aux présentes mentions légales ou
              à l&apos;identification complète de l&apos;éditeur (notamment aux fins administratives), vous pouvez écrire à :{" "}
              <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
                contact@alphatradex.ai
              </a>
              .
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Directeur de la publication</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Le directeur de la publication est la personne physique ou morale ayant la qualité de représentant légal de
            l&apos;éditeur du service AlphaTradeX, joignable à l&apos;adresse{" "}
            <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
              contact@alphatradex.ai
            </a>
            .
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Nature du service AlphaTradeX</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              AlphaTradeX est un{" "}<strong className="text-primary">service d&apos;analyse</strong>{" "}fondé sur des modèles
              d&apos;intelligence artificielle (notamment{" "}<strong className="text-primary">OpenAI GPT-5.4</strong>) appliqué
              aux données d&apos;historique de trading fournies par l&apos;utilisateur.
            </p>
            <p>
              Les contenus générés (rapports, statistiques, interprétations) constituent une{" "}
              <strong className="text-primary">aide à la compréhension de données historiques</strong>. Ils ne constituent en
              aucun cas un{" "}<strong className="text-primary">conseil en investissement</strong>, une incitation à acheter ou
              vendre un instrument financier, une recommandation personnalisée au sens du droit des marchés financiers, ni un
              service de{" "}<strong className="text-primary">gestion de fonds</strong>{" "}ou de prise de décision pour le compte du
              client.
            </p>
            <p>
              L&apos;utilisateur reste seul responsable de ses décisions de trading et de l&apos;usage qu&apos;il fait des
              analyses fournies par AlphaTradeX.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Hébergement</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le Site et une partie de l&apos;infrastructure applicative sont hébergés par{" "}
              <strong className="text-primary">Vercel Inc.</strong>, société de droit américain, dont les coordonnées et
              politiques sont disponibles sur{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue underline-offset-2 hover:underline"
              >
                vercel.com
              </a>
              .
            </p>
            <p>
              Les données peuvent transiter ou être stockées dans des environnements sécurisés dépendant de la configuration
              technique du service. Les traitements de données personnelles sont décrits dans la{" "}
              <Link href="/legal/confidentialite" className="text-blue underline-offset-2 hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Propriété intellectuelle</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              L&apos;ensemble des éléments du Site (structure, textes, images, graphismes, logo, icônes, sons, logiciels,
              bases de données, etc.) est protégé par le droit de la propriété intellectuelle. Toute reproduction,
              représentation, adaptation ou exploitation non autorisée, totale ou partielle, est interdite et constitue une
              contrefaçon sanctionnée par le Code de la propriété intellectuelle.
            </p>
            <p>
              La marque{" "}<strong className="text-primary">AlphaTradeX</strong>{" "}et le domaine{" "}
              <strong className="text-primary">alphatradex.ai</strong>{" "}sont des signes distinctifs dont l&apos;usage non{" "}
              autorisé est prohibé.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Limitation de responsabilité (contenu du Site)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur
              le Site. Toutefois, des erreurs ou omissions peuvent survenir : l&apos;éditeur ne saurait garantir
              l&apos;exhaustivité des informations à caractère général présentées sur le Site.
            </p>
            <p>
              Le Site peut contenir des liens hypertextes vers des sites tiers ; l&apos;éditeur n&apos;exerce aucun contrôle
              sur ces sites et décline toute responsabilité quant à leur contenu.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Contact</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Pour toute question relative au Site ou aux présentes mentions :{" "}
            <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
              contact@alphatradex.ai
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
