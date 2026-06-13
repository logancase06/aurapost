# API.md — Routes API d'AuraPost

Toutes les routes vivent sous `app/api/**/route.ts` (Next.js App Router, runtime Node).
Conventions transverses :

- **Auth** : les routes protégées vérifient la session NextAuth puis `requireTenantId()`
  (isolation multi-tenant stricte). Réponse `401` si non connecté.
- **CSRF** : les mutations sensibles vérifient l'origine same-site (`csrfGuard`). Réponse `403`.
- **Rate limit** : middleware (`proxy.ts`) — 30 req/min/IP sur `/api/*` (hors routes publiques) ;
  limites spécifiques sur l'auth (5 inscriptions/h/IP).
- **Mock** : sans clé externe, chaque intégration tombe sur un mock fonctionnel.
- **Erreurs** : `{ "error": "message lisible" }` + code HTTP approprié.

> Vérifier les intégrations : `GET /api/health/detailed` · page publique `/status`.

---

## Santé & monitoring

### `GET /api/health`
Liveness simple. → `200 { status: "ok", service, time }`

### `GET /api/health/detailed`
Teste activement Turso, Redis et R2.
→ `200` si tout ok/skipped, `503` si une dépendance est `down`.
```json
{
  "service": "aurapost",
  "status": "ok",
  "uptimeSeconds": 1234,
  "probes": [{ "name": "database", "status": "ok", "latencyMs": 12, "detail": "…" }],
  "integrations": [{ "key": "email", "label": "…", "mode": "mock", "configured": false }]
}
```

---

## Authentification

### `POST /api/auth/register`
Crée un compte + tenant. **Public**, CSRF + honeypot + rate-limit.
```json
// Requête
{
  "name": "Léa Martin",
  "brandName": "Léa Fitness",
  "email": "lea@example.com",
  "password": "Av3nir!Solide",
  "consentGivenAt": "2026-06-13T10:00:00.000Z",
  "ref": "AB12CD34",                 // optionnel : code de parrainage
  "locale": "fr",                     // optionnel : langue détectée
  "company_website": ""               // honeypot : doit rester vide
}
// Réponse 201
{ "message": "Compte créé avec succès" }
```
Erreurs : `400` (validation/honeypot), `409` (email pris), `403` (CSRF), `429` (rate limit).

### `POST /api/auth/magic-link`
Envoie un lien de connexion. → `200 { message }` (réponse identique que l'email existe ou non).

### `GET /api/auth/verify-email?token=…`
Vérifie l'email via token. Redirige vers le dashboard.

### `GET|POST /api/auth/[...nextauth]`
Endpoints NextAuth (Credentials + magic link).

---

## Génération de contenu

### `POST /api/generate`  🔒
Génère le lot mensuel (8 IG + 4 LinkedIn). Passe par la **file d'attente** (concurrence limitée).
→ `200 { count, month }` · `409` si déjà généré ce mois · `400 no_profile`.

### `POST /api/demo/generate`
Démo publique (3 posts). Body `{ speciality, city?, tone? }`. → `200 { posts: [...] }`.

---

## Posts & calendrier (Server Actions)

Exposés via Server Actions (`app/dashboard/post-actions.ts`), pas en REST :
`approvePostAction`, `rejectPostAction`, `requestVariantAction`, `schedulePostAction`,
`trackCopyAction`, `generateCaptionPackAction`. Tous `🔒` (session + tenant).

### `GET /api/calendar/ical`  🔒
Exporte le calendrier éditorial (posts planifiés ±3 mois) en `text/calendar`.

### `GET /api/export/csv`  🔒
Exporte les posts du tenant en CSV.

---

## Site vitrine  🔒

| Route | Rôle |
| ----- | ---- |
| `POST /api/onboarding/site/instagram` | Analyse un profil Instagram (mock). |
| `POST /api/onboarding/site/reviews` | Analyse des avis collés. |
| `POST /api/onboarding/site/photos` | Upload 1–3 photos (≤ 5 Mo, CSRF). `413` si trop lourd. |
| `DELETE /api/onboarding/site/photos` | Supprime une photo. |
| `POST /api/onboarding/site/save` | Sauvegarde l'état de l'assistant. |
| `POST /api/websites/create` | Crée le site (sous-domaine). |
| `POST /api/websites/generate` | Génère le contenu IA du site. |
| `POST /api/websites/publish` | Active/désactive le site. |
| `POST /api/site/contact` | **Public** : message du formulaire de contact d'un site coach. |

---

## Paiements

### `POST /api/stripe/create-checkout`  🔒
Crée une session Checkout Stripe. → `200 { url }`. En mock : `400` (Stripe non configuré).

### `POST /api/webhooks/stripe`
Webhook Stripe. **Vérifie la signature** (`STRIPE_WEBHOOK_SECRET`), pas d'auth JWT.
Events gérés : `checkout.session.completed`, `customer.subscription.updated|deleted`.

---

## Cron

### `GET /api/cron/onboarding-reminder`
Relance les coachs sans onboarding terminé. Header `Authorization: Bearer $CRON_SECRET`.
→ `401` sans secret valide.
