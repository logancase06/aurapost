# ARCHITECTURE.md — AuraPost

> SaaS multi-tenant qui génère automatiquement du contenu Instagram & LinkedIn pour des
> coachs sportifs via l'API Anthropic, et qui leur loue un site web personnalisé hébergé
> sur sous-domaine.
>
> **Projet de référence absolu :** BlazeCheck (`../extincteur-ssi/`, prod sur `blazecheck.org`).
> AuraPost réutilise à l'identique ses patterns d'architecture, d'isolation multi-tenant,
> d'auth NextAuth v5, de cache Redis et de facturation Stripe. Ce document explique
> systématiquement *quoi* est repris et *ce qui change*.

---

## 1. Vision produit

| Persona            | Le coach sportif indépendant (CrossFit, running, yoga, prépa physique…)                        |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Douleur            | Il n'a pas le temps ni les compétences pour produire du contenu social régulier et professionnel |
| Promesse           | Un mois de contenu prêt à publier (8 posts Instagram + 4 posts LinkedIn) généré en 30 secondes  |
| Upsell             | Un site web vitrine personnalisé loué sur `<coach>.aurapost.fr`, alimenté par son profil         |
| Modèle économique  | Abonnement mensuel Stripe (Starter / Pro / Enterprise — prix à figer plus tard)                  |

Parcours type :

```
Inscription → Vérif email → Onboarding (profil coach) → Génération du mois →
Dashboard (approuver / rejeter / variante) → Publication → (option) Site web loué
```

---

## 2. Stack technique

Identique à BlazeCheck sauf mention contraire. Les choix sont volontairement alignés pour
réutiliser le savoir-faire, les patterns et la majorité du code d'infrastructure.

| Composant          | Technologie                                                                         | vs BlazeCheck |
| ------------------ | ----------------------------------------------------------------------------------- | ------------- |
| Framework          | Next.js 16 (App Router, Turbopack) + TypeScript                                     | identique     |
| Auth               | NextAuth v5 (`5.0.0-beta.31`) — JWT **7 jours**, magic links, credentials, bcrypt 12 | JWT 12h → **7j** (spec AuraPost) |
| Base de données    | Turso (SQLite via libSQL) + Drizzle ORM (`@libsql/client/http`)                      | identique     |
| **IA générative**  | **API Anthropic (`@anthropic-ai/sdk`) — `claude-opus-4-8` par défaut**              | **nouveau**   |
| Paiements          | Stripe (Checkout, webhooks, portail client)                                         | identique     |
| Cache / Rate limit | Upstash Redis (fallback in-memory si absent)                                        | identique     |
| Email              | Brevo (`@getbrevo/brevo` via API REST)                                              | identique     |
| Hébergement        | Netlify + `@netlify/plugin-nextjs` (fonctions serverless)                           | identique     |
| Stockage objets    | Cloudflare R2 (logos coach, visuels de site) — *phase ultérieure*                   | identique     |
| Monitoring         | Sentry (`@sentry/nextjs`) — *optionnel, activable par env*                          | identique     |
| Logs               | Logtail (`@logtail/node`) — fallback console                                        | identique     |
| UI                 | TailwindCSS 3, `lucide-react`, `react-hot-toast`                                    | identique     |
| Validation         | Zod 4 (schémas centralisés `lib/validation.ts`)                                     | identique     |
| Tests              | Jest 30 + `@testing-library/react`, isolation multi-tenant SQLite in-memory         | identique     |

### Pourquoi cette stack

- **Turso + Drizzle** : même couche d'accès que BlazeCheck → `requireTenantId()` garantit
  l'isolation, migrations versionnées, in-memory SQLite pour les tests d'isolation.
- **NextAuth v5 credentials + magic link** : un seul provider `Credentials` gère mot de passe
  *et* magic link (champ `type: 'magic'`), exactement comme BlazeCheck — pas de dépendance
  email-provider supplémentaire.
- **Anthropic SDK officiel** : génération de contenu déterministe via **structured outputs**
  (`output_config.format`) → JSON validé, jamais de parsing fragile.

---

## 3. Modèle de données (multi-tenant strict)

### 3.1 Différence clé avec BlazeCheck

BlazeCheck utilise `agencyId = id de l'admin fondateur` (le tenant est *implicite*, pas de table
dédiée). **AuraPost introduit une table `tenants` explicite** car un tenant porte des données
propres (plan, abonnement Stripe, nom commercial) indépendantes de l'utilisateur fondateur, et
parce qu'un site web loué appartient au tenant, pas à un user.

> **Règle d'or (héritée de BlazeCheck) :** toute mutation DB passe par `requireTenantId()`,
> toute lecture par `getTenantId()`. La colonne de cloisonnement s'appelle `tenant_id` sur
> **chaque** table métier. `tenant_id` = `tenants.id`.

### 3.2 Tables (8)

| Table             | Rôle                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `tenants`         | Le coach en tant qu'entité isolée. Porte le plan, les IDs Stripe, `plan_expires_at`, `owner_id`.  |
| `users`           | Comptes liés à un tenant. Rôles `owner` / `admin` / `member`. bcrypt, magic-link, vérif email.    |
| `coach_profiles`  | Spécialité, ville, style de contenu, ton souhaité (`motivant` / `educatif` / `personnel`), bio.   |
| `generated_posts` | Posts générés : `network` (`instagram`/`linkedin`), `status` (`draft`/`approved`/`rejected`), mois.|
| `subscriptions`   | Miroir de l'abonnement Stripe (statut, période, price). Source de vérité = webhooks Stripe.       |
| `websites`        | Site loué : `subdomain` (unique), `template`, `status` (`active`/`inactive`), `theme_color`.       |
| `magic_tokens`    | Tokens magic link **et** vérification email (même table, deux usages — comme BlazeCheck).         |
| `activity_logs`   | Journal d'activité par tenant (login, génération, approbation…).                                  |

### 3.3 Schéma détaillé

```
tenants
  id PK · name · owner_id · plan(starter|pro|enterprise) · stripe_customer_id ·
  stripe_subscription_id · plan_expires_at · created_at · updated_at

users
  id PK · tenant_id(idx) · email(unique) · password_hash(nullable=magic-only) ·
  full_name · role(owner|admin|member) · email_verified_at · consent_given_at ·
  onboarding_completed · created_at

coach_profiles
  id PK · tenant_id(idx) · user_id · display_name · speciality · city ·
  content_style · tone(motivant|educatif|personnel) · bio · target_audience ·
  created_at · updated_at

generated_posts
  id PK · tenant_id(idx) · network(instagram|linkedin) · status(draft|approved|rejected) ·
  theme · content · hashtags · call_to_action · month(YYYY-MM) ·
  variant_of_id(nullable) · generated_by · created_at · updated_at
  indexes: tenant_id · status · (tenant_id, month) · (tenant_id, status, created_at)

subscriptions
  id PK · tenant_id(idx) · stripe_customer_id · stripe_subscription_id ·
  stripe_price_id · plan · status(active|trialing|past_due|canceled|incomplete) ·
  current_period_end · created_at · updated_at

websites
  id PK · tenant_id(idx) · subdomain(unique) · custom_domain · template ·
  status(active|inactive) · theme_color · headline · published_at ·
  created_at · updated_at

magic_tokens
  id PK · email · token(idx) · expires_at · used_at · created_at

activity_logs
  id PK · tenant_id(idx) · user_id · action · target_id · details(JSON) · created_at
```

### 3.4 Isolation multi-tenant

```typescript
// Mutation → lève si pas de session
const tenantId = await requireTenantId();
await db.insert(generatedPosts).values({ tenantId, /* … */ });

// Lecture → [] si pas de session, sans erreur
const tenantId = await getTenantId();
if (!tenantId) return [];
return db.select().from(generatedPosts).where(eq(generatedPosts.tenantId, tenantId));
```

Test de régression (repris de BlazeCheck) : `__tests__/lib/db/multi-tenant-isolation.test.ts`
— DB SQLite in-memory, vérifie que le tenant A ne peut jamais lire/modifier les posts du tenant B.

---

## 4. Authentification (fonctionnelle dès maintenant)

Réplique fidèle de `lib/auth.ts` de BlazeCheck, adaptée au modèle `tenant`.

| Élément                | Détail                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Provider               | `Credentials` unique — gère mot de passe **et** magic link (`type: 'magic'` + `token`)        |
| Session                | JWT, `maxAge = 7 jours` (spec AuraPost), cookie `__Secure-…` en prod                          |
| Mot de passe           | bcrypt coût 12 ; validation force (`lib/auth-rate-limit.ts` → `validatePassword`)             |
| Magic link             | Token `nanoid(48)`, 1h, **claim atomique** (`UPDATE … WHERE used_at IS NULL` + `rowsAffected`)|
| Vérif email            | Token 48h, route GET `/api/auth/verify-email`, même table `magic_tokens`                      |
| Anti-énumération       | bcrypt factice à temps constant + réponse identique si email inconnu (magic-link)            |
| Rate limiting          | Redis+in-memory : login 10/15min/email, register 5/h/IP, magic 3/15min/IP                     |
| Révocation JWT         | Re-check DB toutes les 6h dans le callback `jwt` → compte supprimé = JWT invalidé             |
| Auto-downgrade plan    | Si `plan_expires_at` dépassé → retour `starter` dans le JWT + persistance DB                  |
| Contenu du token       | `id`, `tenantId`, `role`, `plan`, `planExpiresAt`, `emailVerifiedAt`                          |

Le `plan` vit sur le **tenant** : `findUserByEmail` / `findUserById` font une jointure
`users ⨝ tenants` pour exposer `plan` + `planExpiresAt` au JWT.

### Routes & pages auth

```
app/api/auth/[...nextauth]/route.ts   # handler NextAuth (GET/POST)
app/api/auth/register/route.ts        # crée tenant + user owner, rate-limité 5/IP/h
app/api/auth/magic-link/route.ts      # génère + envoie magic link (rate-limité 3/15min/IP)
app/api/auth/verify-email/route.ts    # consomme token de vérif (GET, redirige avec ?status=)

app/login/page.tsx                    # mot de passe + onglet magic link
app/register/page.tsx                 # inscription + consentement RGPD
app/auth/magic/page.tsx               # callback magic link (Suspense obligatoire)
app/auth/verify-email/page.tsx        # écran de statut vérif email
app/dashboard/page.tsx                # page serveur, redirige selon onboarding/rôle
```

### `proxy.ts` (middleware — source unique des headers de sécurité)

Repris de BlazeCheck (convention Next.js 16 + Netlify : `proxy.ts`, pas `middleware.ts`) :
CSP, HSTS, rate limiting sliding-window Upstash (30 req/min/IP), décodage JWT via `getToken()`
sans accès DB (Edge-compatible), redirection des non-authentifiés vers `/login`, blocage des
routes app si email non vérifié. CSP `connect-src` ajoute `https://api.anthropic.com`.

---

## 5. Génération de contenu (API Anthropic)

> Fonctionnalité #3. Détaillée ici pour figer les décisions ; implémentée après l'auth.

### 5.1 Client

`lib/anthropic.ts` — singleton, désactivé proprement si la clé est absente (même pattern que
`lib/stripe.ts`).

```typescript
import Anthropic from '@anthropic-ai/sdk';
export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
```

### 5.2 Modèle & paramètres

| Choix                | Valeur                          | Justification                                                            |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Modèle par défaut    | `claude-opus-4-8`               | Modèle le plus capable → qualité éditoriale maximale (cf. consigne globale) |
| Override coût        | `AURAPOST_MODEL` (env)          | Permet de basculer sur `claude-sonnet-4-6` si volume/coût l'exigent     |
| Thinking             | `{ type: 'adaptive' }`          | Le modèle décide de la profondeur de réflexion                          |
| Sortie               | `output_config.format` (JSON schema) | Structured outputs → posts strictement typés, zéro parsing fragile  |
| Streaming            | oui (`.stream()` + `.finalMessage()`) | 12 posts = sortie longue → évite les timeouts HTTP du SDK          |

**Pricing (par million de tokens, cache 2026-06) :** Opus 4.8 = **$5 in / $25 out** ·
Sonnet 4.6 = **$3 in / $15 out**. Un mois de contenu (~12 posts) tient dans quelques milliers de
tokens de sortie → coût marginal faible ; Opus 4.8 retenu par défaut pour la qualité, Sonnet 4.6
disponible via `AURAPOST_MODEL` pour les plans à fort volume.

### 5.3 Contrat de génération

Entrée = `coach_profiles` (spécialité, ville, ton, style, audience). Sortie = **8 posts Instagram
+ 4 posts LinkedIn** par mois, chacun : `network`, `theme`, `content`, `hashtags[]`,
`callToAction`. Le ton (`motivant` / `educatif` / `personnel`) pilote le prompt système.

```
POST /api/generate            # génère le mois courant pour le tenant (rate-limité, gate plan)
POST /api/posts/:id/variant   # régénère une variante d'un post existant (variant_of_id)
```

Les posts sont insérés en `status: 'draft'`. Le dashboard permet `approved` / `rejected` /
demande de variante (fonctionnalité #4).

---

## 6. Facturation Stripe

Structure de base (prix figés plus tard), reprise de BlazeCheck :

```
lib/stripe.ts                         # singleton Stripe (apiVersion figée)
lib/plan-guard.ts                     # isPro(), isPlanExpired(), isActivePro(), planGateResponse()
app/api/stripe/create-checkout/route.ts  # crée une Checkout Session
app/api/stripe/webhook/route.ts          # signature vérifiée → maj subscriptions + tenants.plan
```

Le webhook met à jour `subscriptions` (miroir) **et** `tenants.plan` + `plan_expires_at`. Le JWT
auto-rétrograde si `plan_expires_at` est dépassé (filet en cas de webhook manqué).

Plans & limites (`lib/plan-limits.ts`) — valeurs indicatives, à figer :

```
STARTER : 1 profil coach · génération 1×/mois · pas de site web
PRO     : génération illimitée · 1 site web loué · variantes illimitées
ENTERPRISE : multi-profils · domaine custom · support prioritaire
```

---

## 7. Site web loué (fonctionnalité #5)

Template Next.js personnalisé alimenté par `coach_profiles`, servi sur sous-domaine.

- `websites.subdomain` unique → routage par `proxy.ts` (lecture du `Host`) vers
  `app/(public-site)/[subdomain]/page.tsx` (rendu serveur depuis le profil + posts approuvés).
- `template` (`aura` / `momentum` / `minimal`) + `theme_color` → personnalisation visuelle.
- `status` (`active`/`inactive`) gate l'accès selon l'abonnement (Pro+).
- Domaine custom (`custom_domain`) en phase Enterprise.

---

## 8. Arborescence cible

```
aurapost/
  ARCHITECTURE.md
  README.md
  package.json · tsconfig.json · next.config.mjs · tailwind.config.ts · postcss.config.mjs
  drizzle.config.ts · eslint.config.mjs · .gitignore · .env.example · .env.local
  proxy.ts                              # middleware sécurité + auth Edge

  types/next-auth.d.ts                  # augmentation module (tenantId, role, plan…)

  lib/
    db/
      index.ts                          # client Turso HTTP + drizzle
      schema.ts                         # 8 tables Drizzle
      users-db.ts                       # findUserByEmail / findUserById (jointure tenant)
      users-actions.ts                  # createTenantAndOwner, updatePassword…
    auth.ts                             # config NextAuth v5 (JWT 7j + magic link)
    tenant.ts                           # getTenantId() / requireTenantId()
    auth-rate-limit.ts                  # rate limit Redis+mémoire, validatePassword
    cache.ts                            # cachedQuery() Upstash + fallback mémoire (SWR)
    logger.ts                           # logInfo / logError → Logtail/console
    plan-guard.ts                       # isPro / isPlanExpired / planGateResponse
    plan-limits.ts                      # limites par plan
    validation.ts                       # schémas Zod centralisés + parseBody()
    email.ts                            # Brevo : sendEmail + templates HTML
    stripe.ts                           # singleton Stripe
    anthropic.ts                        # singleton Anthropic (générateur)
    utils.ts                            # helpers (formatDate, slug, nanoid wrappers)

  app/
    layout.tsx · globals.css · page.tsx (landing)
    login/page.tsx · register/page.tsx
    auth/magic/page.tsx · auth/verify-email/page.tsx
    dashboard/page.tsx
    onboarding/page.tsx                 # profil coach (#2)
    api/
      auth/[...nextauth]/route.ts
      auth/register/route.ts · auth/magic-link/route.ts · auth/verify-email/route.ts
      health/route.ts

  components/
    SessionProviderWrapper.tsx          # <SessionProvider> client

  __tests__/                            # Jest (isolation multi-tenant)
```

---

## 9. Variables d'environnement

```bash
# NextAuth
NEXTAUTH_SECRET=        # openssl rand -base64 32
NEXTAUTH_URL=           # http://localhost:3000 en dev
NEXT_PUBLIC_APP_URL=

# Turso (HTTPS obligatoire, pas libsql://)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Anthropic
ANTHROPIC_API_KEY=
AURAPOST_MODEL=         # optionnel — défaut claude-opus-4-8 ; ex: claude-sonnet-4-6

# Brevo (email)
BREVO_API_KEY=

# Stripe
STRIPE_SECRET_KEY= · STRIPE_WEBHOOK_SECRET= · STRIPE_PRICE_PRO=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Upstash Redis (optionnel — fallback mémoire)
UPSTASH_REDIS_REST_URL= · UPSTASH_REDIS_REST_TOKEN=

# Sentry / Logtail (optionnels)
SENTRY_DSN= · LOGTAIL_SOURCE_TOKEN=

# Divers
APP_DOMAIN=aurapost.fr  # base des sous-domaines de sites loués
MAINTENANCE_MODE=
```

---

## 10. Ce qu'AuraPost reprend de BlazeCheck — récapitulatif

| Pattern BlazeCheck                                   | Repris ? | Adaptation AuraPost                              |
| ---------------------------------------------------- | -------- | ----------------------------------------------- |
| Client Turso HTTP + Drizzle (`lib/db/index.ts`)      | ✅ tel quel | —                                              |
| Isolation `requireAgencyId()` / `getAgencyId()`      | ✅ renommé | `requireTenantId()` / `getTenantId()`           |
| NextAuth v5 credentials + magic link (`lib/auth.ts`) | ✅ adapté | JWT 7j, jointure tenant pour le plan            |
| Claim atomique du magic token                        | ✅ tel quel | —                                              |
| Rate limit Redis+mémoire (`lib/auth-rate-limit.ts`)  | ✅ tel quel | —                                              |
| Cache SWR Upstash (`lib/cache.ts`)                   | ✅ tel quel | —                                              |
| Validation Zod centralisée (`lib/validation.ts`)     | ✅ adapté | schémas AuraPost (register, profil, génération) |
| Email Brevo + templates (`lib/email.ts`)             | ✅ adapté | branding AuraPost                               |
| Stripe singleton + webhooks + plan-guard             | ✅ tel quel | maj `subscriptions` + `tenants.plan`            |
| `proxy.ts` source unique des headers sécurité        | ✅ adapté | `connect-src` + `api.anthropic.com`             |
| Tests isolation multi-tenant SQLite in-memory        | ✅ adapté | tables AuraPost                                 |
| `agencyId = userId admin` (tenant implicite)         | ❌ remplacé | **table `tenants` explicite**                  |
| PDF / QR / signature / push                          | ❌ hors scope | remplacés par génération IA + site loué      |

---

## 11. Feuille de route — état

| # | Fonctionnalité | État |
| - | -------------- | ---- |
| 1 | Auth complète (inscription, connexion, magic link, vérif email) | ✅ |
| 2 | Onboarding coach (profil + stepper guidé 4 étapes) | ✅ |
| 3 | Générateur de contenu (SDK Claude Code, 8 IG + 4 LI/mois) | ✅ |
| 4 | Dashboard coach (stats, filtres, approuver/rejeter/variante) | ✅ |
| 5 | Générateur de site coach (template + sous-domaine) | ✅ |
| 6 | Billing Stripe (2 plans, webhook, /dashboard/billing) | ✅ |
| 7 | Email Resend (bienvenue, posts du mois, site activé) | ✅ |
| 8 | Marketing + SEO (landing, /demo, sitemap, robots) | ✅ |
| 9 | Admin back-office (/admin, désactivation tenant) | ✅ |
| 10 | Tests Jest (isolation multi-tenant, générateur, auth, webhooks) | ✅ |
| 11 | Onboarding guidé (stepper, progress, relance cron) | ✅ |
| 12 | Portail public coach (/coach/[slug]) | ✅ |
| 13 | Historique, variantes côte à côte, export CSV/PDF, copier | ✅ |
| 14 | Notifications (badge approbations, service worker, web notif) | ✅ |
| 15 | i18n FR/EN (langue de contenu coach + scaffold dictionnaire) | ✅ |
| 16 | Analytics coach (/dashboard/analytics) | ✅ |
| 17 | Robustesse (404/500/offline, skeletons, SW, migration versionnée) | ✅ |

---

## 12. Mise à jour de session — décisions clés

### 12.1 Génération via le SDK Claude Code (et non l'API Anthropic classique)

`lib/content-generator.ts` + `lib/claude-code.ts`. La génération passe par
`@anthropic-ai/claude-code` (`query()`), qui s'appuie sur l'auth locale de Claude Code —
**aucune `ANTHROPIC_API_KEY`**. Le package 2.x étant un binaire CLI sans export statique, il
est chargé par **import dynamique runtime** (spécifieur non littéral → ni TS ni le bundler ne
le résolvent statiquement ; listé dans `serverExternalPackages`).

**Fallback mock déterministe** : si le SDK est indisponible (CLI absente, serverless) ou si
`AURAPOST_USE_MOCK=1`, un générateur mock produit 8 IG + 4 LI réalistes dérivés du profil.
Retry automatique 3 tentatives avant fallback. Sortie parsée en JSON robuste (extraction
tolérante aux fences markdown).

### 12.2 Base de données — fallback SQLite en mémoire (mode mock)

`lib/db/index.ts` : si `TURSO_DATABASE_URL` est absent → client SQLite **en mémoire**
(`@libsql/client` `:memory:`) avec **schéma auto-créé** (`lib/db/bootstrap-schema.ts`).
Permet de faire tourner toute l'app et la suite de tests sans aucune clé. Le client mémoire
est un Proxy à initialisation paresseuse (cible = classe nommée pour passer `isConfig` de
Drizzle). En production : Turso HTTP + migrations versionnées (`drizzle/0000_init.sql`).

### 12.3 Email via Resend (remplace Brevo)

`lib/email.ts` : Resend avec **mock propre** (email journalisé en console si `RESEND_API_KEY`
absent). Templates HTML aux couleurs AuraPost : bienvenue, magic link, vérif email,
« posts du mois prêts », « site activé ».

### 12.4 Plans & billing

`lib/plans.ts` : deux plans **`content_only`** / **`pack_complet`** (prix placeholder 0).
Webhook `/api/webhooks/stripe` (checkout.session.completed, customer.subscription.updated/
deleted) → `subscriptions` + `tenants.plan`. Mock propre si Stripe absent (checkout
désactivé, historique simulé). `isPro` = tout plan non-starter ; `hasWebsiteAccess` = pack complet.

### 12.5 Schéma — colonnes ajoutées

- `generated_posts.title` — accroche courte du post.
- `coach_profiles.language` (`fr`/`en`) — pilote la langue du contenu généré.
- `tenants.status` (`active`/`disabled`) — désactivation depuis l'admin.

### 12.6 Routes (ajouts de session)

```
POST /api/generate                  # génération mensuelle (rate limit 1/mois + 5/10min)
POST /api/websites/create           # crée/active le site loué (subdomain calculé)
POST /api/webhooks/stripe           # webhooks Stripe → subscriptions
POST /api/stripe/create-checkout    # Checkout Session (mock si Stripe absent)
POST /api/demo/generate             # démo publique 3 posts (sans inscription, mock)
GET  /api/export/csv                # export CSV posts approuvés
POST /api/cron/onboarding-reminder  # relance onboarding +24h (CRON_SECRET)
GET  /sitemap.xml · /robots.txt     # SEO

/dashboard · /dashboard/website · /dashboard/analytics · /dashboard/history
/dashboard/history/print · /dashboard/billing · /admin
/site/[subdomain]  (site loué public) · /coach/[slug] (portail public) · /demo
```

### 12.7 Stratégie de mock (build vert sans aucune clé)

| Intégration | Sans clé |
| ----------- | -------- |
| Turso       | SQLite en mémoire auto-créé |
| Claude Code | Générateur mock déterministe (retry 3) |
| Resend      | Email journalisé en console |
| Stripe      | Checkout désactivé + historique simulé |
| Upstash     | Rate limit / cache in-memory |

### 12.8 Tests (Jest)

`__tests__/` : isolation multi-tenant (SQLite in-memory, A ne lit/écrit jamais les données de
B + rate limit), générateur (8 IG + 4 LI, démo 3 posts), validation mot de passe, plans &
plan-guard, webhook Stripe (mode mock). `nanoid` (ESM-only) shimé en CJS pour Jest.
```
