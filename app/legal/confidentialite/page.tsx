import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Responsable du traitement</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le responsable du traitement des données à caractère personnel collectées via le site{" "}
              <strong className="text-primary">https://alphatradex.ai</strong>{" "}et le service{" "}
              <strong className="text-primary">AlphaTradeX</strong>{" "}est l&apos;éditeur du service, basé en{" "}
              <strong className="text-primary">France</strong>.
            </p>
            <p>
              Contact :{" "}
              <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
                contact@alphatradex.ai
              </a>
              .
            </p>
            <p>
              AlphaTradeX propose une{" "}<strong className="text-primary">analyse par IA de l&apos;historique de trades</strong>{" "}
              des utilisateurs ; il ne s&apos;agit pas d&apos;un conseil en investissement ni d&apos;une gestion de fonds.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Données personnelles collectées</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>Selon les fonctionnalités utilisées, peuvent être collectées notamment :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-primary">Données d&apos;identification et de contact</strong>{" "}: adresse{" "}
                <strong className="text-primary">e-mail</strong>, identifiants techniques de compte, informations
                transmises par le prestataire d&apos;authentification (par ex. compte Google lors d&apos;une connexion OAuth).
              </li>
              <li>
                <strong className="text-primary">Historiques de trades</strong>{" "}: fichiers et métadonnées importés par
                l&apos;utilisateur, notamment au format{" "}<strong className="text-primary">CSV</strong>, contenant des
                informations relatives aux opérations de trading (instruments, dates, volumes, prix, etc.).
              </li>
              <li>
                <strong className="text-primary">Données de paiement</strong>{" "}: lorsqu&apos;un abonnement ou un achat est
                proposé, les{" "}<strong className="text-primary">données de paiement</strong>{" "}sont traitées par notre prestataire{" "}
                <strong className="text-primary">Stripe</strong> ; AlphaTradeX peut recevoir des informations limitées
                (statut de transaction, identifiants clients Stripe, facturation) nécessaires à la gestion commerciale et
                comptable.
              </li>
              <li>
                <strong className="text-primary">Données de connexion et techniques</strong>{" "}: journaux, adresse IP,
                identifiants de session, type de navigateur, données de sécurité et de performance.
              </li>
              <li>
                <strong className="text-primary">Contenus générés par l&apos;IA</strong>{" "}: rapports et analyses produits à
                partir de vos données, lorsque leur conservation est nécessaire pour fournir le service ou améliorer la
                qualité du produit, dans le respect des finalités décrites ci-dessous.
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Finalités et bases légales (RGPD)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>Les traitements sont fondés sur :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-primary">Exécution du contrat</strong>{" "}(art. 6(1)(b) RGPD) : fourniture du service
                d&apos;analyse AlphaTradeX, création et gestion du compte, facturation via Stripe lorsque applicable.
              </li>
              <li>
                <strong className="text-primary">Intérêt légitime</strong>{" "}(art. 6(1)(f) RGPD) : sécurisation du service,
                prévention de la fraude, amélioration du produit, mesures d&apos;audience technique, prospection B2B
                proportionnée le cas échéant.
              </li>
              <li>
                <strong className="text-primary">Obligation légale</strong>{" "}(art. 6(1)(c) RGPD) : conservation comptable et
                fiscale, réponses aux réquisitions administratives ou judiciaires.
              </li>
              <li>
                <strong className="text-primary">Consentement</strong>{" "}(art. 6(1)(a) RGPD) : lorsque requis pour certains
                cookies ou communications marketing ; retirable à tout moment sans affecter la licité du traitement
                antérieur.
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Intelligence artificielle (OpenAI GPT-5.4)</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Pour produire les analyses, des extraits ou agrégats de vos données (y compris issues de vos fichiers CSV)
              peuvent être transmis à{" "}<strong className="text-primary">OpenAI</strong>{" "}via l&apos;API du modèle{" "}
              <strong className="text-primary">GPT-5.4</strong>, dans le cadre défini contractuellement (confidentialité,
              sécurité, options d&apos;exclusion de réutilisation pour l&apos;entraînement lorsque disponibles et activées).
            </p>
            <p>
              OpenAI agit en qualité de{" "}<strong className="text-primary">sous-traitant</strong>{" "}ou d&apos;acteur distinct selon
              la qualification juridique applicable ; les informations contractuelles à jour figurent dans la documentation
              OpenAI et nos accords de traitement des données.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Destinataires et sous-traitants</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>Les données peuvent être communiquées à des prestataires strictement nécessaires, notamment :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-primary">Vercel</strong>{" "}- hébergement et déploiement de l&apos;application ;
              </li>
              <li>
                <strong className="text-primary">Stripe</strong>{" "}- traitement des paiements ;
              </li>
              <li>
                <strong className="text-primary">OpenAI</strong>{" "}- exécution des modèles d&apos;IA ;
              </li>
              <li>
                prestataires d&apos;authentification, d&apos;analytics ou de support, dans la limite de leurs missions.
              </li>
            </ul>
            <p>
              Ces acteurs peuvent être situés hors de l&apos;Union européenne ; dans ce cas, des{" "}
              <strong className="text-primary">garanties appropriées</strong>{" "}(clauses contractuelles types de la Commission
              européenne, mesures supplémentaires le cas échéant) sont mises en œuvre conformément aux articles 44 et suivants
              du RGPD.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Durées de conservation</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les données sont conservées pendant la durée nécessaire aux finalités poursuivies, augmentée des délais de
              prescription légale le cas échéant. À titre indicatif : compte et données d&apos;usage tant que le compte est
              actif puis archivage sécurisé ou suppression dans un délai raisonnable après clôture ; données comptables
              selon obligations légales (souvent dix ans) ; journaux de sécurité pour une durée limitée proportionnée.
            </p>
            <p>
              Les utilisateurs peuvent demander la suppression de données non plus nécessaires, sous réserve des obligations
              légales de conservation.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Vos droits</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Conformément au RGPD et à la loi « Informatique et Libertés », vous disposez d&apos;un droit d&apos;accès, de
              rectification, d&apos;effacement, de limitation du traitement, d&apos;opposition (notamment à la prospection),
              de portabilité (lorsque applicable) et du droit de définir des directives relatives au sort de vos données après
              votre décès (en France).
            </p>
            <p>
              Pour exercer vos droits :{" "}
              <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
                contact@alphatradex.ai
              </a>
              . Une pièce d&apos;identité peut être demandée en cas de doute raisonnable sur votre identité.
            </p>
            <p>
              Vous pouvez introduire une réclamation auprès de la{" "}
              <strong className="text-primary">CNIL</strong>{" "}(www.cnil.fr).
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">8. Sécurité</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Des mesures techniques et organisationnelles appropriées (chiffrement en transit lorsque supporté, contrôle
            d&apos;accès, journalisation, cloisonnement des environnements) sont mises en œuvre pour protéger les données
            contre la destruction accidentelle ou illicite, la perte, l&apos;altération ou la divulgation non autorisée.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">9. Mineurs</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Le Service n&apos;est pas destiné aux mineurs de moins de 16 ans (ou âge requis dans votre juridiction). Nous ne
            collectons pas sciemment de données auprès de mineurs sans le consentement parental requis lorsque la loi
            l&apos;impose.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">10. Modifications</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Cette politique peut être mise à jour pour refléter les évolutions du service ou du cadre légal. La date de
            dernière mise à jour est indiquée en tête de document. Les changements substantiels pourront être notifiés par
            e-mail ou bandeau d&apos;information lorsque la loi l&apos;exige.
          </p>
        </section>
      </div>
    </main>
  );
}
