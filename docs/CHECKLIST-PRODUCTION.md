# Checklist de mise en production — AuraPost

> Générée le 2026-06-27 à partir de l'audit exhaustif des fichiers source, docs et sessions précédentes.
> Cocher au fur et à mesure. Ordre recommandé : les items en haut débloquent ceux d'en bas.

---

## 🔴 BLOQUANT COMMERCIAL IMMÉDIAT

*Sans ces actions, aucun coach ne peut payer ou accéder à une fonctionnalité déjà construite et déployée.*

---

### 1. Migrations base de données Turso (prod)

> **Débloque :** analytics du site vitrine + toute la stack publication sociale (Z-1 à Z-5).
> **Ordre : en premier** — le schéma de prod doit être à jour avant tout test de fonctionnalité.

- [ ] **1a. Migration analytics** — Aller sur [app.turso.tech](https://app.turso.tech) → sélectionner la base de prod → **Shell** ou **CLI**.
  ```bash
  turso db shell <nom-base-prod> < drizzle/0003_site_visits.sql
  ```
  **Vérification :** `SELECT COUNT(*) FROM site_visits;` → renvoie `0` sans erreur (table créée).
  **Débloque :** section "Trafic de votre site" dans `/dashboard/analytics`.

- [ ] **1b. Migration connexions sociales** — Dans le même shell :
  ```bash
  turso db shell <nom-base-prod> < drizzle/0006_social_connections.sql
  ```
  **Vérification :** `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('social_connections','social_publications');` → 2 résultats.
  **Débloque :** connexion LinkedIn/Instagram, bouton "Publier", webhook Zernio.

- [ ] **1c. Migration leads du site vitrine** — Dans le même shell :
  ```bash
  turso db shell <nom-base-prod> < drizzle/0007_site_leads.sql
  ```
  **Vérification :** `SELECT COUNT(*) FROM site_leads;` → renvoie `0` sans erreur (table créée).
  **Débloque :** capture automatique des leads depuis le formulaire de contact du site vitrine (`/api/site/contact`), dashboard `/dashboard/leads`, export CSV des leads.

---

### 2. Variables d'environnement de base (si pas encore posées)

> **Débloque :** authentification, emails, RGPD — le socle sans lequel l'app ne fonctionne pas.

- [ ] **2a. Auth** — Netlify → **Site settings → Environment variables** :

  | Variable | Comment l'obtenir | Notes |
  |---|---|---|
  | `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Secret de signature des sessions JWT |
  | `NEXTAUTH_URL` | `https://aurapost.fr` | URL canonique de prod |
  | `NEXT_PUBLIC_APP_URL` | `https://aurapost.fr` | Utilisée dans les emails + callbacks OAuth |

  **Vérification :** se connecter en prod via magic link → session active, JWT bien signé.

- [ ] **2b. Email (Resend)** — [resend.com](https://resend.com) → **API Keys → Create API Key** :

  | Variable | Valeur |
  |---|---|
  | `RESEND_API_KEY` | `re_...` depuis le dashboard Resend |
  | `RESEND_FROM` | `AuraPost <onboarding@aurapost.fr>` |

  **Vérification :** créer un compte test → recevoir l'email de bienvenue.
  **Débloque :** onboarding, magic links, alertes admin, séquences de réengagement.

- [ ] **2c. Liens de désabonnement (RGPD/LCEN)** :

  | Variable | Comment l'obtenir |
  |---|---|
  | `UNSUBSCRIBE_SECRET` | `openssl rand -hex 32` |

  > ⚠️ Sans cette variable, `lib/unsubscribe.ts` logue une erreur en prod et les liens de désabonnement dans les emails ne fonctionnent pas → non-conformité LCEN.
  
  **Vérification :** envoyer un email de test → cliquer le lien de désabonnement → page de confirmation s'affiche sans erreur 500.

---

### 3. Stripe — activation complète des paiements

> **Débloque :** l'ensemble du modèle économique. Aucun revenu sans cette étape.
> **Documentation complète :** `docs/stripe-activation.md` (6 étapes détaillées).

- [ ] **3a. Créer les produits dans Stripe** — [dashboard.stripe.com/products](https://dashboard.stripe.com/products) :
  - Produit **"Plan Coach"** → prix récurrent **39,00 € / mois** → copier le Price ID
  - Produit **"Plan Coach+Site"** → prix récurrent **79,00 € / mois** → copier le Price ID

- [ ] **3b. Récupérer les clés API** — Stripe Dashboard → **Développeurs → Clés API** :

  | Variable | Format | Où copier |
  |---|---|---|
  | `STRIPE_SECRET_KEY` | `sk_live_...` | Clé secrète |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Clé publiable |

- [ ] **3c. Créer le webhook Stripe** — Stripe Dashboard → **Développeurs → Webhooks → + Ajouter un endpoint** :
  - URL : `https://aurapost.fr/api/webhooks/stripe`
  - Événements (exactement ces 6) : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.trial_will_end`, `invoice.payment_failed`, `invoice.payment_succeeded`
  - Copier le **Signing secret** (`whsec_...`)

- [ ] **3d. Poser les 5 variables** dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `STRIPE_SECRET_KEY` | `sk_live_...` |
  | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
  | `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
  | `STRIPE_PRICE_CONTENT_ONLY` | `price_...` (39€) |
  | `STRIPE_PRICE_PACK_COMPLET` | `price_...` (79€) |

- [ ] **3e. Redéployer** — Netlify → **Deploys → Trigger deploy** (les variables d'env ne prennent effet qu'après un nouveau deploy).

- [ ] **3f. Vérification end-to-end** :
  - `/dashboard/billing` → bouton "S'abonner" → page Stripe Checkout s'ouvre (pas de message "paiement désactivé")
  - Stripe CLI : `stripe trigger checkout.session.completed` → logs Netlify → réponse `200 {"received":true}`
  - Vérifier en DB que `subscriptions` + `tenants.plan` sont mis à jour après le trigger

---

### 4. Génération async (prévention du timeout Netlify 26s)

> **Débloque :** génération de contenu fiable. Sans ce flag, ~50 % des générations dépassent le timeout serverless et le verrou `generatingAt` reste bloqué 5–10 min.

- [ ] **4a.** Dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `GENERATION_ASYNC` | `true` |

  **Vérification :** déclencher une génération de posts → la réponse revient en < 2 s (HTTP 202) + les posts apparaissent dans le dashboard après quelques dizaines de secondes (job async).

---

### 5. Storage R2 (photos des sites vitrines et publication sociale)

> **Débloque :** upload photos, sites vitrines avec photos, et envoi d'images à Zernio (Instagram).
> Sans `R2_PUBLIC_URL`, les photos sont bloquées par la CSP `img-src` et Zernio reçoit des `data:` URLs inutilisables.

- [ ] **5a.** Dans Netlify → **Environment variables** :

  | Variable | Comment l'obtenir |
  |---|---|
  | `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 → Overview |
  | `R2_ACCESS_KEY_ID` | Cloudflare R2 → **Manage R2 API tokens** → Create token |
  | `R2_SECRET_ACCESS_KEY` | Même token |
  | `R2_BUCKET_NAME` | Nom du bucket R2 créé |
  | `R2_PUBLIC_URL` | URL publique du bucket (ex: `https://media.aurapost.fr`) — **obligatoire** |

  **Vérification :** uploader une photo depuis `/dashboard/photos` → URL dans la réponse commence par `https://media.aurapost.fr/` (pas `data:`).

---

### 6. Wildcard SSL et DNS pour `*.aurapost.fr`

> **Débloque :** tous les sites vitrines coachs (`slug.aurapost.fr`). Sans ça, les URLs des sites ne répondent pas en HTTPS.
> **Documentation complète :** `docs/infra/wildcard-ssl.md`.

- [ ] **6a. Enregistrement DNS wildcard** — Chez votre registrar DNS :
  - Ajouter `CNAME *.aurapost.fr → <votre-site>.netlify.app` (TTL 300)
  - Si Cloudflare : désactiver le proxy (nuage gris) pour ce CNAME pendant la validation

- [ ] **6b. Ajouter le domaine dans Netlify** — Dashboard → **Site → Domain management → Custom domains** :
  - Ajouter `*.aurapost.fr`
  - Valider l'ownership via le TXT DNS demandé par Netlify

- [ ] **6c. Certificat SSL** — Netlify génère automatiquement un wildcard Let's Encrypt une fois le DNS validé. Si non généré après 24h : **Domain management → HTTPS → Verify DNS configuration**.

- [ ] **6d. Vérification :**
  ```bash
  dig CNAME coach-test.aurapost.fr
  curl -I https://coach-test.aurapost.fr
  # Attendu : HTTP/2 404 (sous-domaine inexistant en DB → notFound())
  ```

---

### 7. Crons — sécurité et planification externe

> **Débloque :** réconciliation des jobs bloqués, séquences email, grâce de paiement, rétention données.
> Sans `CRON_SECRET`, les routes `/api/cron/*` sont accessibles sans authentification.

- [ ] **7a. Générer et poser le secret** — Netlify → **Environment variables** :

  | Variable | Comment l'obtenir |
  |---|---|
  | `CRON_SECRET` | `openssl rand -hex 32` |

- [ ] **7b. Configurer le planificateur externe** — Utiliser [cron-job.org](https://cron-job.org) (gratuit) ou EasyCron. Créer les 8 jobs avec header `Authorization: Bearer <CRON_SECRET>` :

  | URL | Méthode | Fréquence | Rôle |
  |---|---|---|---|
  | `https://aurapost.fr/api/cron/reconcile-jobs` | POST | **Toutes les 10 min** | Jobs bloqués → failed, verrou libéré |
  | `https://aurapost.fr/api/cron/email-sequences` | POST | 1×/jour (8h) | Séquences réengagement coaches |
  | `https://aurapost.fr/api/cron/distributor-activation` | POST | 1×/jour (7h) | Activation J+1/3/7 des distributeurs |
  | `https://aurapost.fr/api/cron/monthly-reminder` | POST | 1×/jour (9h) | Rappel génération mensuelle |
  | `https://aurapost.fr/api/cron/data-retention` | POST | 1×/jour (2h) | Nettoyage données RGPD |
  | `https://aurapost.fr/api/cron/payment-grace` | POST | 1×/jour (6h) | Downgrade après 7j de retard paiement |
  | `https://aurapost.fr/api/cron/onboarding-reminder` | POST | 1×/jour (10h) | Relance coaches ayant abandonné l'onboarding |
  | `https://aurapost.fr/api/cron/monthly-report` | POST | 1×/mois (J=1, 10h) | Rapport mensuel aux coaches (posts, trafic, leads) |

  **Vérification :** appeler manuellement `https://aurapost.fr/api/cron/reconcile-jobs` avec le header → réponse `200 {"ok":true}`.

---

### 8. Zernio — publication sociale (pack_complet)

> **Débloque :** connexion LinkedIn/Instagram et bouton "Publier" pour les abonnés pack_complet (79€).
> **Ordre :** après la migration 0006 (item 1b) et après avoir un tenant pack_complet pour tester.

- [ ] **8a.** Dans [app.zernio.com](https://app.zernio.com) → **Settings → API Keys** → copier la clé.

- [ ] **8b.** Générer le secret webhook : `openssl rand -hex 32`

- [ ] **8c.** Poser dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `ZERNIO_API_KEY` | `zn_live_...` depuis le dashboard Zernio |
  | `ZERNIO_WEBHOOK_SECRET` | Secret généré ci-dessus |

- [ ] **8d. Configurer le webhook dans Zernio** — Dashboard Zernio → **Webhooks → Add endpoint** :
  - URL : `https://aurapost.fr/api/social/webhook`
  - Signing secret : la valeur de `ZERNIO_WEBHOOK_SECRET` ci-dessus
  - Événements : `post.published`, `post.failed`

- [ ] **8e. Vérification :**
  - Se connecter en tant que tenant pack_complet → `/dashboard/social` → bouton "Connecter LinkedIn" visible (pas de message "plan requis")
  - Initier le flow OAuth → arriver sur le callback Zernio sans erreur 503
  - Sur un post approuvé avec photo : bouton "Publier" visible dans la carte → dialog s'ouvre avec les connexions disponibles

---

## 🟡 IMPORTANT MAIS NON BLOQUANT

*Le produit fonctionne sans ces éléments, mais tu navigues à l'aveugle en cas d'incident.*

---

### 9. Observabilité — Axiom (logs structurés)

> **Sans Axiom :** les logs restent dans Netlify (stdout uniquement, non persistants au-delà de 24h, non interrogeables). En cas d'incident, impossible de tracer une erreur sur des données passées.

- [ ] **9a.** Créer un compte sur [app.axiom.co](https://app.axiom.co) → **Datasets → New dataset** → nommer `aurapost-prod`.

- [ ] **9b.** Créer un API token — **Settings → API Tokens → New API Token** → scope **Ingest** (write-only suffit).

- [ ] **9c.** Poser dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `AXIOM_DATASET` | `aurapost-prod` |
  | `AXIOM_TOKEN` | `xaat-...` depuis le dashboard Axiom |

  **Vérification :** déclencher une action (génération, connexion) → vérifier dans Axiom Dashboard → **Stream** que les logs arrivent avec les champs `event`, `tenantId`, `metadata`.

---

### 10. Rate limiting distribué — Upstash Redis

> **Sans Upstash :** le rate limiting tourne en mémoire locale par instance Lambda. Sur plusieurs lambdas parallèles, un attaquant peut bypass en parallélisant ses requêtes.

- [ ] **10a.** Créer une DB Redis sur [upstash.com](https://upstash.com) → **Create Database** → région EU West.

- [ ] **10b.** Poser dans Netlify → **Environment variables** :

  | Variable | Où trouver |
  |---|---|
  | `UPSTASH_REDIS_REST_URL` | Dashboard Upstash → DB → REST API → `UPSTASH_REDIS_REST_URL` |
  | `UPSTASH_REDIS_REST_TOKEN` | Même page → `UPSTASH_REDIS_REST_TOKEN` |

  **Vérification :** déclencher 5 générations rapides depuis le même compte → la 6e est bloquée par le rate limiter (réponse 429).

---

### 11. Alertes admin — email sur jobs échoués

> **Sans `ADMIN_ALERT_EMAIL` :** les jobs échoués sont loggés mais aucun email n'est envoyé à Logan. Il faudrait surveiller manuellement les logs Axiom.

- [ ] **11a.** Poser dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `ADMIN_ALERT_EMAIL` | `logan.case06@gmail.com` (ou adresse dédiée) |
  | `ADMIN_EMAILS` | `logan.case06@gmail.com` (accès au panel `/admin`) |

  **Vérification :** appeler `stripe trigger invoice.payment_failed` → recevoir un email d'alerte sur `ADMIN_ALERT_EMAIL`.

---

### 12. Édition IA d'images (feature pack_complet)

> **Sans `OPENAI_API_KEY` :** l'édition IA de photos est désactivée avec mock propre (pas de crash). Les coachs pack_complet ne peuvent pas modifier leurs photos par IA.

- [ ] **12a.** Créer une clé API sur [platform.openai.com](https://platform.openai.com) → **API Keys → Create new secret key**.

- [ ] **12b.** Poser dans Netlify → **Environment variables** :

  | Variable | Valeur |
  |---|---|
  | `OPENAI_API_KEY` | `sk-...` |

  **Vérification :** tester l'édition d'une photo depuis le dashboard → résultat visible sans erreur (requiert une photo uploadée sur R2).

---

### 13. Secrets accessoires (calendrier, isolation)

> Ces variables ont des fallbacks dans le code mais sont recommandées pour une isolation correcte en prod.

- [ ] **13a.** Poser dans Netlify → **Environment variables** :

  | Variable | Comment l'obtenir | Comportement si absent |
  |---|---|---|
  | `CALENDAR_SECRET` | `openssl rand -base64 32` | Fallback sur `NEXTAUTH_SECRET` avec préfixe "cal:" — acceptable mais non isolé |
  | `APP_DOMAIN` | `aurapost.fr` | Défault hardcodé `aurapost.fr` — déjà correct |

---

## 🟢 DIFFÉRABLE

*Pas urgent pour le lancement. À planifier après les premières semaines en production.*

---

### 14. Validation juridique CGV programme de parrainage

- [ ] Faire relire `docs/legal-drafts/referral-terms-DRAFT.md` par un juriste (ou service type Legalstart) **avant toute publication de la page `/referral-terms`** comme page publique liée dans les emails.
- **Pourquoi différable :** le programme de parrainage fonctionne techniquement sans que les CGV soient publiées. Les coaches actuels ont accès à leur lien de parrainage, la page légale n'est pas encore liée publiquement.
- **Débloque quand fait :** possibilité de promouvoir officiellement le programme de parrainage.

---

### 15. 4e style visuel

- [ ] Décider de l'identité produit du 4e style (target : quelle niche coach, quel vibe) — voir `docs/roadmap-nouveaux-styles.md`.
- **Pourquoi différable :** le terrain technique est entièrement prêt (`assertStyleUnreachable`, switch exhaustif). Il ne manque que la décision produit.
- **Ne pas démarrer** sans avoir tranché l'identité : niche cible, palette, typographie, ordre des sections.

---

### 16. Métriques admin en temps réel (B.3 ROADMAP)

- [x] ~~Remplacer les valeurs hardcodées~~ — **Fait.** `lib/db/admin.ts` calcule désormais toutes les métriques depuis la DB : MRR réel depuis les plans actifs, taux mock/API, dernière génération, répartition des plans, NPS absent (supprimé). Aucune valeur simulée restante.

---

### 17. Attribution cookie parrainage (R-1) + email filleul (R-2)

- [ ] **R-1 :** poser un cookie `aurapost_ref` dans `/ref/[code]` pour persister le code 30 jours même si le visiteur ne s'inscrit pas immédiatement.
- [ ] **R-2 :** envoyer un email de confirmation au filleul (pas seulement au parrain) quand le parrainage est enregistré.
- **Pourquoi différable :** le parrainage fonctionne pour les inscriptions directes (sans fermeture de fenêtre entre le clic et l'inscription). Ces améliorations réduisent l'attrition du funnel, pas une urgence au lancement.
- **Effort :** S chacun (~2–3h).

---

### 18. Analytics sociaux réels (Volet B)

- [ ] Décider du go/no-go sur la Meta App Review (semaines à mois de délai) — voir `docs/roadmap-analytics.md` Phase B-0.
- **Pourquoi différable :** dépend d'une approbation externe imprévisible. Volet A (analytics site vitrine) est déjà en prod via les migrations de l'item 1.

---

## Résumé des variables d'environnement

Récapitulatif complet de toutes les variables à poser dans Netlify → **Environment variables** :

```
# Auth (obligatoire)
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://aurapost.fr
NEXT_PUBLIC_APP_URL=https://aurapost.fr

# Email (obligatoire)
RESEND_API_KEY=re_...
RESEND_FROM=AuraPost <onboarding@aurapost.fr>
UNSUBSCRIBE_SECRET=<openssl rand -hex 32>

# Génération IA (obligatoire)
ANTHROPIC_API_KEY=sk-ant-...
GENERATION_ASYNC=true

# Stripe (obligatoire pour le revenu)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CONTENT_ONLY=price_...
STRIPE_PRICE_PACK_COMPLET=price_...

# Storage R2 (obligatoire pour les photos)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://media.aurapost.fr

# Crons (obligatoire — sécurité + tâches planifiées)
CRON_SECRET=<openssl rand -hex 32>

# Zernio publication sociale (obligatoire pour pack_complet)
ZERNIO_API_KEY=zn_live_...
ZERNIO_WEBHOOK_SECRET=<openssl rand -hex 32>

# Admin
ADMIN_EMAILS=logan.case06@gmail.com
ADMIN_ALERT_EMAIL=logan.case06@gmail.com
APP_DOMAIN=aurapost.fr

# Observabilité (recommandé)
AXIOM_DATASET=aurapost-prod
AXIOM_TOKEN=xaat-...

# Rate limiting (recommandé)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Édition IA images (fonctionnalité pack_complet)
OPENAI_API_KEY=sk-...

# Optionnel (fallbacks en place)
CALENDAR_SECRET=<openssl rand -base64 32>
```

---

## Si tu ne fais qu'une seule chose aujourd'hui

**Stripe (items 3a → 3f).** C'est le seul item qui génère du revenu : tant que les clés prod ne sont pas posées, aucun coach ne peut s'abonner, le produit existe mais ne se monétise pas. Les migrations Turso et les clés Zernio activent des fonctionnalités ; Stripe active le business.
