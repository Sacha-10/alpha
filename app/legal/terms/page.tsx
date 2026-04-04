/* eslint-disable react/no-unescaped-entities -- texte juridique FR */
export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto p-8 
      text-primary">
      <h1 className="text-3xl font-bold mb-8">
        Conditions Générales d'Utilisation
      </h1>
      <div className="space-y-6 text-secondary">
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            1. Description du service
          </h2>
          <p>[NomDuSaaS] est un outil d'analyse de 
          trading propulsé par l'intelligence 
          artificielle. Il analyse vos historiques 
          de trades et génère des rapports de 
          performance personnalisés.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            2. Abonnements et paiements
          </h2>
          <p>Les abonnements sont facturés mensuellement 
          ou annuellement via Stripe. Vous pouvez 
          annuler à tout moment depuis votre tableau 
          de bord. Aucun remboursement n'est accordé 
          pour les périodes entamées.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            3. Limitation de responsabilité
          </h2>
          <p>[NomDuSaaS] est un outil d'aide à 
          la décision et ne constitue pas un conseil 
          financier. Nous ne sommes pas responsables 
          des pertes financières résultant de 
          l'utilisation de notre service. Le trading 
          comporte des risques de perte en capital.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            4. Droit applicable
          </h2>
          <p>Les présentes CGU sont soumises au 
          droit français. Tout litige sera soumis 
          à la compétence exclusive des tribunaux 
          français.</p>
        </section>
      </div>
    </main>
  )
}
