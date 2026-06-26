# Flux onboarding AuraPost — État et points de friction

> Mis à jour : 2026-06-26. Basé sur une lecture complète du code source.

---

## Flux complet — schéma

```
Landing (/)
    ↓ CTA "Créer mes posts"
/register
    → POST /api/auth/register
        → createTenantAndOwner() (users + tenants atomique)
        → email bienvenue (Resend)
        → email vérification (token 48h)
        → signIn('credentials') → session next-auth
    ↓ router.push('/onboarding')

/onboarding (4 steps)
    Step 1 — Profil de base
        → nom, spécialité (requis), ville, ton, langue, bio, audience, résultats
        → autosave debounce 1s via saveProfileDraft()
        → blocage si nom ou spécialité manquants

    Step 2 — Présence en ligne
        → Instagram : URL → scrape public → analyzeInstagram() → analyse Claude
        → LinkedIn : saisie manuelle (headline + résumé)
        → Avis clients : texte collé → analyzeReviews() → extraction forces
        → tout persisté sur coachProfiles

    Step 3 — Photos
        → upload via /api/posts/photo → R2/S3 → sharp resize
        → max 10 photos, 10 Mo/fichier
        → optionnel mais enrichit les posts

    Step 4 — Génération
        → generateExampleAction() : 1 post d'aperçu depuis le profil enrichi
        → bouton "Lancer ma génération"
            → finishOnboarding() : users.onboardingCompleted = true
            → fetch('/api/generate', POST)  ← fire-and-forget côté client
            → window.location.assign('/dashboard')

/dashboard
    → GenerateButton détecte le job en cours (alreadyGenerated / generatingAt)
    → polling /api/generate/:jobId toutes les 2s
    → affiche progress bar + posts au fil de l'eau
    → notification browser quand terminé

/dashboard/website (création de site — DÉCONNECTÉ de l'onboarding principal)
    → pack_complet uniquement (sitesEnabled)
    → "Créer mon site" → questionnaire style → génération IA du site
    → publication : website.status = 'active' → accessible sur <slug>.aurapost.fr
```

---

## Points fonctionnels validés

| Étape | État | Notes |
|---|---|---|
| Inscription + tenant atomique | ✅ | `createTenantAndOwner()` transactionnel |
| Email bienvenue | ✅ | Resend, mock si clé absente |
| Autosave profil | ✅ | Debounce 1s, reprise si le coach revient |
| Import Instagram | ✅ | Scrape + analyse Claude en arrière-plan |
| Upload photos | ✅ | R2 + sharp, max 10 Mo |
| Génération async | ✅ | Job DB + polling, timeout serverless résolu |
| Notification browser | ✅ | Web Notification API après génération |
| Vérification email | ✅ | Token 48h, lien dans email, non-bloquante |
| Gating plan post-onboarding | ✅ | Starter = 4 posts IG, watermark, pas de site |

---

## Friction points identifiés

### 1. Photo upload silencieux sans R2 — `// TODO(launch)`

**Où :** `app/onboarding/OnboardingWizard.tsx` — `uploadFiles()` appelle `/api/posts/photo`.
**Problème :** si `R2_ACCESS_KEY_ID` n'est pas configuré, l'API renvoie une erreur mais le
toast générique (`'Upload impossible'`) ne donne pas de contexte au développeur.
**Impact :** bloquant en prod si R2 non configuré. En dev, les photos ne sont jamais uploadées
silencieusement.
**Fix estimé :** S — ajouter une variable d'env `R2_PUBLIC_URL` obligatoire avec guard au
démarrage et message clair.

### 2. Génération fire-and-forget depuis l'onboarding

**Où :** `app/onboarding/OnboardingWizard.tsx` lignes 233–237.

```ts
await fetch('/api/generate', { method: 'POST' }); // ← pas de await résolu
window.location.assign('/dashboard');
```

**Problème :** l'`await fetch` attend la *réponse HTTP* (< 500ms en mode async), pas la fin du
job. `window.location.assign` se déclenche immédiatement. Le dashboard apparaît vide ou avec
un spinner. C'est **OK en mode async** (`GENERATION_ASYNC=true` recommandé en prod) car le
job est en DB et le `GenerateButton` le retrouve. En mode **sync** (hors prod), l'utilisateur
atterrit sur le dashboard sans posts et sans indication.
**Fix recommandé :** s'assurer que `GENERATION_ASYNC=true` est posé en prod (déjà dans `.env.example`).
En mode sync, afficher un toast "Génération en cours…" sur le dashboard.

### 3. Site vitrine non mentionné pendant l'onboarding

**Où :** l'onboarding principal (`/onboarding`) ne mentionne pas la création de site.
**Problème :** les utilisateurs `pack_complet` terminent le wizard et atterrissent sur le
dashboard sans savoir qu'il faut aller sur "Mon site" pour créer leur site vitrine.
**Fix recommandé :** ajouter une card de nudge sur le dashboard pour les users `pack_complet`
sans site publié. Effort S.

```tsx
// TODO(launch): Si plan='pack_complet' ET aucun website en DB → afficher card "Créer votre site vitrine"
```

### 4. Deux générations simultanées depuis l'onboarding + dashboard

**Où :** `OnboardingWizard` fire-and-forget + `GenerateButton` cliquable.
**Problème :** si le job de génération (déclenché par le wizard) est encore en `pending` ou
`running` quand l'utilisateur arrive sur le dashboard, `alreadyGenerated` est `false` (la
génération n'est pas terminée) → l'utilisateur peut cliquer "Générer mes posts".
**Mitigation :** le verrou `tenants.generatingAt` empêche la double génération côté serveur
(l'API renvoie 409 si `generatingAt` est défini). UX dégradée (toast d'erreur) mais pas de
bug de données.
**Fix recommandé :** le `GenerateButton` devrait aussi vérifier `generatingAt` depuis le serveur.
Effort S.

### 5. `signIn('credentials')` après inscription — dépendance au provider credentials

**Où :** `app/register/page.tsx` ligne 64.
**Problème :** le formulaire appelle `signIn('credentials', { email, password })` après la
création de compte. Si next-auth ne configure pas le provider `credentials`, ce call échoue
et l'utilisateur est redirigé vers `/login` avec un toast "Compte créé. Connectez-vous."
(scénario de fallback géré). Aucun blocage, mais la connexion automatique ne fonctionne que
si le provider credentials est actif.
**Note :** le login via magic link (`/login`) fonctionne indépendamment. L'inscription avec
connexion automatique dépend du provider credentials étant configuré dans `lib/auth.ts`.

---

## Flux post-onboarding (idéal)

```
/dashboard
    → Générer contenu (GenerateButton) — ✅ fonctionnel
    → Relire et approuver les posts (/dashboard/posts) — ✅ fonctionnel
    → Planifier (calendrier éditorial) — ✅ fonctionnel
    → Créer site vitrine (/dashboard/website) — ⚠️ non mentionné dans wizard
    → Mettre à niveau le plan (/dashboard/billing) — ⚠️ pas de nudge en-app
    → Exporter / abonnement calendrier — ✅ fonctionnel (plan payant)
```

---

## Priorités launch

| # | Item | Effort | Impact |
|---|---|---|---|
| 1 | Vérifier R2 configuré en prod avant le premier upload | S | Bloquant si non configuré |
| 2 | `GENERATION_ASYNC=true` en prod (déjà dans `.env.example`) | S | Bloquant sinon (timeout 26s) |
| 3 | Card de nudge site vitrine pour `pack_complet` sans site | S | Activation |
| 4 | Vérifier que `credentials` provider est configuré dans `lib/auth.ts` | S | UX inscription |
| 5 | GenerateButton vérifie `generatingAt` pour éviter le toast d'erreur | S | UX |
