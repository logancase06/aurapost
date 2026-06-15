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
