# Roadmap Audit — AuraPost
> Créée le 2026-06-27 · Audit sécurité, qualité et conformité avant l'ouverture commerciale.
> À exécuter dans l'ordre : les items en haut débloquent ou sécurisent ceux d'en bas.

---

## Périmètre

L'audit couvre 6 axes :

| Axe | Priorité | Bloque quoi |
|---|---|---|
| **SEC** — Sécurité des routes API | 🔴 Critique | Fraude, fuite de données |
| **ISO** — Isolation multi-tenant | 🔴 Critique | Fuite données coach ↔ coach |
| **PAY** — Intégrité paiement Stripe | 🔴 Critique | Revenu, abus plan |
| **DAT** — Conformité RGPD/LCEN | 🟡 Important | Amende CNIL |
| **DEP** — Dépendances & supply chain | 🟡 Important | Vulnérabilités connues |
| **QUA** — Qualité code & dette technique | 🟢 Différable | Maintenabilité |

---

## AUD-1 — Isolation multi-tenant (routes API)

**Risque :** Un coach authentifié peut-il lire ou modifier les données d'un autre coach en forgeant un `id` dans l'URL ou le body ?

**Périmètre :** toutes les routes avec un paramètre `[id]` ou `[slug]`, et toutes les mutations (POST/PATCH/DELETE).

**Vérifications :**

- [ ] **1a. Routes `/api/posts/[id]/*`** — vérifier que chaque handler lit `tenantId` depuis `requireTenantId()` et filtre `WHERE post.tenantId = tenantId` avant toute lecture/mutation. Ne pas faire confiance à l'`id` seul.
- [ ] **1b. Route `/api/posts/[id]/score`** (nouvelle) — même vérification.
- [ ] **1c. Route `/api/social/disconnect/[connectionId]`** — vérifier que `connectionId` appartient bien au tenant avant la suppression.
- [ ] **1d. Route `/api/photos/edit/[editId]/validate`** — vérifier que `editId` appartient au tenant.
- [ ] **1e. Route `/api/organizations/[slug]/*`** — vérifier que l'utilisateur est bien `owner` de l'org avant chaque action admin.
- [ ] **1f. Route `/api/calendar/ical`** — vérifier que le token de calendrier est bien isolé par tenant (pas de token partagé).
- [ ] **1g. Route `/api/gdpr/export` + `/api/gdpr/delete`** — vérifier qu'un utilisateur ne peut exporter/supprimer que ses propres données.
- [ ] **1h. Route `/api/leads/export`** — vérifier isolation tenant.

**Test :**
```bash
# Créer tenant A (posts P1), tenant B (posts P2)
# Avec session B, appeler GET /api/posts/P1 → attendu 403 ou 404
# Avec session B, appeler PATCH /api/posts/P1 → attendu 403 ou 404
```

---

## AUD-2 — Webhooks : vérification des signatures

**Risque :** Un attaquant peut envoyer de faux événements Stripe ou Zernio pour créditer un plan gratuit, marquer des posts comme publiés, etc.

**Vérifications :**

- [x] **2a. Webhook Stripe** — ✅ Body lu en `req.text()` avant la vérif ; `constructEvent` appelé en premier ; 400 si signature invalide.
- [x] **2b. Webhook Zernio** — ✅ Body lu en `req.text()` ; `verifyZernioWebhookSignature` appelé avant tout traitement ; 401 si invalide.
- [x] **2c. Idempotence Stripe** — ✅ `upsertSubscription` fait un UPSERT ; double appel réécrit la même valeur. Pas de double crédit.
- [x] **2d. Idempotence Zernio** — ✅ `updatePublicationStatus` fait un UPDATE (pas INSERT). Double appel = double UPDATE idempotent.

---

## AUD-3 — Sécurité des crons

**Risque :** Les routes `/api/cron/*` sont publiques par défaut dans Next.js. Sans authentification, n'importe qui peut déclencher une réconciliation de jobs, des emails, ou le downgrade d'un tenant.

**Vérifications :**

- [x] **3a/3b/3c.** ✅ Toutes les routes cron utilisent `isAuthorizedCron(req)` en première ligne (y compris `monthly-report`). 401 immédiat si secret absent ou incorrect.

---

## AUD-4 — Validation des inputs (injection, XSS)

**Risque :** Injection dans les prompts Claude, XSS stocké via les contenus des posts, injection SQL via Drizzle.

**Note Drizzle/SQLite :** Drizzle utilise des requêtes paramétrées — l'injection SQL directe est très peu probable. Le risque est plutôt côté injection de prompt et XSS.

**Vérifications :**

- [ ] **4a. Injection de prompt** — les champs `instagramUrl`, `bio`, `targetAudience`, `results`, `reviewsText` saisie par le coach sont injectés dans les prompts Claude. Vérifier qu'ils sont sanitisés (longueur max, pas d'instructions `System:` ou `Human:` injectées).
- [ ] **4b. Upload de photos** — route `/api/onboarding/site/photos` : vérifier la validation du Content-Type (refuser tout ce qui n'est pas `image/*`), la taille max (actuellement limitée ?), et que les noms de fichiers R2 sont générés serveur-side (pas depuis le nom de fichier client).
- [ ] **4c. URL Instagram** — `instagramUrl` est utilisée pour scraper. Vérifier qu'elle est validée comme URL Instagram avant d'être transmise au scraper (pas d'SSRF vers des ressources internes).
- [ ] **4d. Subdomain** — le subdomain du site vitrine est une entrée utilisateur stockée en DB et utilisée dans des URL. Vérifier : regex stricte `[a-z0-9-]{3,50}`, pas de `localhost`, pas de traversal (`../`).
- [ ] **4e. Message contact coach** `/api/site/contact` — le `message` est envoyé par email. Vérifier qu'il est encodé (pas d'injection HTML dans le template email Resend).
- [x] **4f. Export CSV** — ✅ Corrigé dans `/api/export/csv` et `/api/leads/export` : préfixage avec apostrophe des valeurs commençant par `=`, `+`, `-`, `@`, `\t`, `\r`. Plan gating côté serveur ajouté dans `/api/export/csv`.

---

## AUD-5 — Authentification et gestion de session

**Vérifications :**

- [ ] **5a. Magic link** `/api/auth/magic-link` — vérifier que le token est à usage unique (marquer `usedAt` AVANT de créer la session, pas après). Vérifier l'expiration (TTL ≤ 15 min recommandé).
- [x] **5a. Magic link usage unique** — ✅ Tokens précédents marqués `usedAt` avant de créer le nouveau. Expiration 60 min. Anti-enumeration via réponse constante si email inconnu.
- [x] **5b. Rate limit magic link** — ✅ 3 tentatives / IP / 15 min via `checkAuthRateLimit`. Redis si dispo, mémoire sinon.
- [ ] **5c. NEXTAUTH_SECRET** — À vérifier manuellement en prod : doit exister uniquement en variable d'env.
- [ ] **5d. Expiration de session** — À vérifier dans `lib/auth.ts`.
- [ ] **5e. Routes admin** — À vérifier dans le middleware.

---

## AUD-6 — Rate limiting et abus

**État actuel :** Rate limiting en mémoire (par instance Lambda) → contournable si plusieurs lambdas parallèles. Upstash Redis recommandé mais pas encore posé.

**Vérifications :**

- [x] **6b. `/api/demo/generate`** — ✅ Rate limit 10 req/IP/10 min.
- [x] **6g. `/api/track/site-visit`** — ✅ Rate limit 8 req/IP/min.
- [x] **6a. `/api/auth/magic-link`** — ✅ Rate limit 3/IP/15 min. `/api/stripe/create-checkout` — ✅ Rate limit 10/tenant/h.
- [ ] **6c. `/api/demo/live`** — À vérifier.
- [ ] **6d. `/api/site/contact`** — À vérifier.
- [ ] **6e. `/api/support`** — À vérifier.
- [ ] **6f. `/api/agency-contact`** — À vérifier.

---

## AUD-7 — Gating des features (contournement de plan)

**Risque :** Un utilisateur `starter` ou `content_only` accède à une feature `pack_complet` côté serveur en appelant directement l'API.

**Vérifications :**

- [x] **7a. Publication sociale** — ✅ `getPlanLimits(session.user.plan).socialPublishEnabled` vérifié avant tout appel Zernio.
- [x] **7c. Édition IA** — ✅ `aiEditsMax === 0` → 403 ; `countEditedThisMonth >= aiEditsMax` → 429. Double gating plan + quota.
- [x] **7d. Export CSV** — ✅ Ajout de `canExportPost(session.user.plan)` → 403 pour les starters.
- [x] **7e. Score post** — ✅ `limits.exportEnabled` bloque les starters (proxy plan valide).
- [ ] **7b. Génération de site** `/api/websites/generate` — À vérifier.
- [ ] **7f. Limites de variantes** — À vérifier.
- [ ] **7g. Quota photos upload** — À vérifier.

---

## AUD-8 — Conformité RGPD/LCEN

**Vérifications :**

- [x] **8a. Consentement email marketing** — ✅ `sendMarketingEmail()` vérifie `isUnsubscribed(tenantId)` avant tout envoi. Les séquences et le monthly-report passent par cette fonction.
- [ ] **8b. Liens de désabonnement** — À vérifier dans les templates email.
- [x] **8c. Export RGPD** — ✅ Étendu : `siteLeads`, `coachPhotos`, `editedPhotos`, `socialConnections`, `socialPublications`, `profileAnalyses` maintenant inclus.
- [x] **8d. Suppression RGPD** — ✅ Étendu : mêmes tables + `siteVisits`, `generationJobs`, `imageEditJobs` maintenant supprimées. Note : les fichiers R2 (photos) ne sont pas encore supprimés — à ajouter (appel R2 delete par r2Key).
- [x] **8e. Données analytics** — ✅ `siteVisits` ne stocke pas d'IP (confirmé dans la route). Cron `data-retention` purge maintenant les visites > 13 mois (395 jours).
- [ ] **8f. CGV parrainage** — Toujours en attente de validation juridique avant toute publication.
- [ ] **8g. EU AI Act Art.50** — À vérifier dans l'UI du dashboard.

---

## AUD-9 — Dépendances et supply chain

**Vérifications :**

- [ ] **9a.** Exécuter `npm audit` et trier par sévérité. Patcher tous les `critical` et `high` avant l'ouverture commerciale.
- [ ] **9b.** Vérifier les dépendances directes à haut risque : `next`, `stripe`, `drizzle-orm`, `@auth/drizzle-adapter`, `resend`. Ces packages touchent auth, paiement ou DB — toujours sur une version stable récente.
- [ ] **9c. Lock file** — vérifier que `package-lock.json` est commité et que les CI (si présent) utilisent `npm ci` (pas `npm install`) pour garantir des builds déterministes.
- [ ] **9d. Variables d'env exposées client-side** — auditer tous les `NEXT_PUBLIC_*`. Vérifier qu'aucun secret (clé Stripe secrète, clé Claude, token Zernio) n'est préfixé `NEXT_PUBLIC_`.

---

## AUD-10 — Sécurité des headers HTTP

**Vérifications :**

- [x] **10b. Headers de sécurité standards** — ✅ Ajoutés dans `next.config.mjs` : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- [ ] **10a. CSP (Content Security Policy)** — Pas encore ajoutée (complexe avec Next.js inline scripts). À planifier séparément.
- [ ] **10c. CORS sur les routes API** — Pas de CORS permissif détecté (Next.js ne définit pas de CORS par défaut). OK en l'état.

---

## AUD-11 — Qualité et dette technique (différable)

*Ces items n'ont pas d'impact sécurité direct mais impactent la maintenabilité.*

- [ ] **11a. Types stricts sur les statuts DB** — les champs `status` (posts, subscriptions, socialPublications, etc.) sont des `text` libres en SQLite. Aucun CHECK constraint. Une typo silencieuse (`'approvede'`) ne lèverait pas d'erreur en base. Ajouter des Zod schemas de validation côté serveur pour chaque statut critique.
- [ ] **11b. `any` TypeScript** — auditer les `// @ts-ignore` et les `any` explicites dans les routes API. Chaque `any` est un point aveugle potentiel.
- [ ] **11c. Valeurs hardcodées dans le code admin** — `lib/db/admin.ts` contient `demoConversion: 32`, NPS simulé, MRR fictif (G-5 dans la roadmap globale). Ces valeurs doivent être remplacées par des calculs réels avant de prendre des décisions business dessus.
- [ ] **11d. Verrou `generatingAt`** — si le cron `reconcile-jobs` n'est pas planifié, le verrou reste bloqué indéfiniment. Documenter la dépendance : le cron est **obligatoire** pour que la génération soit fiable.
- [ ] **11e. Logs d'erreur** — vérifier que `logError` ne log jamais des secrets ou des données personnelles en clair (email, token, contenu de post).

---

## Récapitulatif par priorité

### Avant ouverture commerciale (bloquer le lancement si non fait)

| Réf | Item | Effort | Risque si ignoré |
|---|---|---|---|
| AUD-2a | Signature webhook Stripe | XS | Fraude plan gratuit |
| AUD-2b | Signature webhook Zernio | XS | Faux statuts de publication |
| AUD-3 | Auth des crons | XS | Emails spam, downgrades forcés |
| AUD-1a–1h | Isolation multi-tenant | S | Fuite données coach |
| AUD-5a–5b | Magic link sécurisé | XS | Usurpation de compte |
| AUD-7a–7g | Gating serveur des features | S | Abus de fonctionnalités payantes |
| AUD-6b–6c | Rate limit démo (non auth) | XS | Coûts Claude non maîtrisés |

### Dans la semaine suivant le lancement

| Réf | Item | Effort | Risque si ignoré |
|---|---|---|---|
| AUD-4a–4f | Validation inputs | S | XSS, injection de prompt |
| AUD-6a | Audit rate limits global | S | Abus, coûts |
| AUD-8a–8g | Conformité RGPD | M | Amende CNIL |
| AUD-9a | `npm audit` | XS | Vulnérabilités connues |
| AUD-10 | Headers HTTP | XS | XSS, clickjacking |

### Dans le premier mois

| Réf | Item | Effort | Risque si ignoré |
|---|---|---|---|
| AUD-9b–9d | Dépendances & env | XS | Supply chain |
| AUD-2c–2d | Idempotence webhooks | S | Double crédit |
| AUD-11 | Dette technique | M | Maintenabilité |

---

## Comment exécuter cet audit

**Option 1 — Manuel (recommandé pour les items critiques)**
Parcourir chaque fichier listé, cocher les items, noter les anomalies trouvées.

**Option 2 — `/code-review` dans Claude Code**
```
/code-review high
```
Lance une revue multi-agents sur le diff courant. Compléter avec les items manuels de cet audit pour les aspects non-diff (ex : AUD-6 rate limits, AUD-8 RGPD).

**Option 3 — `/security-review`**
```
/security-review
```
Revue dédiée sécurité des changements en cours.

---

*Document évolutif — cocher les items au fur et à mesure, ajouter les anomalies trouvées en commentaire inline.*
