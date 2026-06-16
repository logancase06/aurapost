# Changelog — AuraPost

Toutes les évolutions notables du projet. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/).

## [1.3.0] — 2026-06-16 — Adoption réseau mesurable, SEO & robustesse PWA

### Adoption (fix critique)
- **Suivi de connexion** : `users.first_login_at` / `last_login_at` / `login_count`, posés via l'event NextAuth `signIn` (non bloquant). Le reporting réseau distingue enfin **jamais connecté / connecté mais inactif / actif** — la métrique d'adoption qu'exige tout acheteur réseau. KPIs reporting + badges par distributeur.

### Acquisition (E1)
- **5 articles de blog SEO** : coach à Nice, guide Hyrox, 10 clients/mois, abandon à 3 mois, AuraPost vs ChatGPT. Metadata + JSON-LD + og:image + temps de lecture + CTA. Sitemap auto.

### Robustesse & accessibilité
- **Service worker** durci : plus de `Uncaught TypeError: Failed to fetch` quand le réseau est injoignable (fallback gracieux, cache bumpé v3).
- **`prefers-reduced-motion`** : animations/transitions neutralisées pour les utilisateurs sensibles au mouvement.

> Build vert · tsc 0 erreur · 41 tests Jest verts.

## [1.2.0] — 2026-06-16 — Conformité réseau (validation MLM) & correctifs production

### Conformité / réseau (P1)
- **File de validation des posts (D1)** : `organizations.requires_approval` + table `post_approvals`. Quand activée, les posts d'un distributeur passent en **`pending_approval`** (nouveau statut) ; le distributeur voit « en attente », ne peut pas s'auto-approuver. Page **`/dashboard/org/approvals`** (manager) : liste par distributeur, **approuver / rejeter avec commentaire**, badge « Contenu à vérifier » si allégation détectée, email de décision, journal immuable. Toggle de validation + blacklist MLM élargie (santé, garanties).

### Site vitrine
- **Thème par spécialité** (`lib/coach-site-theme.ts`, source unique) : `{ bg, accent, accentLight, font, mood }` ; `accentForSpeciality` y délègue.

### Correctifs production (critiques)
- **`analyzeReviews` API-first** : ne tombe plus silencieusement en mock en serverless avec une clé API (même fix que `analyzeInstagram`). Restaure l'extraction réelle des points forts/ton qui alimentent génération et site.
- **`/privacy`** : mention d'hébergement par sous-traitant (pays) + renvoi vers `/legal/sous-traitants`.

> Build vert · tsc 0 erreur · 41 tests Jest verts.

## [1.1.0] — 2026-06-16 — Qualité contenu, pricing, analyse de profil & durcissement

### Produit (P0)
- **Qualité de génération refondue** : prompt de production avec voix imitée, **clichés bannis** (« repousse tes limites », « la régularité bat l'intensité »…), spécificité obligatoire (exercice/chiffre/situation), variété de structure, few-shot. Mock enrichi réécrit (éval : ~10/12 posts publiables, 0 cliché).
- **Nouveau pricing** : Découverte **0 €** (4 posts Instagram + watermark « Créé avec AuraPost »), **Coach 39 €**, **Coach+Site 79 €**, Teams (source unique `lib/plans.ts`). Limites Free appliquées côté serveur ; watermark à la copie ; `/pricing` à 3 offres.
- **Feature « Analyse & Recommandations »** : `/dashboard/analyze` — score Instagram/LinkedIn, scores détaillés, problèmes par impact, réécriture bio/titre (copier + appliquer), hashtags, créneaux, action prioritaire, historique. Analyse auto à l'onboarding + email. Table `profile_analyses`.

### Réseau / RGPD (P1)
- **Adoption distributeurs** : 1ᵉʳ mois généré automatiquement à l'invitation (garde coût/timeout), badge « Inactif 7j+ » + relance en masse.
- **RGPD** : `/legal/sous-traitants` (art. 28) + `/legal/registre` (art. 30) + opt-out & base légale dans l'email d'invitation distributeur.

### Ops & durcissement
- `deploy-check` **bloquant** (Turso/Anthropic/NextAuth) ; `/api/health/detailed` expose `mode`/`version` ; **alerte rouge `/status`** si production sur base mémoire ; checklist de déploiement.

### Correctifs
- Garde coût/timeout sur la génération inline à l'import CSV massif (auto-revue).

> Build vert · tsc 0 erreur · 38 tests Jest verts.

## [0.8.0] — 2026-06-15 — Durcissement prod & AuraPost for Teams (réseaux/MLM)

### Bloquants production
- **Garde anti-fallback DB** : refus de démarrer en production sans `TURSO_DATABASE_URL` (throw explicite, jamais de base en mémoire silencieuse). Avertissement en gras dans `DEPLOY.md`.
- **Métriques admin 100 % réelles** : suppression des chiffres simulés (NPS, conversion, MRR seedé) → posts/mois, approbation, conversion, MRR estimé, coachs actifs. État « En attente des premières données ».
- **Email post-génération garanti** via `after()` (Next 16) ; `maxDuration=26` (plan Netlify gratuit).

### Pitch-ready
- Seed démo réaliste Vincent/Sophie/Thomas (`npm run seed:demo`) ; prix cohérents partout (149 €/209 €) ; champ domaine perso (mort) masqué ; `generatedMode` posé sur variantes & pack ; copy email mensuel basé sur le `count` réel.

### AuraPost for Teams (réseaux, franchises, MLM)
- **Couche organisation** : tables `organizations` / `org_tenants` / `org_templates` / `org_brand_kit`. Dashboard `/dashboard/org` (membres + stats, invitations, brand kit, templates).
- **Brand kit hérité** injecté dans la génération + **conformité MLM** (liste noire d'allégations de revenus, badge « Conforme marque ✓ », page `/org/[slug]/compliance`).
- **Import CSV** des distributeurs (`/api/organizations/[slug]/import-members`) + **onboarding agence** `/agency/onboarding` (wizard 4 étapes) + **reporting réseau** `/dashboard/org/reporting` (+ export CSV).
- **Commercial** : `/agency-demo`, `/agency-pricing` (+ calculateur ROI SSR), `/pitch` (deck interactif), capture de leads `/api/agency-contact` + tracker `/admin/leads`, mode démo protégé `/demo-live?token=`.

### Performance
- **N+1 cron email-sequences** corrigé (batch GROUP BY + SELECT unique) + test jest.

> Build vert · tsc 0 erreur · 35 tests Jest verts.

## [0.7.0] — 2026-06-14 — Go-to-market, conversion, RGPD, PWA & business

### Git & déploiement
- Dépôt git dédié au projet (branche `main`), `.gitignore` + `.gitattributes` vérifiés.
- `scripts/deploy-check.ts` : porte de pré-déploiement (variables critiques + intégrations).

### Démo & acquisition
- **Page de démo personnalisée `/demo/[slug]`** (premier client : **Vincent Ferré**, coach Hyrox à Nice) :
  dashboard en lecture seule, 12 posts ultra-réalistes, site loué, analytics, CTA. Page de vente à envoyer en DM.
- **Séquence email d'onboarding J+0 → J+30** (`lib/email-sequences.ts` + cron) selon l'état du coach.

### Conversion
- **Pricing redessiné** : toggle mensuel/annuel (-20%), features complètes, FAQ accordéon,
  garantie 30 jours, popup de sortie.
- **`/success`** (confettis canvas + prochaines étapes) et **`/cancel`** (raison d'annulation,
  offre de pause, email de rétention).

### RGPD & confidentialité (Étape 17)
- Pages **`/privacy`** et **`/terms`** complètes. **Bannière cookies** à granularité (fonctionnel/analytics/marketing).
- **`/api/gdpr/export`** (JSON), **`/api/gdpr/delete`** (suppression + email), purge des logs > 90 j (cron).
- Page **`/dashboard/settings`** : langue, export et suppression de compte.

### PWA (Étape 18)
- `manifest.webmanifest` + icônes (192/512/maskable/apple), invite « Ajouter à l'écran d'accueil » (3ᵉ visite),
  service worker (offline + notifications push « Vos posts du mois sont prêts »).

### Analytics (Étape 9)
- GA4 + Meta Pixel **gatés par le consentement** (`lib/analytics.ts`, Consent Mode v2), events clés.

### Confiance & contenu (Étapes 12, 14, 15)
- **Trust widget** landing, **`/wall-of-love`**, **`/vs/agence`**, **`/affiliates`**, **badge « Certifié AuraPost »**.
- **`/support`** (tickets stockés, visibles en admin), **`/help`** (5 articles), **`/changelog`** public.
- **`sitemap-coaches.xml`** dédié.

### Admin business (Étapes 6 / 19 partiel)
- Graphe MRR (simulé), heatmap horaire des générations (réelle), coachs inactifs + bouton « relance »,
  taux d'approbation réel, conversion/NPS, export CSV des coachs.

### Outillage (Étape 10 / 20)
- `scripts/{backup,load-test,lighthouse}.ts`, bundle analyzer (`npm run analyze`).
- Docs : `ROADMAP.md`, `LAUNCH_CHECKLIST.md`, `INVESTOR_DECK.md`, `PRESS_KIT.md`.

> Build vert, lint 0 erreur, 22 tests Jest verts, ~85 routes.

## [0.6.0] — 2026-06-13 — Production-ready, sécurité, croissance & SEO

### A · Déploiement Netlify
- `netlify.toml` complet : build, plugin Next, headers de sécurité statiques, redirects
  (`/ref/:code`, `/healthz`), cache immuable des assets.
- `DEPLOY.md` : toutes les variables d'env dans l'ordre + procédures Turso, Resend, Stripe, R2.
- `scripts/check-env.ts` : rapport coloré présent/absent par variable (critique/recommandée/optionnelle).
- Page publique **`/status`** + helper `lib/integrations.ts` (live/mock, sans exposer de clé).

### B · Sécurité production
- Audit des routes : toutes les routes protégées passent par `requireTenantId()`.
- `lib/security.ts` : `sanitizeText`/`sanitizeObject` (anti-XSS avant insertion), `csrfGuard`
  (vérif. d'origine same-site), honeypot (`company_website`), `logUnauthorized` → `activity_logs`,
  limite d'upload **5 Mo** (`MAX_UPLOAD_BYTES`).
- Headers helmet-like (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy…) via `proxy.ts`.
- Inscription : CSRF + honeypot + sanitisation appliqués.

### C · Expérience coach
- **Détail post `/dashboard/posts/[id]`** : contenu, historique des variantes, stat « copié X fois »,
  programmation + export Buffer/Later.
- **Pack de 30 légendes** (stories Instagram) — génération en un clic.
- **Calendrier éditorial `/dashboard/calendar`** : grille mensuelle, **drag & drop** natif,
  export **iCal** (`/api/calendar/ical`).
- **Suggestions intelligentes** : 3 thèmes à creuser d'après les posts les plus approuvés.
- **Notifications in-app** : cloche header + dropdown (posts prêts, site activé, parrainage).

### D · Landing qui convertit
- Sections « Comment ça marche » (SVG custom), « Avant/Après », témoignages (carrousel auto-scroll,
  étoiles animées), **compteur live** dans le hero, **exit-intent**, A/B test du titre hero (`lib/ab.ts`).

### E · Parrainage
- Tables `referral_codes` + `referrals`, lien `/ref/[code]`, crédit d'1 mois aux deux coachs,
  page `/dashboard/referral`, email « Quelqu'un a rejoint AuraPost grâce à vous ! ».

### F · SEO & contenu
- **Blog** (`/blog` + 3 articles) avec metadata complètes, **og:image dynamique**, temps de lecture,
  partage social, JSON-LD `Article`.
- Galerie publique **`/coaches`** (sites actifs). Sitemap dynamique (blog + coachs). JSON-LD
  `SoftwareApplication` sur la landing.

### G · Robustesse & monitoring
- Error boundaries (`app/dashboard/error.tsx`, `SectionBoundary`), **backoff exponentiel** sur les
  appels au SDK, **file de génération** à concurrence limitée (`lib/queue.ts`),
  `GET /api/health/detailed` (probes Turso/Redis/R2), `scripts/seed.ts` (3 coachs de démo).

### H · Internationalisation
- `locales/fr.json` + `locales/en.json`, `lib/i18n.ts` (interpolation, détection navigateur/Accept-Language),
  sélecteur de langue à l'onboarding, emails de bienvenue localisés.

### I · Tests E2E
- Playwright (`@playwright/test`) : `playwright.config.ts` (desktop + iPhone 14), parcours complet
  (inscription → onboarding → génération → approbation → calendrier → site → parrainage),
  flux parrainage, test mobile (bottom bar, zones tactiles), captures dans `/e2e-screenshots`.

### J · Documentation
- `API.md`, `CONTRIBUTING.md`, `DEPLOY.md`, mise à jour `README.md` / `DESIGN_SYSTEM.md`,
  JSDoc sur les fonctions critiques (générateur, sécurité, parrainage).

## [0.4.0] — 2026-06-13

### Génération de site à partir des vraies données coach
- **Scraping Instagram public** (`lib/instagram.ts`) côté serveur, sans auth, avec fallback
  manuel propre si compte privé/bloqué. Rate limit 1/heure/tenant.
- **Analyse des avis** (`lib/reviews.ts`) via le SDK Claude Code → points forts, témoignage,
  ton ; fallback mock par mots-clés.
- **Upload photos** (`lib/r2.ts`) : resize sharp (max 1200px, q85) + Cloudflare R2 (URLs
  signées 1 an) ; fallback data URL si R2 absent. Drag & drop, 1 à 3 photos, preview immédiate.
- **Génération du site** (`lib/site-content.ts`, `POST /api/websites/generate`) : hero, services,
  à propos, témoignages, CTA, SEO — injectés dans `CoachSite.tsx` avec les vraies photos.
  Retry 3 + fallback template par défaut.
- **Assistant `/onboarding/site`** : wizard 3 étapes, sauvegarde automatique (debounce),
  mobile-first, gestion d'erreurs avec composants Alert shadcn.
- **Prévisualisation `/dashboard/website/preview`** : aperçu réel, édition par section (Dialog),
  boutons Publier / Régénérer.
- **Site public** `/site/[subdomain]` : contenu généré, SEO automatique (title + meta),
  formulaire de contact fonctionnel (Resend → email coach), skeleton de chargement.
- Schéma : `coach_profiles.{instagram_url,instagram_data,reviews_text,reviews_analysis,photos}`,
  `websites.{content,seo_description}`. Migration versionnée `drizzle/0001_site_feature.sql`.

### Robustesse
- **DB en mémoire partagée via `globalThis`** : cohérence entre graphes de modules (page action
  vs route API) et survie au HMR en dev.
- Proxy : l'auth ne gate plus que les préfixes protégés (`/dashboard`, `/onboarding`, `/admin`)
  → les routes inconnues affichent la page 404 publique.

## [0.3.0] — 2026-06-13

### Redesign complet professionnel (dark mode + shadcn/ui)
- **Infrastructure shadcn/ui** : `components.json`, `cn()`, 15 composants (`button`, `card`,
  `badge`, `input`, `label`, `table`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `progress`,
  `avatar`, `separator`, `alert`, `skeleton`), Radix + cva.
- **Thème dark violet** par défaut (`dark` sur `<html>`) : background `#0A0A0F`, cards `#111118`,
  accent `#7C3AED` / `#A855F7`, police **Geist**, tokens HSL CSS variables.
- **Landing** : hero gradient centré + 2 CTA, feature cards semi-transparentes, pricing avec
  card « Recommandé », footer minimaliste.
- **Auth** (`/login`, `/register`) : cards centrées, inputs shadcn, magic link en onglet.
- **Onboarding** : stepper horizontal 4 étapes + progress bar.
- **Dashboard** : **sidebar fixe** (icônes Lucide) + **Sheet mobile**, header avatar + dropdown,
  4 stat cards, posts par **tabs Instagram/LinkedIn**, badges de statut.
- **Démo** : skeletons pendant le chargement, cards avec badge réseau.
- **Billing / Analytics** : cards métriques, Table shadcn.
- **404 / 500 / offline** : centrées, illustration SVG « aura », bouton retour.
- Validation : `tsc` 0 erreur · `build` 0 erreur · 40 routes · 12 screenshots (`/screenshots`).

## [0.2.0] — 2026-06-13

Développement autonome complet des étapes 3 à 17. Build vert, type-check vert, lint vert,
22 tests Jest verts. Toutes les intégrations fonctionnent sans clé (mocks propres).

### Étape 3 — Générateur de contenu

- `lib/claude-code.ts` : wrapper du SDK `@anthropic-ai/claude-code` (`query()`), sans
  `ANTHROPIC_API_KEY` (auth locale Claude Code). Import dynamique runtime + timeout.
- `lib/content-generator.ts` : génération de 8 posts Instagram + 4 LinkedIn par mois à partir
  du profil coach. Retry automatique 3 tentatives, parsing JSON robuste, **fallback mock
  déterministe**. Variantes (régénération d'un post) et démo 3 posts.
- `lib/db/posts.ts` : sauvegarde des posts (statut `draft`), rate limit **1 génération/mois**,
  lectures (liste, stats, mois), variantes, changement de statut.
- `POST /api/generate` : génération pour le tenant connecté (rate limit + email mensuel).

### Étape 4 — Dashboard coach

- `/dashboard` redesigné : stats du mois (générés/approuvés/rejetés/en attente), filtres
  réseau (Instagram/LinkedIn) et statut, séparation visuelle par réseau.
- Actions par post : **approuver / rejeter / variante / copier** (server actions).
- Bouton « Générer mon contenu du mois » avec confirmation + état loading.

### Étape 5 — Générateur de site coach

- `templates/coach-site/CoachSite.tsx` : composant React autonome (hero, à propos, 3 services,
  2 témoignages, contact, footer), personnalisé via le profil.
- `POST /api/websites/create` : crée/active le site, **subdomain calculé** (`prenom-nom`).
- `/site/[subdomain]` (public) + `/dashboard/website` (aperçu + statut + liens).

### Étape 6 — Billing Stripe

- `lib/plans.ts` : plans `content_only` / `pack_complet` (prix placeholder 0).
- `POST /api/webhooks/stripe` : checkout.session.completed, customer.subscription.updated/
  deleted → `subscriptions` + `tenants.plan`. Mock propre si Stripe absent.
- `/dashboard/billing` : plan actuel, upgrade, historique (mocké sans Stripe).

### Étape 7 — Email (Resend)

- `lib/email.ts` migré de Brevo vers **Resend**, mock propre (console) si clé absente.
- Emails : bienvenue, magic link, vérification, « posts du mois prêts », « site activé ».

### Étape 8 — Marketing + SEO

- Landing redesignée (hero « Votre contenu Instagram généré par IA », features, pricing,
  témoignages, CTA). Page `/pricing`.
- `/demo` : génère 3 posts exemple sans inscription (`POST /api/demo/generate`).
- `sitemap.xml`, `robots.txt`, metadata complètes.

### Étape 9 — Admin back-office

- `/admin` protégé (rôle `admin` ou `ADMIN_EMAILS`). Stats plateforme, liste des coachs,
  dernières inscriptions, **désactivation/réactivation d'un tenant** (colonne `tenants.status`).

### Étape 10 — Tests & qualité

- Suite Jest : isolation multi-tenant (SQLite in-memory), générateur, validation auth,
  plans/plan-guard, webhook Stripe. 22 tests verts.

### Étape 11 — Onboarding guidé

- Stepper visuel 4 étapes (Profil → Génération → Site → Abonnement) + barre de progression
  persistante sur le dashboard. Dashboard inaccessible tant que le profil n'est pas rempli.
- `POST /api/cron/onboarding-reminder` : relance email après 24h d'abandon (CRON_SECRET).

### Étape 12 — Portail public coach

- `/coach/[slug]` (lecture seule, public) : posts approuvés, lien vers le site, coordonnées.

### Étape 13 — Historique & variantes

- `/dashboard/history` : posts mois par mois, **comparaison variantes côte à côte**.
- Export **CSV** (`/api/export/csv`) + version **imprimable PDF** (`/dashboard/history/print`).
- Bouton « Copier » sur chaque post (contenu + hashtags).

### Étape 14 — Notifications

- Badge rouge d'approbations en attente sur la navigation.
- Service worker (`public/sw.js`) : offline basique + base push. Notification navigateur à la
  génération.

### Étape 15 — Multi-langue

- Champ langue (FR/EN) du coach → **les posts générés respectent la langue choisie**.
- Scaffold de dictionnaire i18n (`lib/i18n.ts`).

### Étape 16 — Analytics coach

- `/dashboard/analytics` : taux d'approbation, posts par thème, évolution mensuelle,
  suggestion automatique basée sur les thèmes les plus approuvés.

### Étape 17 — Robustesse production

- Pages **404 / 500 / global-error / offline** custom aux couleurs AuraPost.
- **Loading skeletons** sur les pages du dashboard.
- Logs d'activité dans `activity_logs` (génération, variantes, site, admin, onboarding…).
- Migration DB **versionnée** (`drizzle/0000_init.sql`, `npm run db:migrate`).

### Infrastructure

- **Fallback SQLite en mémoire** auto-créé quand Turso est absent (`lib/db/index.ts` +
  `lib/db/bootstrap-schema.ts`) — toute l'app et les tests tournent sans aucune clé.
- Schéma : colonnes `generated_posts.title`, `coach_profiles.language`, `tenants.status`.
- `proxy.ts` : routes publiques (site, portail, démo, cron, webhooks), CSP incluant
  `api.anthropic.com`.

## [0.1.0] — 2026-06-13

- Initialisation du projet Next.js 16 + TypeScript.
- Schéma Turso/Drizzle multi-tenant (8 tables).
- Authentification complète NextAuth v5 (JWT 7 jours, magic link, vérification email,
  bcrypt coût 12, rate limiting, isolation multi-tenant).
- Onboarding coach (profil).
- ARCHITECTURE.md initial.
