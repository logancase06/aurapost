# AuraPost

SaaS multi-tenant qui génère automatiquement du contenu Instagram & LinkedIn pour des coachs
sportifs (via le SDK Claude Code) et leur loue un site web personnalisé sur sous-domaine.

> **Docs** : [ARCHITECTURE.md](./ARCHITECTURE.md) · [DEPLOY.md](./DEPLOY.md) (Netlify) ·
> [API.md](./API.md) · [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) · [CONTRIBUTING.md](./CONTRIBUTING.md) ·
> [CHANGELOG.md](./CHANGELOG.md).
> Projet de référence : BlazeCheck (`../extincteur-ssi/`).
> État des intégrations en direct : page publique **`/status`** · `GET /api/health/detailed`.

## Stack

Next.js 16 (App Router) · TypeScript · Turso/libSQL + Drizzle · NextAuth v5 (JWT 7j, magic link) ·
Anthropic SDK (`claude-opus-4-8`) · Stripe · Upstash Redis · Brevo · TailwindCSS.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs (au minimum NEXTAUTH_SECRET + Turso)
npm run db:push              # crée le schéma sur la base Turso
npm run dev                  # http://localhost:3000
```

Générer un secret NextAuth : `openssl rand -base64 32`.

## Scripts

| Script              | Rôle                                  |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Serveur de développement (Turbopack)  |
| `npm run build`     | Build de production                   |
| `npm run type-check`| `tsc --noEmit`                        |
| `npm run lint`      | ESLint                                |
| `npm test`          | Jest (tests d'isolation multi-tenant) |
| `npm run test:e2e`  | Tests E2E Playwright (desktop)        |
| `npm run check-env` | Vérifie les variables d'environnement |
| `npm run seed`      | Crée 3 coachs de démonstration        |
| `npm run screenshots`| Captures Playwright des pages clés   |
| `npm run db:push`   | Synchronise le schéma Drizzle → Turso |
| `npm run db:studio` | Drizzle Studio                        |

## État d'avancement

Toutes les étapes (1 à 17) sont livrées. Build vert, 22 tests Jest verts. Détail dans
[CHANGELOG.md](./CHANGELOG.md) et [ARCHITECTURE.md](./ARCHITECTURE.md).

- [x] **#1** Auth complète (magic link, vérif email, isolation tenant)
- [x] **#2 / #11** Onboarding coach + stepper guidé 4 étapes
- [x] **#3** Générateur de contenu (SDK Claude Code, 8 IG + 4 LI/mois, mock fallback)
- [x] **#4** Dashboard coach (stats, filtres, approuver/rejeter/variante/copier)
- [x] **#5** Générateur de site coach (template + sous-domaine)
- [x] **#6** Billing Stripe (2 plans, webhook, mock propre)
- [x] **#7** Email Resend (bienvenue, posts du mois, site activé)
- [x] **#8** Marketing + SEO (landing, /demo, sitemap, robots)
- [x] **#9** Admin back-office (/admin, désactivation tenant)
- [x] **#10** Tests Jest (isolation multi-tenant, générateur, auth, webhooks)
- [x] **#12** Portail public coach (/coach/[slug])
- [x] **#13** Historique, variantes côte à côte, export CSV/PDF, copier
- [x] **#14** Notifications (badge, service worker, web notif)
- [x] **#15** i18n FR/EN (langue de contenu coach)
- [x] **#16** Analytics coach
- [x] **#17** Robustesse (404/500/offline, skeletons, migration versionnée)
- [x] **#18** Déploiement Netlify (`netlify.toml`, `/status`, `check-env`, health détaillé)
- [x] **#19** Durcissement sécurité (CSRF, honeypot, sanitisation, logs d'accès refusés)
- [x] **#20** Expérience coach (détail post + variantes, calendrier éditorial iCal, pack de
  légendes, suggestions intelligentes, notifications in-app)
- [x] **#21** Landing conversion (how-it-works, avant/après, témoignages, compteur live,
  exit-intent, A/B hero)
- [x] **#22** Parrainage (`/ref/[code]`, crédits, dashboard, email)
- [x] **#23** SEO/contenu (blog 3 articles + og:image dynamique, galerie `/coaches`, JSON-LD)
- [x] **#24** Robustesse++ (error boundaries, backoff exponentiel, file de génération, seed)
- [x] **#25** Tests E2E Playwright (parcours complet + parrainage + mobile)

> Tout fonctionne **sans aucune clé** : Turso → SQLite en mémoire, Claude Code → générateur
> mock, Resend → console, Stripe → mode démo. Renseignez les clés dans `.env.local` pour activer
> les vraies intégrations.

## Isolation multi-tenant

Règle absolue : toute mutation DB passe par `requireTenantId()`, toute lecture par
`getTenantId()` (`lib/tenant.ts`). `tenant_id` = `tenants.id` sur chaque table métier.
