# AuraPost — Roadmap post-audit

> Issue de l'audit code du 2026-06-15. Priorisée par **bloquant → pitch → piliers produit → dette**.
> Effort : **S** (<½ j) · **M** (1-2 j) · **L** (3-5 j) · **XL** (>1 sem). Impact : 🔴 critique · 🟠 fort · 🟡 moyen.
>
> Légende statut : ❌ absent · ⚠️ partiel/gaté · 🐛 bug · 🔧 dette.

---

## Phase 0 — Bloquants production (AVANT toute démo/pitch)

| # | Tâche | Statut | Effort | Impact | Où |
|---|-------|--------|--------|--------|-----|
| 0.1 | **Configurer l'infra réelle** : `TURSO_DATABASE_URL`+token, `UPSTASH_REDIS_*`, `ANTHROPIC_API_KEY`, `RESEND_*`, `STRIPE_*`, `NEXTAUTH_SECRET`, `APP_DOMAIN`. Lancer `npm run deploy-check`. | ⚠️ | S | 🔴 | `.env`, `scripts/deploy-check.ts` |
| 0.2 | **Garde anti-fallback DB en prod** : faire échouer le boot (ou bannière rouge) si `NODE_ENV=production` et `!TURSO_DATABASE_URL`, au lieu de tomber silencieusement en `:memory:`. | 🐛 | S | 🔴 | `lib/db/index.ts:18,34` |
| 0.3 | **Retirer / étiqueter les métriques truquées** admin (`demoConversion:32`, `nps:58`, MRR simulé). Brancher `getLaunchMetrics` réelles ; marquer le reste « exemple ». | 🐛 | M | 🔴 | `lib/db/admin.ts:226-234`, `AdminInsights.tsx:41-45` |
| 0.4 | **Vérifier timeout génération** sur l'hébergeur (Netlify cap souvent <30 s vs `maxDuration=60`). Sinon : streaming/job async ou réduire la charge par appel. | ⚠️ | M | 🟠 | `api/generate/route.ts:18` |
| 0.5 | **Fiabiliser l'email post-génération** (fire-and-forget tué par le freeze serverless) : `await` avant réponse, ou file/cron. | 🐛 | S | 🟠 | `api/generate/route.ts:67-74` |
| 0.6 | **Auditer `/api/gdpr/delete` et `/api/gdpr/export`** (destructif, hors préfixe protégé du middleware) : confirmer `auth()`+`requireTenantId()` + confirmation. | ⚠️ | S | 🟠 | `app/api/gdpr/*` |

---

## Phase 1 — Pitch-ready (cible : 1 semaine)

| # | Tâche | Effort | Impact | Où |
|---|-------|--------|--------|-----|
| 1.1 | **Seeder un jeu de démo crédible** + figer le parcours happy-path (générer → approuver → site → calendrier). Réutiliser `/demo/vincent`. | M | 🔴 | `scripts/seed.ts`, `app/demo/[slug]` |
| 1.2 | **Masquer/assumer les « Bientôt »** visibles en live : domaine perso désactivé, « paiement bientôt », galerie `/coaches` vide. | S | 🟠 | `SiteEditor.tsx:204-206`, `UpgradeButton.tsx:26`, `LandingClient.tsx:176`, `coaches/page.tsx` |
| 1.3 | **Corriger les incohérences de prix** : aligner landing/docs (`placeholder 0`, « prix bientôt ») sur les vrais montants de `plans.ts` (149€/209€). | S | 🟡 | `LandingClient.tsx:176`, `ARCHITECTURE.md:438`, `CHANGELOG.md:185` |
| 1.4 | **Activer Stripe checkout** (poser `STRIPE_PRICE_CONTENT_ONLY` / `STRIPE_PRICE_PACK_COMPLET` + webhook secret) et tester l'idempotence du webhook. | M | 🟠 | `api/stripe/create-checkout`, `api/webhooks/stripe` |
| 1.5 | **Mockup cliquable de la couche agence** (si 2.x non livrable à temps) pour pitcher la vision sans démo cassée. | M | 🟠 | nouveau |

---

## Phase 2 — Pilier « Réseau / Agence multi-compte » (cœur du pitch Herbalife)

> Le produit est aujourd'hui **mono-tenant = mono-coach**. C'est ~80 % d'un nouveau pilier, pas un ajustement.

| # | Tâche | Effort | Impact | Notes |
|---|-------|--------|--------|-------|
| 2.1 | **Modèle organisation → tenants** : table `organizations` + rattachement `tenants.org_id`, rôles org (`org_admin` / `distributor`). L'isolation par `tenantId` existe déjà → migration additive. | L | 🔴 | schéma additif, pas de refonte |
| 2.2 | **Sélecteur de contexte / bascule** entre distributeurs pour un compte parent (agir « au nom de »). | M | 🔴 | réutilise `requireTenantId()` scopé à l'org |
| 2.3 | **Onboarding/invitations en masse** des distributeurs (lien d'invitation, import liste). | L | 🟠 | |
| 2.4 | **Reporting global agrégé** par org (qui a généré, % prêts à publier, taux d'approbation) — réutiliser le pattern `getLaunchMetrics` scopé org. | M | 🔴 | `lib/db/admin.ts` → version org |
| 2.5 | **Brand kit verrouillable** : logo + palette + ton imposés au niveau org, hérités par chaque distributeur (override limité). | L | 🔴 | étend `themeColor`/styles existants |
| 2.6 | **Templates de contenu validés marque** : bibliothèque de gabarits approuvés dans lesquels le distributeur génère + workflow d'approbation descendant. | XL | 🔴 | étend `content-generator` |
| 2.7 | **Facturation par sièges** (un payeur, N distributeurs). | L | 🟠 | étend Stripe |
| 2.8 | **Garde-fous conformité MLM** : filtre/avertissement sur allégations revenus & santé (juridique Herbalife). | M | 🟠 | post-génération |

---

## Phase 3 — Pilier « Agence marketing multi-clients » (proche de Phase 2)

| # | Tâche | Effort | Impact | Notes |
|---|-------|--------|--------|-------|
| 3.1 | **Multi-tenant délégué** : un user rattaché à plusieurs tenants + sélecteur (l'agence gère N coachs clients). | M | 🟠 | s'appuie sur 2.1-2.2 |
| 3.2 | **Approbation à deux niveaux** : agence rédige/génère → coach valide (ou inverse). | M | 🟠 | étend statuts posts |
| 3.3 | **Facturation agence** (un payeur, N clients). | M | 🟡 | = 2.7 |
| 3.4 | **Marque blanche** : sous-domaine + logo de l'agence. | L | 🟡 | ROADMAP v1.5 existante |
| 3.5 | **Rôles réels** (`users.role='member'` aujourd'hui inutilisé). | M | 🟡 | schema.ts |

---

## Phase 4 — Features produit manquantes (roadmap v1.x existante)

| # | Tâche | Effort | Impact | Réf |
|---|-------|--------|--------|-----|
| 4.1 | **Publication automatique** (OAuth IG/Facebook + LinkedIn) — aujourd'hui export Buffer/Later seulement. | XL | 🟠 | ROADMAP v1.1 |
| 4.2 | **Génération d'images** de posts (visuels). | XL | 🟠 | ROADMAP v1.1 |
| 4.3 | **Analytics sociaux réels** (reach/engagement) — actuel = taux d'approbation interne, pas de perf réseau. | XL | 🟠 | ROADMAP v1.4, `lib/db/analytics.ts` |
| 4.4 | **Domaine personnalisé** : câbler la colonne `websites.customDomain` + vérif DNS. | L | 🟡 | `SiteEditor.tsx:204` |
| 4.5 | **Comptes multi-utilisateurs** par tenant (coach + community manager). | L | 🟡 | ROADMAP v1.3 |
| 4.6 | **Affiliation complète** (paiements commissions auto) — parrainage basique déjà là. | L | 🟡 | ROADMAP v1.3 |
| 4.7 | **i18n UI complète** (aujourd'hui FR ; seuls les posts respectent la langue). | L | 🟡 | `lib/i18n.ts` |
| 4.8 | **Push PWA** au-delà de la base. | M | 🟡 | `public/sw.js` |

---

## Phase 5 — Dette technique, bugs & sécurité

| # | Tâche | Effort | Impact | Où |
|---|-------|--------|--------|-----|
| 5.1 | **N+1 cron `runEmailSequences`** : batcher comptes posts + logs (jusqu'à 2000 coachs × 2 req). | M | 🟡 | `lib/email-sequences.ts:162-194` |
| 5.2 | **`generatedMode` non posé** sur variantes & pack de légendes → fausse les stats api/mock. | S | 🟡 | `lib/db/posts.ts` (createVariant, captionPack) |
| 5.3 | **Copy email mensuel en dur** « 8 IG + 4 LinkedIn » quel que soit le `count`. | S | 🟡 | `lib/email.ts:159-169` |
| 5.4 | **Rate-limit/queue par instance** : sur serverless multi-lambda, la limite (2 générations, 30 req/min IP) n'est pas globale. Vérifier qu'Upstash est bien la source de vérité partout. | M | 🟠 | `proxy.ts:12`, `lib/queue.ts:58`, `lib/rate-limit.ts` |
| 5.5 | **CSP `script-src 'unsafe-inline'`** en prod → dette XSS (compromis Next/Netlify assumé). | L | 🟡 | `proxy.ts:42` |
| 5.6 | **Consolider les 3 chemins d'édition de site** (`/onboarding/site`, `/editor`, `/explore`) — UX redondante. | M | 🟡 | `app/dashboard/website/*` |
| 5.7 | **Synchroniser les docs** : CHANGELOG « 22 tests » → 33 ; « placeholder 0 » → vrais prix. | S | 🟡 | `CHANGELOG.md`, `ARCHITECTURE.md` |

---

## Vue d'ensemble — séquencement recommandé

```
Semaine 0   ▸ Phase 0 (bloquants) + Phase 1.1–1.3   → démo solo fiable, sans faux chiffres
Semaine 1   ▸ Phase 1.4–1.5                          → Stripe live + mockup agence pour le pitch
Sprint 1-2  ▸ Phase 2.1, 2.2, 2.4, 2.5               → tranche verticale réseau démontrable
Sprint 3-4  ▸ Phase 2.6, 2.7, 2.8 + Phase 3          → réseau + agence complets
Backlog     ▸ Phase 4 (v1.x) + Phase 5 (dette)       → en continu
```

## Scores cibles après chaque phase

| Critère | Aujourd'hui | Après P0+P1 | Après P2 |
|---|---|---|---|
| Solo coach | 7/10 | 8/10 | 8/10 |
| Pitch agence | 3/10 | 5/10 (vision) | 8/10 |
| 50 distributeurs | 3/10 | 4/10 | 7/10 |
| Démo live 20 min | 6/10 | 8/10 | 9/10 |

---

# Run #6 (pré-déploiement) — 2026-06-16

- ✅ **Fix critique — cron de réconciliation des jobs** : `/api/cron/reconcile-jobs` (running>5min/pending>10min → failed + verrou libéré + nettoyage). Le blocage que j'avais signalé est résolu. 50 tests.
- ✅ **Docs déploiement** : crons (DEPLOY.md + netlify.toml), `GENERATION_ASYNC`/`CRON_SECRET` requis en prod.
- ⚠️ **Lint** : 7 erreurs react-hooks **préexistantes** (build vert, non bloquantes) — à trier hors déploiement.
- ❌ **Non traités** (non bloquants pour le déploiement) : F1 onboarding court, E1 villes/partenaires, E2 rétention, B2 facturation siège, 6.2 outreach, H4 multi-provider, G2 CSP nonces.

---

# Run nocturne #5 — 2026-06-16

- ✅ **Fix 0 — flag `is_demo`** : démo exclue de toutes les métriques admin (seed:demo safe en prod). Colonnes + filtres + health.
- ✅ **H3 — génération asynchrone + streaming** : table `generation_jobs`, `GENERATION_ASYNC` flag, route 202 < 500 ms, polling + progression, compat descendante. **Fin du timeout 26 s.** Réussi du 1er coup (pas de revert).
- ❌ **Non traités ce run** : F1 onboarding court, B2 facturation siège, E2 rétention, 6.2 outreach, H4 multi-provider, G2 CSP nonces, E1 (villes/partenaires). Priorisé les 2 plus risqués/impactants (Fix 0 + H3) pendant que frais, gardé vert.

---

# Run nocturne #4 — 2026-06-16

- ✅ **Fix local (Item 1)** : service worker dev-only (fin de la boucle Failed to fetch). Mockups/manifest OK (n'étaient pas manquants).
- ✅ **Seed agence (Item 2)** : « Réseau Vitalité France » + 8 distributeurs à états variés (3 actifs / 2 inactifs / 2 jamais connectés / 1 en attente avec allégation). **Le jeu de données qui manquait pour le pitch.**
- ✅ **Demo-live agence (Item 12)** : `/demo-live?token=…&mode=agency` (dashboard manager read-only) + `DEMO_SCRIPT.md`. Vérifié au runtime.
- ❌ **Item 3 (jobs async / streaming)** : non fait — gros refactor du chemin de génération critique (risque vert) ; **#1 technique restant**.
- ❌ **Items 4-11** : F1 onboarding court, E1 villes/partenaires, B2 facturation siège, E2 rétention, 6.2 outreach, H4 multi-provider, G2 CSP nonces, H5 docs complet — non traités (chacun = incrément conséquent). Priorisé : fix local + démo réseau (le but du pitch).

---

# Run nocturne #3 — 2026-06-16

- ✅ **Fix critique — `first_login_at`** : suivi de connexion (first/last/count) via event signIn. Reporting org en 3 états (jamais connecté / inactif / actif). **La métrique d'adoption que demandait Herbalife.**
- ✅ **Fix PWA** : service worker résilient (plus de `Uncaught Failed to fetch` réseau down).
- ✅ **E1 (partiel)** : 5 articles de blog SEO (sitemap auto, JSON-LD, CTA). **Restent** : pages `/coaches/[ville]`, `/partenaires`, vérif parrainage.
- ✅ **F2** : `prefers-reduced-motion` global.
- ✅ **D2 crons** : `/api/cron/distributor-activation` (J+1/3/7 + réengagement, idempotent).
- ✅ **F3** : ton B2B sobre (emojis retirés des surfaces agence).
- ✅ **G3** : `/api/gdpr/*` gardé au middleware + 401 JSON pour API protégées.
- ✅ **H1 (lite)** : test garde anti-dérive `schema.ts` ↔ `bootstrap-schema.ts`. **H2** : CI GitHub Actions déjà présente (tsc+build+test).
- ✅ **Opérationnel** : dev DB régénérée (les nouvelles colonnes cassaient le `next dev` local) — pas de bug d'encodage, le site sert en UTF-8 correct (vérifié, `Ferré` OK).
- ❌ **Restent (les plus lourds)** : B2 facturation par siège (Stripe quantity), H3 jobs async, F1 onboarding court, G2 CSP nonces, E2 rétention, H4 multi-provider, 6.2 outreach, H5 docs, E1 (villes/partenaires).

---

# Run nocturne #2 (P1 → P2) — 2026-06-16

- ✅ **Fix critique** `analyzeReviews` API-first (était mock-only en prod). Même classe de bug que `analyzeInstagram`.
- ✅ **Fix** mention d'hébergement sous-traitants dans `/privacy`.
- ✅ **D1 — File de validation MLM** : `requires_approval`, statut `pending_approval`, page `/dashboard/org/approvals` (approuver/rejeter + commentaire + email + audit), blacklist élargie, badge allégation, toggle. **(le levier signature Herbalife)** + 3 tests.
- ✅ **Site** : `lib/coach-site-theme.ts` (thème par spécialité, source unique accent/mood).
- ❌ **A1 publication LinkedIn/Meta** : non faite (interdit sans credentials — risque non testable).
- ❌ **E1 acquisition SEO** (5 articles, `/coaches/[ville]`, `/partenaires`, parrainage) : non faite.
- ❌ **D2 crons J+1/3/7** : non faits (manque `first_login_at`). Relance manuelle ✅ (run précédent).
- ❌ **B2 facturation par siège Teams** : non faite (Stripe quantity).
- ❌ **P2** (F1 onboarding court, H3 jobs async, H1 schéma source unique, H2 tests/CI, F2 reduced-motion, F3 ton B2B, G2 CSP nonces, G3 GDPR delete gating, E2 rétention, H4 multi-provider, 6.2 outreach) : non traités.

---

# Run nocturne autonome (P0 → P2) — 2026-06-16

> Référentiel des priorités : `ROADMAP_DEFAUTS_SOLUTIONS.md`. Gate vert (tsc + build + 38 tests) après chaque item.

## P0 — Survie & premier revenu
- ✅ **C1 Qualité du contenu** : prompt de production refait (voix imitée, clichés bannis, spécificité obligatoire, variété de structure, few-shot) ; mock enrichi réécrit sans clichés (éval Vincent : ~10/12 publiables, 0 cliché). Génération du site : partiellement (posts traités ; copy site = à itérer).
- ✅ **B1 Pricing** : Découverte 0 € (4 posts IG + watermark), Coach 39 €, Coach+Site 79 €, Teams (source unique). `getPlanLimits` applique le Free tier ; génération respecte les limites ; watermark à la copie ; `/pricing` à 3 offres ; MRR recalculé. Tests ajoutés.
- ✅ **P0.3 Analyse profil** (feature complète) : `/dashboard/analyze`, scores + reco + réécriture bio/hashtags + créneaux + action ; table `profile_analyses` ; routes (3/j, mock) ; carte dashboard + nav ; analyse auto onboarding + email.
- ✅ **G4 Déploiement** : `deploy-check` bloquant (Turso/Anthropic/NextAuth), health `mode/version`, alerte `/status` PROD-MOCK, checklist DEPLOY.md.

## P1 — Croissance
- ✅ **D2 Adoption distributeurs** : 1er mois auto à l'invitation (garde coût/timeout), badge « Inactif 7j+ » + relance en masse. Crons J+1/3/7 : ⚠️ différés (suivi de connexion manquant).
- ✅ **G1 RGPD sous-traitance** : `/legal/sous-traitants`, `/legal/registre` (admin), opt-out + base légale dans l'email distributeur.
- ❌ **A1 Publication LinkedIn native** : non faite (OAuth XL, non testable sans credentials LinkedIn — risque/vérifiabilité). Reste prioritaire.
- ❌ **D1 Conformité MLM (file de validation)** : non faite (la base — blacklist + badge + page — existe déjà depuis la session précédente).
- ❌ **E1 Acquisition** (blog, /coaches/[ville], /partenaires) : non faite.

## P2 — Scale
- ❌ Non traitées ce run : F1 onboarding court, H3 jobs async, H1 schéma source unique, H2 tests org/E2E CI, F2 reduced-motion, F3 ton B2B, G2 CSP nonces, G3 GDPR delete gating.
- ✅ **Auto-eval** : risque coût/timeout de la génération inline à l'import CSV détecté et corrigé (mock-only / invitation unitaire).

---

# Journal d'implémentation (run autonome)

## ✅ Phase 0 — Bloquants production
- ✅ **0.1** Probe DB réelle déjà présente (`/api/health/detailed`) + avertissement en gras dans `DEPLOY.md`.
- ✅ **0.2** Garde anti-fallback : throw explicite en prod si `TURSO_DATABASE_URL` absent (hors build), warning non silencieux en dev. `lib/db/index.ts`.
- ✅ **0.3** Faux chiffres admin supprimés (NPS/conversion/MRR simulés) → `getBusinessMetrics` 100 % réel + état « En attente des premières données ». `lib/db/admin.ts`, `AdminInsights.tsx`.
- ✅ **0.5** Email post-génération garanti via `after()` (Next 16). `api/generate/route.ts`.
- ⚠️ **0.4** `maxDuration=26` posé. **Génération progressive (streaming par post) = MVP différé** : l'architecture est un appel Claude unique atomique (le plus rapide) ; le streaming par post serait plus lent et coûteux. Effet « temps réel » traité côté Phase 5 (UI). Recommandation prod free-tier : mode tunnel ou plan Pro.
- ✅ **0.6** GDPR `delete`/`export` appellent déjà `auth()` + `requireTenantId()` en premier (vérifié, aucun changement requis).

## ✅ Phase 1 — Pitch-ready
- ✅ **1.1** Seed démo Vincent/Sophie/Thomas (états variés : publié / brouillon / onboarding incomplet), photos + avis + statuts → analytics réels. `npm run seed:demo`. Vérifié en exécution.
- ✅ **1.2** Champ domaine perso (mort) masqué dans l'éditeur. Billing gère déjà Stripe non configuré (alerte + mock).
- ✅ **1.3** Prix cohérents : landing « 14 jours gratuits » (vrais prix déjà via `formatPrice`), `ARCHITECTURE.md` mis à jour (149/209). Source unique `lib/plans.ts`.
- ✅ **1.4** `generatedMode` posé sur variantes + pack de légendes.
- ✅ **1.5** Email mensuel : breakdown « 8 IG + 4 LinkedIn » codé en dur → `count` réel.
- ⚠️ **1.6** `/dashboard/website/preview` consolidé (redirect vers editor) ✅. Fusion onboarding/site + explore en onglets : **laissée distincte** (étapes/flux différents, fusion risquée) — documenté MVP.

## ✅ Phase 1.5 — Mockup agence
- ✅ `/agency-demo` (hero B2B, mockup dashboard réseau étiqueté « exemple », brand kit, 3 étapes, formulaire) + `/agency-contact`.
- ✅ Table `agency_leads` + `POST /api/agency-contact` (zod + honeypot + rate-limit IP) → stockage + email admin + confirmation prospect (`after()`). Lien discret depuis la landing.

## ✅ Phase 2 — Couche organisation
- ✅ **2.1** Schéma `organizations`/`org_tenants`/`org_templates`/`org_brand_kit` (schema + bootstrap + migration) + data layer complet.
- ✅ **2.2/2.3** Dashboard `/dashboard/org` (membres+stats, invitation, brand kit, templates) via **server actions** (déviation assumée vs routes REST listées — idiomatique Next, même protection `requireTenantId` + rôle owner).
- ✅ **2.4** Héritage brand kit injecté dans le prompt de génération (`getProfileInput` → `brandConstraintsBlock`).

## ✅ Phase 5 — Différenciateurs démo
- ✅ **5.1** `/demo-live?token=` (vitrine Vincent lecture seule, bannière, noindex). Token via `DEMO_TOKEN` (défaut `demo`).
- ⚠️ **5.2** Génération temps réel (typewriter, compteur) : **différé** — architecture à appel unique atomique ; un vrai streaming par post nécessite SSE + job async. Documenté ; recommandation = animation de révélation côté démo.
- ✅ **5.3** Import CSV distributeurs (`/api/organizations/[slug]/import-members`) + rapport créés/rattachés/erreurs.
- ✅ **5.4** Reporting réseau `/dashboard/org/reporting` (KPIs réels + top/bottom 5 + export CSV). Filtre par période = MVP (vue courante).
- ✅ **5.5** Onboarding agence `/agency/onboarding` (wizard 4 étapes).
- ✅ **5.6** Conformité MLM (liste noire défaut + mots org, badge « Conforme marque », page `/org/[slug]/compliance`).

## ✅ Phase 6 — Pitch
- ✅ **6.1** `/pitch` (deck 9 slides, clavier, plein écran, imprimable). Slide reporting = mockup inline (l'iframe `/dashboard/org` exigerait une session → contourné).
- ⚠️ **6.2** Email outreach + pixel tracking + `outreach_log` : **différé** (le tracker `/admin/leads` propose un email de suivi `mailto`).
- ✅ **6.3** `/agency-pricing` (3 plans + calculateur ROI **SSR sans JS** via formulaire GET).
- ✅ **6.4** Tracker `/admin/leads` (statuts, notes, suivi) + lien back-office.

## Phase 3 & 4 — Dette / stabilité
- ✅ **3.1** Rate-limit déjà distribué (Upstash + fallback mémoire) ; verrou de génération distribué via DB (`tenants.generating_at`). Aucun changement requis.
- ⚠️ **3.2** Équipe intra-tenant (`users.role` member) : **différé** (la couche org couvre le multi-compte ; priorité moindre).
- ⚠️ **3.3** CSP nonces : **différé** — `'unsafe-inline'` est un compromis Next/Netlify documenté ; le passage aux nonces risque de casser les styles inline.
- ✅ **4.1** N+1 cron email-sequences batché + test jest (35 tests).
- ✅ **4.2** Docs synchronisées (CHANGELOG 0.8.0, ROADMAP marqué livré, ARCHITECTURE prix, `PITCH_HERBALIFE.md` créé).
- ⚠️ **4.3** Screenshots Playwright `/screenshots/pitch/` : **non exécuté** (nécessite navigateur + serveur dev dans l'environnement) — script `npm run screenshots` disponible.
