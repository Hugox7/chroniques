const esc = (v: string) => v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
const wrap = (title:string,content:string) => `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f3eee4;font-family:Georgia,serif;color:#342a26"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf0;border:1px solid #d8c9aa;border-radius:12px"><tr><td style="padding:32px"><p style="color:#8d6b35;letter-spacing:2px;font-size:12px">CHRONIQUES &amp; DÉS</p><h1 style="font-size:28px;line-height:1.25;color:#6b2835">${title}</h1>${content}<hr style="border:0;border-top:1px solid #dfd4c0;margin:32px 0 16px"><p style="font:12px Arial,sans-serif;color:#73695e">Message envoyé par Chroniques &amp; Dés · Trameworks</p></td></tr></table></td></tr></table></body></html>`;
const button=(label:string,url:string)=>`<p style="margin:28px 0"><a href="${esc(url)}" style="background:#6b2835;color:#fff;text-decoration:none;padding:14px 22px;border-radius:6px;font:bold 14px Arial,sans-serif">${label}</a></p>`;
export function campaignInvitationEmail(data:{inviter:string;campaign:string;url:string}) {const inviter=esc(data.inviter),campaign=esc(data.campaign);return {subject:`${data.inviter} vous invite à rejoindre ${data.campaign} · Chroniques & Dés`,html:wrap('Une aventure vous attend',`<p><strong>${inviter}</strong> vous invite à rejoindre la campagne <strong>${campaign}</strong>.</p><p>Connectez-vous avec l’adresse e-mail destinataire de cette invitation pour la retrouver dans votre tableau de bord.</p>${button('Voir mon invitation',data.url)}<p style="font:13px Arial,sans-serif;color:#73695e">Si vous ne connaissez pas cette personne, vous pouvez ignorer ce message.</p>`)};}


/** Modèle réservé aux futures notifications applicatives. */
export function importantNotificationEmail(data:{title:string;message:string;url:string}) {
  return {
    subject:`${data.title} · Chroniques & Dés`,
    html:wrap(esc(data.title),`<p>${esc(data.message)}</p>${button('Ouvrir Chroniques & Dés',data.url)}`),
  };
}
