# Roadmap Affiliation — AuraPost
> Chantier long terme · Dernière mise à jour : 2026-06-26 · **Phases R-0 à R-3 IMPLÉMENTÉES**

---

## ⚠️ Questions produit à trancher avant de démarrer

Le programme de parrainage **fonctionne déjà** dans ses grandes lignes. La vraie question est : jusqu'où veut-on aller ? Ces décisions déterminent si les phases restantes prennent 2 jours ou 3 semaines.

**Q1 — Modèle de récompense final**
Aujourd'hui : 1 mois gratuit pour le parrain ET le filleul, crédité immédiatement à l'inscription. C'est fonctionnel mais simpliste. Trois directions possibles :
- **A — Conserver le mois gratuit** : renforcer l'attribution (cookie), ajouter un suivi, affiner les conditions. Effort faible.
- **B — Passer à un pourcentage de commission** (ex: 20% du premier paiement du filleul) : nécessite de lier la récompense au webhook Stripe `checkout.session.completed`. Plus équitable si le filleul passe sur un plan payant, mais beaucoup plus complexe.
- **C — Cash out via Stripe Connect** : paiements réels aux parrains. Implique un onboarding Stripe Connect pour chaque parrain (KYC, RIB), coûts Stripe, conformité fiscale. Chantier XL indépendant.

→ **Trancher entre A, B ou C avant toute implémentation.**

**Q2 — Moment du crédit**
Actuellement : le crédit est accordé **à l'inscription** du filleul (même s'il n'a jamais payé). Est-ce voulu ?
- Avantage : simple, rapide, fort incentive à parrainer.
- Risque : des comptes créés juste pour l'occasion pourraient abuser (inscriptions frauduleuses).
- Alternative : crédit après le **premier paiement** du filleul → requiert un crochet sur le webhook Stripe `invoice.payment_succeeded` + column `referrals.status` à évoluer de 'pending' → 'credited'.

**Q3 — Plafond par parrain**
Faut-il limiter le nombre de mois gratuits cumulables ? (ex: max 6 mois via parrainage) Sans plafond, un coach influent pourrait théoriquement ne jamais payer en référant des dizaines de contacts.

**Q4 — Durée de validité d'un code**
Les codes n'expirent jamais actuellement. Faut-il un délai ? (ex: un code créé il y a 2 ans est-il toujours valide ?)

**Q5 — CGV du programme**
Si le programme évolue vers des récompenses monétaires, des conditions d'utilisation écrites (page `/referral-terms`) deviennent indispensables — notamment pour la conformité fiscale si les parrains reçoivent plus de 600€/an en récompenses (seuil de déclaration en France).

**Q6 — Email au filleul**
Le filleul reçoit-il un email confirmant que son inscription via parrainage lui a accordé 1 mois offert ? Actuellement seul le parrain est notifié. Ce détail améliore la confiance et réduit les contacts support du type "j'ai pas eu mon mois".

---

## Audit technique — État réel du système

### Ce qui fonctionne déjà (production-ready)

| Composant | Fichier | État |
|---|---|---|
| Code unique par tenant | `lib/db/referrals.ts · getOrCreateReferralCode()` | ✅ Opérationnel — alphabet sans ambiguïté (sans 0/O/I/L), 8 chars, retry sur collision |
| Résolution du code | `resolveReferralCode()` | ✅ Opérationnel |
| Page d'entrée `/ref/[code]` | `app/ref/[code]/page.tsx` | ✅ Redirect vers `/register?ref=CODE` |
| Banner inscription filleul | `app/register/page.tsx` | ✅ Affiche "1 mois offert" si `?ref=` présent (lu côté client via `useEffect`) |
| Enregistrement du parrainage | `app/api/auth/register/route.ts` + `recordReferral()` | ✅ Appel au signup, notification in-app au parrain, email parrain |
| Crédit mois gratuit | `extendFreeMonth()` dans `lib/db/referrals.ts` | ✅ Prolonge `tenants.planExpiresAt` de 30 jours pour les deux parties |
| Anti auto-parrainage | `recordReferral()` ligne 75 | ✅ Vérifie `owner.tenantId !== refereeTenantId` |
| Dashboard parrain | `app/dashboard/referral/page.tsx` | ✅ Affiche code, compteur filleuls, mois gagnés, liste avec statuts |
| Partage natif mobile | `ReferralLinkCard.tsx` | ✅ `navigator.share()` avec fallback copie |
| Admin métriques | `totalCreditedReferrals()` | ✅ Count global pour `/admin` |

### Ce qui est structurellement incomplet

**1. Attribution par cookie absente** (lacune principale)

Le code de parrainage est lu depuis le paramètre URL `?ref=` uniquement dans `app/register/page.tsx` via `useEffect`. Si un visiteur :
1. Clique sur le lien de parrainage → arrive sur `/ref/[code]` → redirigé vers `/register?ref=CODE`
2. Ferme l'onglet, revient plus tard directement sur `/register` (sans le `?ref=`)

→ Le parrainage est perdu. Aucun cookie n'est posé lors du passage par `/ref/[code]`.

**2. Statut `pending` jamais utilisé**

La table `referrals` définit `default('pending')` mais `recordReferral()` écrit directement `status: 'credited'` — il n'y a jamais d'état intermédiaire. Si on veut conditionner le crédit au premier paiement, ce mécanisme est à retravailler.

**3. Notification filleul absente**

`app/api/auth/register/route.ts` notifie le parrain (in-app + email) mais pas le filleul. Celui-ci reçoit juste l'email de bienvenue standard — sans mention du mois offert.

**4. Aucune limite de cumul**

Pas de plafond sur `monthsEarned`. La logique `extendFreeMonth()` prolonge `planExpiresAt` sans vérifier de maximum.

**5. Pas de page admin dédiée**

`totalCreditedReferrals()` retourne un count brut. Il n'y a pas de vue admin listant les filleuls/parrains avec leur statut et les montants crédités — utile pour détecter des abus.

**6. Code non lié au filleul après paiement**

`referrals.refereeTenantId` est rempli à l'inscription mais il n'y a aucune mécanique pour détecter si le filleul passe sur un plan payant ultérieurement. Nécessaire si la décision Q2 conditionne le crédit au premier paiement.

---

## Phasage

### Phase R-1 : Attribution par cookie — S

**Quoi (fonctionnel)** : Un visiteur qui arrive sur `/ref/[code]` voit son code de parrainage persister 30 jours, même s'il s'inscrit plus tard sans le paramètre URL.

**Quoi (technique)** :
- Dans `app/ref/[code]/page.tsx` (Server Component) : au lieu de simplement rediriger, poser un cookie HTTP `aurapost_ref=CODE` (SameSite=Strict, HttpOnly, MaxAge=30j) AVANT la redirection, via `cookies().set()` de Next.js
- Dans `app/register/page.tsx` ou dans `app/api/auth/register/route.ts` : si `parsed.data.ref` est absent mais qu'un cookie `aurapost_ref` est présent dans la requête, l'utiliser en fallback
- Après inscription : supprimer le cookie (`cookies().delete('aurapost_ref')`)

**Existe déjà** : pattern `cookies()` de Next.js utilisé dans `lib/auth.ts`. À dupliquer.

**Dépendances** : Aucune. Phase indépendante.

**Effort** : S (~3h). Aucune migration DB.

**Risques** :
- `app/ref/[code]/page.tsx` est un Server Component — `cookies().set()` fonctionne dans un Route Handler mais dans un Server Component qui redirige, il faut utiliser `NextResponse` avec `Set-Cookie`. À vérifier selon la version Next.js utilisée.
- Le cookie doit être ExclueSameSite=None si les liens de parrainage sont partagés hors contexte (réseaux sociaux) — tester le comportement cross-origin.

---

### Phase R-2 : Notification au filleul — S

**Quoi (fonctionnel)** : Le filleul qui s'inscrit via un lien de parrainage reçoit un email lui confirmant que son premier mois est offert grâce à son parrain.

**Quoi (technique)** :
- Nouvelle fonction `sendReferralWelcomeEmail()` dans `lib/email.ts` — template distinct de l'email de bienvenue standard
- Appel dans `app/api/auth/register/route.ts` si `referrerTenantId` est non null (après le `recordReferral()` existant)
- Notification in-app pour le filleul également (via `createNotification()` sur `refereeTenantId`)

**Existe déjà** :
- `sendReferralJoinedEmail()` dans `lib/email.ts` — réutiliser le pattern
- `createNotification()` — déjà importé dans le route register

**Dépendances** : Aucune (amélioration isolée).

**Effort** : S (~2h). Uniquement du email template + 2 appels.

---

### Phase R-3 : Crédit conditionnel au premier paiement (si décision Q2 = "après paiement") — M

**Quoi (fonctionnel)** : Le mois gratuit n'est crédité qu'après que le filleul a effectué son premier paiement Stripe, pas à l'inscription.

**Quoi (technique)** :
- `recordReferral()` change : insérer avec `status: 'pending'` au lieu de 'credited', et NE PAS appeler `extendFreeMonth()` immédiatement
- Nouveau hook dans `app/api/webhooks/stripe/route.ts` : sur `invoice.payment_succeeded` (premier paiement d'un abonnement), chercher si `refereeTenantId = tenantId` dans la table `referrals` avec `status = 'pending'`, si oui → `extendFreeMonth()` sur les deux + update `status → 'credited'`
- `getReferralStats()` à adapter pour afficher correctement "en attente" vs "crédité"

**Existe déjà** :
- `app/api/webhooks/stripe/route.ts` — ajouter un `case 'invoice.payment_succeeded'`
- `lib/db/referrals.ts` — la table et le mécanisme de crédit sont déjà là, juste à déplacer le déclencheur

**Dépendances** : Stripe en production (B.1 de la roadmap principale). Décision Q2 obligatoire avant de coder.

**Effort** : M (~1 jour). La logique Stripe webhook est déjà bien structurée.

**Risques** :
- Si le filleul n'est jamais passé sur un plan payant, le parrain ne reçoit jamais son mois → risque de frustration ("j'ai parrainé mais j'ai rien reçu"). À communiquer clairement dans l'UI.
- Les tests `__tests__/stripe-webhook.test.ts` devront être étendus (nouveau cas `invoice.payment_succeeded` + lookup referral).

---

### Phase R-4 : Plafond de cumul et règles de programme — S

**Quoi (fonctionnel)** : Limite le nombre de mois gratuits cumulables par parrainage (ex: max 6 mois). Le code reste utilisable mais les crédits ne s'accumulent plus au-delà du plafond.

**Quoi (technique)** :
- Dans `extendFreeMonth()` : avant de prolonger, calculer combien de mois gratuits ont déjà été accumulés via parrainage (`COUNT(*) FROM referrals WHERE referrerTenantId = ? AND status = 'credited'`)
- Si count ≥ MAX_REFERRAL_MONTHS (constante configurable, ex: 6), skip l'extension
- Mettre à jour `getReferralStats()` pour afficher la progression (ex: "4/6 mois gagnés")
- Variable d'env `REFERRAL_MAX_MONTHS` ou constante dans `lib/constants.ts`

**Existe déjà** : `lib/constants.ts` — ajouter la constante.

**Dépendances** : Décision Q3 (plafond choisi).

**Effort** : S (~2h).

**Risques** : Faibles. À notifier clairement dans l'UI dashboard/referral.

---

### Phase R-5 : Page admin dédiée au programme — M

**Quoi (fonctionnel)** : Dans `/admin`, une section "Parrainage" : liste des paires parrain/filleul, statut (pending/credited), mois accordés, possibilité de désactiver manuellement un code abusif.

**Quoi (technique)** :
- `lib/db/admin.ts` : nouvelle fonction `getReferralAdminStats()` — liste paginée des `referrals` joinée avec `users` (email parrain, email filleul)
- Page `app/admin/referrals/page.tsx` (ou section dans la page admin existante)
- Action "Désactiver un code" : update `referralCodes.disabled = true` (colonne à ajouter) + check dans `resolveReferralCode()`

**Existe déjà** :
- Pattern pages admin — `app/admin/` déjà présent (avec `getSupportTickets()` comme exemple de pattern)

**Dépendances** : Phases R-1 à R-4 (pour avoir des données cohérentes à afficher).

**Effort** : M (~1 jour).

---

### Phase R-6 (optionnel) : Commission cash via Stripe Connect — XL

**Quoi** : Permettre aux parrains de recevoir un pourcentage de commission en argent réel (pas seulement des mois gratuits).

**Pourquoi c'est un XL séparé** :
- Stripe Connect (Express ou Standard) nécessite un onboarding coach : KYC (pièce d'identité, coordonnées bancaires), review Stripe, délai de 2-5 jours ouvrés
- Chaque parrain = un compte Connect → gestion des reversements, des fees Stripe (0.25% + 25¢ par transfert)
- Obligations fiscales : si un parrain reçoit >600€/an, AuraPost peut avoir des obligations déclaratives (formulaire 2042 en France pour les "revenus divers")
- Chantier à évaluer uniquement si la décision Q1-C est retenue. Ne pas démarrer sans validation légale et comptable.

**Dépendances** : Stripe Connect, validation légale et fiscale, décision Q1 = C.

**Effort** : XL — à traiter comme un chantier séparé avec son propre document.

---

## Synthèse — Effort par phase

| Phase | Description | Effort | Dépend de |
|---|---|---|---|
| R-1 | Attribution cookie 30 jours | S | — |
| R-2 | Notification email + in-app au filleul | S | — |
| R-3 | Crédit conditionnel au 1er paiement | M | Q2, Stripe prod |
| R-4 | Plafond de cumul (ex: 6 mois max) | S | Q3 |
| R-5 | Page admin dédiée (liste + désactivation) | M | R-1 à R-4 |
| R-6 | Commission cash (Stripe Connect) | XL | Q1=C, validation légale |

**Recommandation d'ordre** : R-1 et R-2 sont des quick wins sans aucune décision produit à trancher — les démarrer immédiatement. R-3 dépend de Q2 (moment du crédit) qui est la vraie décision stratégique. R-4 et R-5 sont des filets de sécurité utiles dès que le programme prend de l'ampleur.
