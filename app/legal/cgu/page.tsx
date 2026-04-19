import Link from "next/link";

export default function CGUPage() {
  return (
    <main className="mx-auto max-w-[800px] px-6 py-20 pt-28">
      <Link
        href="/"
        className="mb-8 inline-block text-sm font-medium text-blue transition-colors duration-200 hover:text-primary"
      >
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-primary md:text-4xl">
        Conditions générales d&apos;utilisation (CGU)
      </h1>
      <p className="mt-4 text-sm text-secondary">Dernière mise à jour : 18 avril 2026</p>

      <div className="mt-10 space-y-10">
        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">1. Objet et champ d&apos;application</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les présentes Conditions générales d&apos;utilisation (ci-après les « CGU ») régissent l&apos;accès et
              l&apos;utilisation du site{" "}<strong className="text-primary">https://alphatradex.ai</strong>{" "}et du service{" "}
              <strong className="text-primary">AlphaTradeX</strong>{" "}(ci-après le « Service »), édité depuis la{" "}
              <strong className="text-primary">France</strong>.
            </p>
            <p>
              AlphaTradeX permet aux utilisateurs de soumettre leurs{" "}<strong className="text-primary">historiques de trades</strong>{" "}
              (notamment sous forme de fichiers{" "}<strong className="text-primary">CSV</strong>) afin d&apos;obtenir une{" "}
              <strong className="text-primary">analyse par intelligence artificielle</strong>{" "}(notamment via{" "}
              <strong className="text-primary">OpenAI GPT-5.4</strong>) de ces données.
            </p>
            <p>
              Toute création de compte ou utilisation du Service vaut acceptation sans réserve des CGU en vigueur à la date
              d&apos;utilisation. Si vous n&apos;acceptez pas les CGU, vous ne devez pas utiliser le Service.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">2. Description du Service et exclusions importantes</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              AlphaTradeX est exclusivement un outil d&apos;<strong className="text-primary">analyse de données historiques</strong>{" "}
              liées aux opérations de trading déjà réalisées par l&apos;utilisateur.
            </p>
            <p>
              Le Service{" "}<strong className="text-primary">ne constitue pas un conseil en investissement</strong>, ni une
              recommandation personnalisée au sens de la réglementation applicable aux services d&apos;investissement, ni un
              dispositif d&apos;aide à la décision en temps réel sur les marchés, ni un service de{" "}
              <strong className="text-primary">gestion de fonds</strong>, de gestion pour compte de tiers ou d&apos;exécution
              d&apos;ordres.
            </p>
            <p>
              Les résultats produits par l&apos;IA peuvent comporter des inexactitudes, des omissions ou des interprétations
              incomplètes. L&apos;utilisateur doit exercer son propre jugement critique et, le cas échéant, consulter des
              professionnels réglementés (conseillers en investissement financiers, CIF, etc.) pour toute question relevant
              du conseil en investissement.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">3. Compte utilisateur et authentification</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              L&apos;accès à certaines fonctionnalités peut nécessiter la création d&apos;un compte et/ou une authentification
              (par exemple via un fournisseur tiers tel que Google). Vous vous engagez à fournir des informations exactes et
              à maintenir la confidentialité de vos moyens d&apos;authentification.
            </p>
            <p>
              Vous êtes responsable de toute activité réalisée depuis votre compte. Toute utilisation frauduleuse ou usurpation
              d&apos;identité devra être signalée sans délai à{" "}
              <a href="mailto:contact@alphatradex.ai" className="text-blue underline-offset-2 hover:underline">
                contact@alphatradex.ai
              </a>
              .
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">4. Obligations de l&apos;utilisateur</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>Vous vous engagez notamment à :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                n&apos;importer que des données dont vous avez le droit d&apos;usage (vos propres historiques ou ceux pour
                lesquels vous disposez d&apos;une autorisation expresse) ;
              </li>
              <li>
                ne pas utiliser le Service à des fins illégales, frauduleuses, ou de nature à porter atteinte aux droits de
                tiers ;
              </li>
              <li>
                ne pas tenter de compromettre la sécurité ou la disponibilité du Service (intrusion, surcharge, reverse
                engineering prohibé par la loi, etc.) ;
              </li>
              <li>
                respecter les présentes CGU, la{" "}
                <Link href="/legal/confidentialite" className="text-blue underline-offset-2 hover:underline">
                  Politique de confidentialité
                </Link>{" "}
                et la{" "}
                <Link href="/legal/cookies" className="text-blue underline-offset-2 hover:underline">
                  Politique de cookies
                </Link>
                .
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">5. Données, hébergement et sous-traitance</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Le Service est hébergé sur une infrastructure fournie notamment par{" "}<strong className="text-primary">Vercel</strong>.
              Les traitements de données personnelles sont décrits dans la politique de confidentialité. Les analyses IA
              peuvent impliquer le recours à des API du modèle{" "}<strong className="text-primary">OpenAI GPT-5.4</strong>, sous
              réserve des paramètres techniques et contractuels en vigueur.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">6. Propriété intellectuelle</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            AlphaTradeX, le Site et leurs contenus (hors contenus fournis par les utilisateurs) demeurent la propriété de
            l&apos;éditeur ou de ses partenaires. Sous réserve des droits des utilisateurs sur leurs propres données, aucune
            licence de propriété intellectuelle n&apos;est concédée au-delà du droit strictement nécessaire à
            l&apos;utilisation du Service conformément aux CGU.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">7. Disponibilité et évolution du Service</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            Le Service est fourni sous réserve des maintenances, mises à jour et contraintes techniques. L&apos;éditeur peut
            modifier ou interrompre certaines fonctionnalités pour des raisons légitimes (sécurité, conformité, amélioration
            du produit), en s&apos;efforçant d&apos;en informer les utilisateurs lorsque cela est raisonnablement possible.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">8. Responsabilité</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Dans les limites autorisées par les dispositions impératives du droit français, la responsabilité de
              l&apos;éditeur ne saurait être engagée pour les dommages indirects ou immatériels liés à l&apos;usage ou
              l&apos;impossibilité d&apos;usage du Service, ni pour les décisions de trading prises par l&apos;utilisateur
              sur la base des analyses fournies.
            </p>
            <p>
              Rien dans les présentes CGU ne limite la responsabilité en cas de faute lourde ou intentionnelle, ou de
              préjudice résultant d&apos;une faute dont la limitation serait interdite par la loi.
            </p>
          </div>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">9. Résiliation et sanctions</h2>
          <p className="mt-4 text-sm leading-relaxed text-secondary">
            En cas de manquement grave aux CGU, l&apos;éditeur pourra suspendre ou résilier l&apos;accès au Service, sans
            préjudice des recours éventuels. L&apos;utilisateur peut cesser d&apos;utiliser le Service à tout moment.
          </p>
        </section>

        <section className="rounded border border-border bg-card p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-primary">10. Droit applicable et litiges</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-secondary">
            <p>
              Les CGU sont régies par le{" "}<strong className="text-primary">droit français</strong>. En l&apos;absence de
              règlement amiable, compétence est attribuée aux tribunaux français, sous réserve des règles d&apos;ordre public
              relatives à la compétence des juridictions en matière de consommation.
            </p>
            <p>
              Les consommateurs peuvent recourir à un médiateur de la consommation ou à la plateforme européenne de règlement
              des litiges en ligne (RLL) lorsque les conditions légales sont remplies.
            </p>
          </div>
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
