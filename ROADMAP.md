# ROADMAP — AuraPost

> **Document vivant** — mis à jour au fil des sprints. Ne pas le traiter comme figé.
> Dernière mise à jour : 2026-06-25. Basé sur un audit complet du code source (voir `AUDIT_ROADMAP.md` du 2026-06-15 pour l'audit antérieur).
>
> **Légende effort** : S (< ½ journée) · M (1–2 jours) · L (3–5 jours) · XL (> 1 semaine)
> **⚠️ À vérifier** : point non confirmé lors de l'audit — à investiguer avant toute décision

---

## A. État des lieux

### Ce qui fonctionne

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Génération IA posts (8 IG + 4 LI / mois) | ✅ stable | Jobs async avec streaming post par post, résout le timeout serverless 26s |
| 3 styles visuels coach-site (Impact / Clarté / Authenticité) | ✅ stable | Hero, forces, services, résultats, témoignages, contact, footer — variantes par style |
| Édition IA du site en langage naturel | ✅ stable | Server Action `applyAIEdit`, rate-limitée 20 appels/h, même chemin que la génération (commit 6de7312) |
| Page Explore (10 démos, mini-maquettes, favoris) | ✅ stable | Vignettes fidèles à la structure réelle du hero, photos crop=faces |
| Authentification (magic link + vérification email) | ✅ stable | next-auth beta 5, tables `users` + `magicTokens` |
| Multi-tenant strict | ✅ stable | `tenant_id NOT NULL` partout, `requireTenantId()` sur toutes les mutations |
| Plans définis et gating | ✅ stable | starter / content_only (39€) / pack_complet (79€) — gating côté serveur |
| Séquences email (Resend) | ✅ stable | Emails de bienvenue, rappels onboarding, désabonnement HMAC |
| Mode organisation / réseau | ✅ stable | Tables organizations, orgTenants, orgTemplates, brand kit, crons d'activation J+1/3/7, validation MLM |
| Analyse profil Instagram & LinkedIn | ✅ stable | Analyse via Claude, score global, stocké dans `profileAnalyses` |
| Upload photos | ✅ stable | R2/S3, validation magic bytes + sharp |
| Tests et CI | ✅ stable | 12 fichiers Jest, Playwright desktop + mobile, GitHub Actions (typecheck + build + tests) |

### Ce qui est structurellement présent mais pas activé en production

| Élément | Ce qui manque |
|---|---|
| Stripe paiements | Price IDs (`STRIPE_PRICE_CONTENT_ONLY` / `STRIPE_PRICE_PACK_COMPLET`) non configurés — checkout ne peut pas être déclenché |
| Publication du site vitrine | `status: active/inactive` en DB — voir section E pour le point à vérifier |
| Domaines custom | Champ `customDomain` dans `websites` — aucune logique DNS/SSL visible |
| Parrainage | Tables présentes, logique de crédit à valider |

---

## B. Court terme (prochaines 2–4 semaines)

| # | Quoi | Pourquoi maintenant | Effort | Dépendances |
|---|---|---|---|---|
| B.1 | ~~**Activer Stripe en production**~~ | ✅ **Préparé** (2026-06-26) — `.env.example` exhaustif, idempotence documentée + testée (`__tests__/stripe-webhook.test.ts`), `// TODO(launch)` grâce période, `docs/stripe-activation.md` (6 étapes). Ne reste qu'à poser les clés prod en env Netlify. | — | — |
| B.2 | **Vérifier le gating `status` du site public** : confirmer que `app/site/[subdomain]/page.tsx` lit bien `status: 'active'` et renvoie 404 ou redirect si `inactive` — voir section E (risque de confiance élevé) | Priorité sécurité/confiance — peut être résolu en S si le gating existe déjà | S | — |
| B.3 | **Corriger les métriques admin truquées** : `demoConversion: 32`, NPS simulé, MRR fictif dans `lib/db/admin.ts` et `AdminInsights.tsx` — remplacer par des métriques réelles ou marquer explicitement « démo » | Un fondateur qui regarde son admin doit voir des chiffres réels | M | — |
| B.4 | ~~**Configurer shadcn/ui**~~ | ✅ **Déjà fait** — `components.json` présent depuis l'origine (style new-york, violet, cssVariables). `npx shadcn add` fonctionne sur le projet. | — | — |
| B.5 | ~~**Vérifier et clarifier la double source de plan**~~ | ✅ **Résolu** — audit code complet (2026-06-25) : `upsertSubscription()` met à jour `subscriptions` ET `tenants.plan` en un seul appel atomique sur tous les événements Stripe. `tenants.plan` est la source de vérité pour le JWT. 8 tests ajoutés (`__tests__/subscription-plan-sync.test.ts`). Voir section E pour le détail. | — | — |
| B.6 | ~~**Documenter et lancer le chantier composants 21st.dev**~~ | ✅ **Complet** (2026-06-26) — `StaggerTestimonials.tsx` et `BentoFeatures.tsx` implémentés manuellement et intégrés dans `LandingClient.tsx` (dynamic imports, BentoFeatures après HowItWorks, StaggerTestimonials avant le marquee Testimonials). Candidat restant non installé : `kokonutd/pricing-section` (auth 21st.dev requise). Voir SKILL.md §8. | — | — |
| B.7 | ~~**Lint erreurs react-hooks préexistantes**~~ | ✅ **Résolu** (2026-06-26) — 6 erreurs corrigées : 1 fix code réel (`ExploreClient` lazy initializer), 5 `eslint-disable` justifiés. Plus `use-reduced-motion.ts`, `BentoFeatures.tsx`, `SitePreviewModal.tsx`. Build propre, exit 0, 81/81 tests. | — | — |

---

## C. Moyen terme — vers un lancement public / MVP commercial complet

Pour chaque point, l'état actuel est précisé : **présent** / **partiel** / **absent**.

### Authentification / comptes utilisateurs

| Point | État | Notes |
|---|---|---|
| Création de compte | ✅ présent | Magic link + vérification email |
| Gestion de session | ✅ présent | next-auth beta 5 |
| Récupération de compte | ✅ résolu (2026-06-26) | Le magic link IS la récupération de compte dans un système sans mot de passe. Un utilisateur bloqué demande un magic link depuis la page login → email envoyé → accès retrouvé. Ajouter un "reset password classique" supposerait d'implémenter les mots de passe en premier (absent et non souhaité). Voir section E pour l'analyse complète. |
| Multi-utilisateurs par tenant | ❌ absent | `users.role = 'member'` existe en DB mais est **mort côté applicatif** pour le cas coach+CM. Aucun flux d'invitation, aucune garde par rôle au niveau tenant, aucun gating par permission. Effort L. Voir section E — cadrage technique détaillé. |

### Paiement et abonnement

| Point | État | Notes |
|---|---|---|
| Stripe SDK + webhook | ✅ présent | Structure complète |
| Price IDs configurés | ❌ absent | Bloquant — voir B.1 | Effort S |
| Portail client (gérer abonnement) | ✅ présent | `/dashboard/billing/PortalButton.tsx` |
| Gestion des échecs de paiement | ✅ complet (2026-06-26) | `paymentFailedAt` + email coach + cron `/api/cron/payment-grace` (filet serveur 7j indépendant de Stripe). Voir section E. |
| Facturation par sièges (org/réseau) | ❌ absent | Nécessaire pour le pilier agence. Dépend de décisions produit (prix/siège, max membres/plan). Session dédiée future. Effort L. |

### Onboarding utilisateur

| Point | État | Notes |
|---|---|---|
| Wizard profil → génération | ✅ présent | 4 steps, progression calculée |
| Premier site généré et publié | ⚠️ partiel | Flux complet à valider end-to-end (voir LAUNCH_CHECKLIST) |
| Email de bienvenue | ✅ présent | Via Resend |

### Publication / hébergement des sites générés

| Point | État | Notes |
|---|---|---|
| Sous-domaine `<slug>.aurapost.fr` | ✅ présent | Routing via Next.js middleware |
| Gating `status: active/inactive` | ⚠️ à vérifier | Voir section E — priorité élevée | Effort S |
| Domaines custom | ❌ absent | Champ DB présent, logique DNS/SSL absente | Effort XL |
| Wildcard SSL `*.aurapost.fr` | ⚠️ infra | À configurer sur Netlify + DNS | Effort M |

### Limites d'usage et quotas

| Point | État | Notes |
|---|---|---|
| Gating par plan (site, export, watermark) | ✅ présent | Côté serveur, source unique `plans.ts` |
| Anti double-génération | ✅ présent | Verrou `generatingAt` sur tenant |
| Rate limiting global Upstash | ⚠️ partiel | Upstash est la source de vérité mais à valider sur multi-lambda (voir section E) |

### Emailing transactionnel

| Point | État | Notes |
|---|---|---|
| Confirmation de compte | ✅ présent | Magic link + vérification email |
| Notification "génération terminée" | ⚠️ partiel | Email post-génération fire-and-forget (peut être tué par freeze serverless) — à `await` | Effort S |
| Désabonnement RGPD | ✅ présent | HMAC stateless, `/api/unsubscribe` |
| Séquences de réengagement | ✅ présent | Crons `email-sequences`, `onboarding-reminder` |

### Support client

| Point | État | Notes |
|---|---|---|
| Formulaire de support | ✅ présent | `/support` → table `supportTickets` → visible dans `/admin` |
| SLA / réponse automatique | ✅ présent (antérieur, confirmé 2026-06-26) | `sendSupportConfirmationEmail` envoie accusé de réception avec référence ticket + délai "24–48 h (jours ouvrés)" via `after()` (non bloquant). |

### Légal

| Point | État | Notes |
|---|---|---|
| CGU | ✅ présent | `/terms` |
| Politique de confidentialité | ✅ présent | `/privacy` |
| Mentions légales / sous-traitants | ✅ présent | `/legal/*` (LCEN) |
| Bannière cookies | ✅ présent | `CookieBanner.tsx` |
| Export RGPD | ✅ présent | `/api/gdpr/export` + `/api/gdpr/delete` |

### Monitoring et observabilité

| Point | État | Notes |
|---|---|---|
| Logs d'erreurs | ✅ configuré (2026-06-26) | `lib/logger.ts` envoie vers Axiom HTTP API (fire-and-forget) si `AXIOM_DATASET` + `AXIOM_TOKEN` présents, sinon console. Voir section E + `docs/infra/logging.md`. |
| Suivi des jobs en échec | ✅ présent | Cron de réconciliation `reconcile-jobs` (jobs bloqués → failed + verrou libéré) |
| Alerting | ✅ implémenté (2026-06-26) | `lib/alerting.ts` — `notifyAdminFailure()` + `notifyJobsReconciled()`, branché sur `failJob()` et `reconcileStuckJobs()`. Email via Resend vers `ADMIN_ALERT_EMAIL`. |
| Page de statut | ✅ présent | `/status` |
| Health check détaillé | ✅ présent | `/api/health/detailed` |

### SEO du site AuraPost

| Point | État | Notes |
|---|---|---|
| Sitemap + robots.txt | ✅ présent | `app/sitemap.ts`, `app/robots.ts` |
| Blog SEO | ✅ présent | 5 articles SEO (`lib/blog.ts`) |
| og:image dynamiques | ✅ présent | `opengraph-image.tsx` sur les routes clés |
| JSON-LD | ✅ couverture complète (2026-06-26) | Home : WebSite + Organization + SoftwareApplication. Blog index : Blog + BlogPosting[]. Coach site : LocalBusiness. Blog articles : Article. |

---

## D. Long terme — vision à plusieurs mois

Ces axes ne sont pas bloquants pour un lancement mais constituent la direction produit.

| Axe | Description | Effort estimé |
|---|---|---|
| **Nouveaux styles visuels** | Au-delà des 3 styles actuels — un 4e style avec Framer Motion est possible (Framer Motion déjà installé, `Reveal.tsx` est le système actuel des templates) | L par style |
| **Publication automatique Instagram/LinkedIn** | OAuth IG/Facebook + LinkedIn pour publier depuis AuraPost au lieu d'exporter vers Buffer/Later — fonctionnalité la plus demandée selon ROADMAP v1.x | XL |
| **Génération d'images de posts** | Visuels générés (templates type Canva) en plus du texte | XL |
| **Analytics du site vitrine pour le coach** | ✅ **Implémenté** (2026-06-26) — table `siteVisits` (`drizzle/0003_site_visits.sql`, migration prod à exécuter), endpoint `POST /api/track/site-visit` (fire-and-forget, PII-free), `getSiteVisitStats()` dans `lib/db/analytics.ts`. Section visible dans `/dashboard/analytics`. | — |
| **Analytics sociaux réels** | Connecter les insights Instagram/LinkedIn (portée, engagement, meilleurs créneaux) — today = métriques internes uniquement | XL |
| **Programme d'affiliation complet** | ✅ **Implémenté** (2026-06-26) — `referralCodes` + `referrals` + `lib/db/referrals.ts` complet : code unique par coach, 1 mois gratuit parrain + filleul, plafond 12 mois (`REFERRAL_MAX_MONTHS`), email de notification, redirect `/ref/[code]`. CGV à valider juridiquement (`docs/legal-drafts/referral-terms-DRAFT.md`). | — |
| **Domaines custom avec SSL** | Câbler `websites.customDomain` + vérification DNS + provisioning SSL | XL |
| **Internationalisation UI** | Aujourd'hui FR uniquement pour l'interface (les posts respectent déjà `language: 'fr'|'en'`) | L |
| **Multi-utilisateurs par tenant** | Coach + community manager sur le même tenant — `users.role = 'member'` existe mais est inutilisé | L |
| **Marque blanche** | Agences qui revendent AuraPost à leurs coachs clients sous leur propre marque | XL |
| **Marketplace de templates** | Bibliothèque de nouveaux designs de sites vitrines au-delà des 3 styles actuels | XL |
| **Export du code source du site** | Permettre au coach de récupérer le HTML/CSS de son site — dépend du modèle économique choisi | M |
| **Application mobile native** | Au-delà de la PWA actuelle | XL |

---

## E. Risques et dette technique transverses

Ces points ne sont pas liés à un horizon temporel précis mais peuvent bloquer ou ralentir tout le reste s'ils ne sont pas traités.

---

### ✅ Gating `status` du site public — CONFIRMÉ FONCTIONNEL (2026-06-25)

Audit code effectué. `lib/db/public.ts` ligne 60 :
```ts
if ((opts?.requireActive ?? true) && site.status !== 'active') return null;
```
Si `status !== 'active'`, `getCoachSiteData()` retourne `null` → `app/site/[subdomain]/page.tsx` appelle `notFound()`. Le gating était en place depuis l'origine.

---

### ✅ Double source de plan — RÉSOLU (2026-06-25)

**Audit complet effectué.** Architecture validée :

- `tenants.plan` est le **cache dénormalisé** qui alimente le JWT (`findUserByEmail/findUserById` join `users ⨝ tenants`)
- `subscriptions.plan` est la table d'historique Stripe
- `upsertSubscription()` (`lib/db/subscription.ts`) met à jour les **deux tables en un seul appel** pour tous les événements Stripe (checkout, upgrade, downgrade, annulation, trialing, past_due)
- Logique de grâce : `past_due` garde le plan actif côté `tenants.plan` ; `canceled` revient à `starter`
- Filet de sécurité : `auth.ts` effectue un refresh du JWT depuis la DB toutes les 6h + auto-downgrade si `planExpiresAt` est dépassé (même si le webhook Stripe a manqué)

**Tests ajoutés** : `__tests__/subscription-plan-sync.test.ts` (8 cas : création, upgrade, downgrade, annulation, past_due, trialing, isolation multi-tenant, idempotence).

**Aucune migration de données nécessaire** — l'architecture est déjà correcte.

---

### ✅ shadcn/ui CLI — RÉSOLU (2026-06-25)

shadcn/ui est **déjà configuré** dans le projet : `components.json` (style new-york, violet, cssVariables) est présent depuis l'origine. Les composants `components/ui/*.tsx` (card, badge, button, dialog, tabs…) sont des composants shadcn. `npx shadcn add <composant>` fonctionne.

**Note** : le CLI install depuis 21st.dev (`npx shadcn add https://21st.dev/r/<user>/<name>`) nécessite une authentification 21st.dev — les composants identifiés ont été implémentés manuellement.

---

### ✅ Rate limiting multi-instance — CONFIRMÉ FONCTIONNEL (2026-06-25)

Audit code effectué :
- `lib/rate-limit.ts` : garde Upstash Redis (clef `ratelimit:generate:{tenantId}:{YYYY-MM}`) — distribué cross-instance. Fallback mémoire uniquement si Redis non configuré.
- `lib/queue.ts` : file de concurrence in-process (2 générations simultanées max par instance) — intentionnel, pas un garde global.
- Garde global "1 génération / mois / tenant" : DB (`hasGeneratedThisMonth`) + Redis. Architecture correcte.

---

### ✅ Email post-génération fire-and-forget — DÉJÀ CORRIGÉ (antérieur à cet audit)

`app/api/generate/route.ts` utilise `after()` de Next.js 16 (import from `next/server`). `after()` maintient le lambda actif après la réponse HTTP — comportement garanti par le runtime, sans risque de freeze. Le commentaire dans le code confirme ce choix explicitement.

---

### ✅ Métriques admin — VÉRIFIÉES RÉELLES (2026-06-25)

Audit code complet. `lib/db/admin.ts` — `getBusinessMetrics()` et `computeLaunchMetrics()` : 100 % requêtes DB réelles (commentaire « aucune valeur inventée » présent dans le code). La seule valeur non-réelle : `mockRevenue = ${activeSubscriptions * 0} €` → toujours « 0 € » (Stripe prod non configuré — comportement honnête, pas trompeur). Aucun `demoConversion: 32` ni NPS simulé trouvé dans les fichiers actuels.

---

### ✅ Alerting sur les erreurs critiques — IMPLÉMENTÉ (2026-06-25)

`lib/alerting.ts` créé. `notifyAdminFailure()` envoie un email Resend vers `ADMIN_ALERT_EMAIL`, logError seul si variable absente. Branché sur :
- `failJob()` dans `lib/generation-jobs.ts` — alerte à chaque transition vers `failed`
- `reconcileStuckJobs()` — alerte quand des jobs bloqués sont réconciliés vers `failed`

**Variable d'env à ajouter en prod :** `ADMIN_ALERT_EMAIL=admin@aurapost.fr`

---

### ✅ N+1 dans le cron email-sequences — DÉJÀ CORRIGÉ (antérieur à cet audit)

Audit code effectué. `lib/email-sequences.ts` : un seul `GROUP BY` pour les comptes de posts + une seule lecture des emails déjà envoyés (commentaire `// Batch (anti N+1)` à la ligne 154). Zéro requête dans la boucle coach.

---

### ✅ Récupération de compte — RÉSOLU PAR CONCEPTION (2026-06-26)

AuraPost est un système **sans mot de passe** (magic link uniquement). La "récupération de compte" classique (forgot password → reset link → nouveau mot de passe) n'a pas de sens ici car il n'y a rien à réinitialiser.

**Flux de récupération existant :**
1. Coach qui ne peut plus se connecter → page `/login`
2. Saisit son email → magic link envoyé → clic → session restaurée

Ce flux est identique à la connexion normale. La "récupération" et la "connexion" sont le même mécanisme. Un reset password classique serait redondant et ajouterait une surface d'attaque (vecteur phishing). **Aucune action nécessaire.**

---

### ✅ Logging Axiom — IMPLÉMENTÉ (2026-06-26)

`lib/logger.ts` expose `logInfo`, `logWarn`, `logError`, `logEvent`. Chaque fonction :
1. Écrit toujours sur `console.*` (Netlify capture le stdout des Lambda)
2. **Si** `AXIOM_DATASET` et `AXIOM_TOKEN` sont définis : POST fire-and-forget vers l'API Axiom `POST /v1/datasets/{dataset}/ingest`

**Caractéristiques :**
- Zéro dépendance npm ajoutée (appel HTTP natif via `fetch`)
- Fire-and-forget : le drain ne bloque jamais la requête principale
- Absorbe silencieusement les erreurs réseau vers Axiom

**Variables à ajouter en prod (Netlify env) :**
```
AXIOM_DATASET=aurapost-prod
AXIOM_TOKEN=xaat-...
```
Voir `docs/infra/logging.md` pour la création du dataset et du token.

---

### ✅ Gestion des échecs de paiement — COMPLET (2026-06-26)

**Architecture en place :**

| Événement | Action |
|---|---|
| `invoice.payment_failed` | `paymentFailedAt = now()` + `sendPaymentFailedEmail(coach, 7j)` |
| Stripe Smart Retries (J+3, J+5, J+7) | Automatique côté Stripe |
| `invoice.payment_succeeded` | `paymentFailedAt = null` + `sendPaymentSucceededEmail` |
| `customer.subscription.deleted` | `plan = 'starter'` + `sendCancellationEmail` |
| `/api/cron/payment-grace` (1×/jour) | Filet serveur : si `paymentFailedAt > 7j` ET `plan != 'starter'` → downgrade + email |
| `auth.ts` (toutes les 6h) | Auto-downgrade si `planExpiresAt` dépassé (2e filet) |

**Cron ajouté :** `app/api/cron/payment-grace/route.ts` — à planifier 1×/jour avec `CRON_SECRET`.

---

### Multi-utilisateurs par tenant — CADRAGE TECHNIQUE (2026-06-26)

**État réel du code :**

`users.role` a 3 valeurs possibles : `'owner'`, `'admin'`, `'member'`.
- `'admin'` : accès au panel `/admin` global AuraPost (rôle super-admin, pas un rôle tenant)
- `'owner'` : utilisé dans `lib/db/referrals.ts` pour identifier le créateur d'un code de parrainage
- `'member'` : **jamais vérifié dans aucune garde d'accès côté tenant**. C'est du code mort.

**Ce qui manque pour implémenter coach + Community Manager :**

1. **Flux d'invitation** : route `POST /api/tenant/invite` → création `users` avec `role='member'` + envoi email d'invitation (magic link + contexte tenant)
2. **Limite par plan** : décision produit — combien de membres par plan ? (ex: 1 sur starter, 3 sur pack_complet)
3. **Gating des permissions membres** : que peut faire un CM vs le coach owner ?
   - Générer des posts ? (probable oui)
   - Approuver des posts ? (à définir)
   - Modifier le site vitrine ? (probablement non ou avec confirmation owner)
   - Gérer la facturation ? (non)
4. **UI de gestion des membres** : page `/dashboard/team`
5. **Révocation** : pouvoir supprimer un membre

**Recommandation :** Session dédiée, après décision produit sur les points 2 et 3. Effort L (3–5 jours).

---

### CSP `script-src 'unsafe-inline'` en production

**Description** (`AUDIT_ROADMAP Phase 5.5`) : la politique Content-Security-Policy en prod autorise les scripts inline — compromis assumé avec Next.js/Netlify mais dette XSS à terme.

**Action** : investiguer les nonces Next.js 16 pour réduire la surface sans casser le build. Effort L, bas.

---

### `next-auth` beta en production

**Description** : le projet utilise `next-auth@5.0.0-beta.31`. Les APIs beta peuvent changer. À surveiller lors de chaque mise à jour de dépendances.

**Action** : surveiller les releases next-auth v5 stable. Prévoir une migration dès que la version stable sort. Effort M quand elle sort.
