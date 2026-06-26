# Activer Stripe en production — AuraPost

> Temps estimé : 30–45 min. Prérequis : compte Stripe activé (KYB complété).

---

## Étape 1 — Créer les produits et prix dans Stripe Dashboard

1. Aller sur [dashboard.stripe.com/products](https://dashboard.stripe.com/products) → **+ Ajouter un produit**
2. Créer **Plan Coach** :
   - Nom : `Plan Coach`
   - Description : `12 posts/mois (8 IG + 4 LI) — Calendrier éditorial + export iCal`
   - Prix récurrent : **39,00 € / mois**
   - Copier le **Price ID** : `price_xxxxxxxx` → `STRIPE_PRICE_CONTENT_ONLY`
3. Créer **Plan Coach+Site** :
   - Nom : `Plan Coach+Site`
   - Description : `12 posts/mois + site vitrine personnalisé sur sous-domaine`
   - Prix récurrent : **79,00 € / mois**
   - Copier le **Price ID** : `price_yyyyyyyy` → `STRIPE_PRICE_PACK_COMPLET`

---

## Étape 2 — Récupérer les clés API

1. Dashboard Stripe → **Développeurs → Clés API**
2. Copier :
   - `Clé secrète` (commence par `sk_live_`) → `STRIPE_SECRET_KEY`
   - `Clé publiable` (commence par `pk_live_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Étape 3 — Configurer le Webhook

### Option A — Netlify (production)

1. Dashboard Stripe → **Développeurs → Webhooks** → **+ Ajouter un endpoint**
2. URL : `https://aurapost.fr/api/webhooks/stripe`
3. Événements à écouter (sélectionner exactement ces 6) :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Cliquer **Ajouter l'endpoint** → copier le **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Option B — Test local avec Stripe CLI

```bash
# Installer la CLI Stripe (macOS)
brew install stripe/stripe-cli/stripe

# Authentifier
stripe login

# Forwarder les webhooks vers localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# La CLI affiche : "Your webhook signing secret is whsec_..."
# Copier ce secret → STRIPE_WEBHOOK_SECRET dans .env.local
```

---

## Étape 4 — Configurer les variables d'environnement

Dans Netlify → **Site settings → Environment variables**, ajouter :

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CONTENT_ONLY=price_...
STRIPE_PRICE_PACK_COMPLET=price_...
```

Puis **Deploy → Trigger deploy** pour que les nouvelles variables soient prises en compte.

---

## Étape 5 — Tester end-to-end

1. **Test checkout** : Se connecter avec un compte test, aller sur `/dashboard/billing`, cliquer sur un plan → le bouton de checkout doit afficher la page Stripe (non plus le message "paiement non activé")
2. **Test webhook** :
   - Avec Stripe CLI : `stripe trigger checkout.session.completed`
   - Vérifier dans les logs Netlify que le webhook répond `200 { "received": true }`
   - Vérifier en DB que `subscriptions` + `tenants.plan` sont mis à jour
3. **Test portail** : après abonnement, aller sur `/dashboard/billing` → "Gérer mon abonnement" → le portail Stripe doit s'ouvrir
4. **Test annulation** : annuler depuis le portail Stripe → vérifier que `tenants.plan` revient à `starter` dans les minutes qui suivent

---

## Étape 6 — Activer l'essai gratuit (déjà configuré)

L'essai de 14 jours est déjà dans le code (`FREE_TRIAL_DAYS = 14` dans `lib/plans.ts`).
Stripe l'applique automatiquement via `trial_period_days` dans `lib/stripe.ts`.
Aucune action supplémentaire requise.

---

## Rappel — Points critiques

| Point | État |
|---|---|
| Webhook signature vérifiée par HMAC | ✅ `stripe.webhooks.constructEvent()` |
| Idempotence checkout rejoué | ✅ `upsertSubscription()` fait UPDATE si existant |
| Grâce sur `invoice.payment_failed` | ✅ Plan conservé, email envoyé, Stripe gère les retries |
| Passage `starter` sur annulation | ✅ `customer.subscription.deleted` → `plan='starter'` |
| Middleware exclut la route webhook du JWT | ✅ `proxy.ts` ligne 111 — early return avant tout contrôle JWT |
