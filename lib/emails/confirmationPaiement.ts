export function getConfirmationPaiementHTML({
  prenom,
  plan,
  analysesLimit,
  renewalDate,
}: {
  prenom: string;
  plan: string;
  analysesLimit: number;
  renewalDate: string;
}) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const analysesText = analysesLimit >= 999999 ? 'Illimitées' : `${analysesLimit}/mois`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlphaTradeX</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">

          <img src="https://alphatradex.ai/logo.png" width="44" height="44" alt="AlphaTradeX" style="border-radius:8px;display:block;"/>

          <!-- LIGNE BLEUE -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2D6FFF,transparent);"></div>
            </td>
          </tr>

          <!-- STATUT -->
          <tr>
            <td style="padding-bottom:8px;">
              <div style="color:#8892AA;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Accès confirmé</div>
            </td>
          </tr>

          <!-- TITRE -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="color:#F0F4FF;font-size:28px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;">${prenom}</div>
              <div style="color:#F0F4FF;font-size:28px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;margin-top:8px;">Votre statut <span style="color:#2D6FFF;">${planLabel}</span> est activé.</div>
            </td>
          </tr>

          <!-- PHRASES -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="color:#8892AA;font-size:15px;line-height:1.7;">Vous avez accès à ce que peu de traders verront.</div>
              <div style="color:#8892AA;font-size:15px;line-height:1.7;margin-top:12px;">Ce que vous en faites vous appartient.</div>
            </td>
          </tr>

          <!-- BLOC DETAILS -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#12121A;border:1px solid #1E2035;border-radius:12px;padding:28px;">
                <tr>
                  <td style="padding-bottom:20px;border-bottom:1px solid #1E2035;">
                    <div style="color:#8892AA;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">Plan</div>
                    <div style="color:#F0F4FF;font-size:15px;font-weight:600;">${planLabel}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;padding-bottom:20px;border-bottom:1px solid #1E2035;">
                    <div style="color:#8892AA;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">Analyses disponibles</div>
                    <div style="color:#F0F4FF;font-size:15px;font-weight:600;">${analysesText}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:20px;">
                    <div style="color:#8892AA;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">Prochain cycle</div>
                    <div style="color:#F0F4FF;font-size:15px;font-weight:600;">${renewalDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="https://alphatradex.ai/dashboard" style="display:inline-block;background:#2D6FFF;color:#F0F4FF;font-size:14px;font-weight:600;letter-spacing:0.08em;text-decoration:none;padding:14px 36px;border-radius:12px;text-transform:uppercase;">Accéder au dashboard</a>
            </td>
          </tr>

          <!-- LIGNE -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#1E2035,transparent);"></div>
            </td>
          </tr>

          <!-- SUPPORT -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="color:#8892AA;font-size:13px;line-height:1.6;">Une question ? Écrivez-nous.<br/><a href="mailto:contact@alphatradex.ai" style="color:#2D6FFF;text-decoration:none;">contact@alphatradex.ai</a></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td>
              <div style="color:#8892AA;font-size:11px;letter-spacing:0.08em;">© 2026 AlphaTradeX &nbsp;·&nbsp; <a href="https://alphatradex.ai/legal/confidentialite" style="color:#8892AA;text-decoration:none;">Confidentialité</a></div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
