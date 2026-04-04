/* eslint-disable react/no-unescaped-entities -- texte juridique FR */
export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-8 
      text-primary">
      <h1 className="text-3xl font-bold mb-8">
        Politique de Confidentialité
      </h1>
      <div className="space-y-6 text-secondary">
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            1. Données collectées
          </h2>
          <p>Nous collectons votre adresse email, 
          votre nom et votre photo de profil lors 
          de la connexion via Google. Nous collectons 
          également vos historiques de trades 
          uniquement pour générer votre analyse IA.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            2. Utilisation des données
          </h2>
          <p>Vos données sont utilisées exclusivement 
          pour fournir le service d'analyse de trading. 
          Vos trades sont envoyés à l'API OpenAI 
          de manière anonymisée pour générer votre 
          rapport. Nous ne vendons jamais vos données 
          à des tiers.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            3. Hébergement
          </h2>
          <p>Vos données sont hébergées sur Supabase 
          (infrastructure AWS Europe) et Vercel 
          (infrastructure EU). Tous les transferts 
          sont chiffrés via HTTPS.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            4. Vos droits RGPD
          </h2>
          <p>Conformément au RGPD, vous disposez d'un 
          droit d'accès, de rectification, d'effacement 
          et de portabilité de vos données. Pour 
          exercer ces droits, contactez-nous à 
          contact@[votredomaine].fr</p>
        </section>
        <section>
          <h2 className="text-xl font-bold 
            text-primary mb-3">
            5. Cookies
          </h2>
          <p>Nous utilisons uniquement les cookies 
          nécessaires à l'authentification. Aucun 
          cookie publicitaire n'est utilisé.</p>
        </section>
      </div>
    </main>
  )
}
