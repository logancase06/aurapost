# DEPLOY.md — Mise en production d'AuraPost (Netlify)

AuraPost se déploie sur **Netlify** avec le plugin officiel `@netlify/plugin-nextjs`
(Next.js 16, App Router). **Toutes les intégrations ont un mock propre** : l'app build et
tourne sans aucune clé. Cette page décrit la configuration *production-ready*.

> Vérifiez l'état des intégrations à tout moment sur **`/status`** (public, sans clés exposées)
> ou via **`GET /api/health/detailed`** (probes Turso/Redis/R2).

---

## 0. Pré-vol

```bash
npm install
npx tsx scripts/check-env.ts        # rapport présent/absent par variable
npm run type-check && npm run build # doivent être verts
```

`check-env.ts` logue chaque variable manquante avec sa sévérité (critique / recommandée /
optionnelle) et indique si un mock prend le relais.

---

## 1. Variables d'environnement (dans l'ordre de configuration)

À renseigner dans **Netlify → Site settings → Environment variables**. Ordre conseillé :

### 1.1 — Base (critique)

| Variable | Exemple | Rôle |
| -------- | ------- | ---- |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Signe les sessions JWT. **Obligatoire en prod.** |
| `NEXTAUTH_URL` | `https://aurapost.fr` | URL canonique (callbacks auth). |
| `NEXT_PUBLIC_APP_URL` | `https://aurapost.fr` | Liens emails, og:image, sitemap. |
| `APP_DOMAIN` | `aurapost.fr` | Domaine racine (sous-domaines coachs). |

### 1.2 — Turso (base de données)

1. Installer la CLI : `curl -sSfL https://get.tur.so/install.sh | bash`
2. `turso auth login`
3. `turso db create aurapost-prod`
4. `turso db show aurapost-prod --url` → `TURSO_DATABASE_URL` (format `libsql://…`)
5. `turso db tokens create aurapost-prod` → `TURSO_AUTH_TOKEN`
6. Pousser le schéma : `npm run db:push` (drizzle-kit) depuis votre machine.

| Variable | Rôle |
| -------- | ---- |
| `TURSO_DATABASE_URL` | URL libSQL (convertie en https côté serveur). |
| `TURSO_AUTH_TOKEN` | Token d'accès en écriture. |

> Absent → **SQLite en mémoire** (démo), données non persistées.

### 1.2bis — Génération de contenu (3 chemins, sélection automatique)

Le générateur (`lib/content-generator.ts`) choisit son chemin **dans cet ordre** et logue le mode
au démarrage (`[AuraPost] Génération mode: …`) :

| Priorité | Condition | Mode | Usage |
| --- | --- | --- | --- |
| 1 | `ANTHROPIC_API_KEY` défini | `anthropic-api` | **Production Netlify** — appel direct à l'API Anthropic (`claude-sonnet-4-6`). |
| 2 | `CLAUDE_TUNNEL_URL` défini | `cloudflare-tunnel` | Dev/beta — tunnel HTTP vers Claude Code sur ta machine. |
| 3 | aucune des deux | `mock-enrichi` | Démo — 20 templates IG + 8 LinkedIn par catégorie, seedés par tenant. |

**Chemin 1 — API Anthropic (recommandé en prod)**
1. Crée une clé sur [console.anthropic.com](https://console.anthropic.com).
2. `ANTHROPIC_API_KEY=sk-ant-…` sur Netlify. Optionnel : `ANTHROPIC_MODEL` (défaut `claude-sonnet-4-6`).

**Chemin 2 — Tunnel Cloudflare vers Claude Code local**
1. `npm install -g cloudflared`
2. Sur ta machine : `npm run dev` (le serveur expose `/api/local-generate`).
3. Ouvre le tunnel : `cloudflared tunnel --url http://localhost:3000`
   → copie l'URL générée (ex: `https://aurapost.trycloudflare.com`).
4. Sur Netlify : `CLAUDE_TUNNEL_URL=<url-du-tunnel>` et `TUNNEL_SECRET=<openssl rand -base64 32>`.
5. Mets le **même** `TUNNEL_SECRET` dans le `.env.local` de ta machine (le secret authentifie
   les requêtes Netlify → ta machine ; toute requête sans ce header reçoit un 401).
6. Le tunnel est gratuit, sans limite de temps. Laisse `npm run dev` + `cloudflared` tourner.

| Variable | Rôle |
| -------- | ---- |
| `ANTHROPIC_API_KEY` | Chemin 1 — clé API Anthropic. |
| `ANTHROPIC_MODEL` | Optionnel — modèle (défaut `claude-sonnet-4-6`). |
| `CLAUDE_TUNNEL_URL` | Chemin 2 — URL publique du tunnel cloudflared. |
| `TUNNEL_SECRET` | Chemin 2 — secret partagé (header `X-Tunnel-Secret`). |

> Aucune des deux → **mock enrichi**, toujours fonctionnel, sans clé.

### 1.3 — Resend (emails transactionnels)

1. Créer un compte sur [resend.com](https://resend.com), vérifier le domaine `aurapost.fr` (DNS).
2. Créer une API key → `RESEND_API_KEY`.
3. Définir l'expéditeur vérifié → `RESEND_FROM`.

| Variable | Exemple |
| -------- | ------- |
| `RESEND_API_KEY` | `re_xxx` |
| `RESEND_FROM` | `AuraPost <bonjour@aurapost.fr>` |

> Absent → emails **simulés en console**.

### 1.4 — Stripe (paiements)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys → `STRIPE_SECRET_KEY`.
2. Créer 2 produits/prix (mensuels) → `STRIPE_PRICE_CONTENT_ONLY`, `STRIPE_PRICE_PACK_COMPLET`.
3. Webhook : `https://aurapost.fr/api/webhooks/stripe`, events
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`.
4. Clé publique front → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

| Variable | Rôle |
| -------- | ---- |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (signature webhook). |
| `STRIPE_PRICE_CONTENT_ONLY` | Price ID plan Content Only. |
| `STRIPE_PRICE_PACK_COMPLET` | Price ID plan Pack Complet. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` |

> Absent → billing en **mode démonstration** (checkout désactivé).

### 1.5 — Cloudflare R2 (stockage photos)

1. Cloudflare → R2 → créer un bucket `aurapost-photos`.
2. Créer un token API R2 (Object Read & Write).
3. Activer l'accès public (ou un domaine personnalisé) → `R2_PUBLIC_URL`.

| Variable | Rôle |
| -------- | ---- |
| `R2_ACCOUNT_ID` | ID de compte Cloudflare. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Clés du token R2. |
| `R2_BUCKET_NAME` | `aurapost-photos`. |
| `R2_PUBLIC_URL` | URL publique du bucket. |

> Absent → uploads convertis en **data URL** (mock, non persisté). Limite **5 Mo / photo** côté serveur.

### 1.6 — Upstash Redis (rate limit & cache — optionnel)

| Variable | Rôle |
| -------- | ---- |
| `UPSTASH_REDIS_REST_URL` | Endpoint REST Upstash. |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST. |

> Absent → rate limit/cache **en mémoire** (par instance).

### 1.7 — Admin & cron

| Variable | Rôle |
| -------- | ---- |
| `ADMIN_EMAILS` | Emails autorisés sur `/admin` (séparés par virgule). |
| `CRON_SECRET` | `openssl rand -hex 32` — protège `/api/cron/*`. |
| `MAINTENANCE_MODE` | `true` pour activer la page de maintenance globale. |

---

## 2. Déploiement

1. Connecter le repo GitHub à Netlify (le `netlify.toml` est détecté automatiquement).
2. Build command `npm run build`, publish dir `.next` (déjà dans `netlify.toml`).
3. Renseigner les variables (section 1).
4. Déclencher le déploiement. Le middleware `proxy.ts` part en **Edge Function**, les
   route handlers en **Netlify Functions**.

### Tâches planifiées (cron)

`GET /api/cron/onboarding-reminder` doit être appelée 1×/jour avec l'en-tête
`Authorization: Bearer $CRON_SECRET`. Configurer un **Netlify Scheduled Function** ou un
cron externe (GitHub Actions, cron-job.org).

---

## 3. Post-déploiement (checklist)

- [ ] `/status` : toutes les intégrations attendues en **Live**.
- [ ] `GET /api/health/detailed` → `status: "ok"`.
- [ ] Inscription → onboarding → génération → approbation → site : flux complet OK.
- [ ] Webhook Stripe reçoit un event test (Stripe CLI : `stripe listen`).
- [ ] DNS : `*.aurapost.fr` (sous-domaines coachs) pointe sur Netlify.
- [ ] `MAINTENANCE_MODE` non défini (ou `false`).

---

## 4. Rollback

Netlify conserve l'historique des déploiements : **Deploys → … → Publish deploy** sur la
version précédente. La base Turso n'est pas affectée par un rollback applicatif.
