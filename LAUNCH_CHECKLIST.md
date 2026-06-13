# LAUNCH_CHECKLIST — AuraPost

Tout ce qu'il faut vérifier avant de mettre en production. À cocher dans l'ordre.

## 1. Code & qualité

- [ ] `npm run type-check` → 0 erreur
- [ ] `npm run lint` → 0 erreur
- [ ] `npm test` → vert
- [ ] `npm run build` → vert
- [ ] `npm run test:e2e` → vert (desktop + mobile)
- [ ] `npx tsx scripts/deploy-check.ts` → aucune variable critique manquante

## 2. Infrastructure

- [ ] **Turso** : base de production créée, `npm run db:push` exécuté, token en variable d'env.
- [ ] **Resend** : domaine `aurapost.fr` vérifié (SPF/DKIM), `RESEND_FROM` configuré.
- [ ] **Stripe** : produits/prix créés, webhook `/api/webhooks/stripe` enregistré + `STRIPE_WEBHOOK_SECRET`.
- [ ] **Cloudflare R2** : bucket créé, token, `R2_PUBLIC_URL` accessible.
- [ ] **Upstash Redis** : instance créée (rate limit/cache distribués).
- [ ] **NextAuth** : `NEXTAUTH_SECRET` généré (`openssl rand -base64 32`), `NEXTAUTH_URL` = domaine prod.
- [ ] **DNS** : `aurapost.fr` + wildcard `*.aurapost.fr` (sous-domaines coachs) pointent sur Netlify.

## 3. Variables d'environnement (Netlify)

- [ ] Toutes les variables de `DEPLOY.md` renseignées.
- [ ] `MAINTENANCE_MODE` non défini (ou `false`).
- [ ] `CRON_SECRET` généré + crons planifiés (onboarding-reminder, email-sequences, data-retention).
- [ ] `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` (si tracking activé).

## 4. Vérifications fonctionnelles (post-déploiement)

- [ ] `/status` : intégrations attendues en **Live**.
- [ ] `GET /api/health/detailed` → `status: ok`.
- [ ] Inscription → onboarding → génération → approbation → site → publication : flux complet OK.
- [ ] Email de bienvenue reçu (boîte réelle).
- [ ] Paiement test Stripe (mode test) → `/success` + webhook reçu.
- [ ] `/demo/vincent` s'affiche (page de vente).
- [ ] Parrainage `/ref/CODE` → crédit appliqué.
- [ ] PWA installable (manifest, icônes), service worker actif.
- [ ] Bannière cookies fonctionne (consentement respecté).
- [ ] Export RGPD `/api/gdpr/export` + suppression `/api/gdpr/delete` OK.

## 5. SEO & contenu

- [ ] `sitemap.xml` + `robots.txt` accessibles.
- [ ] JSON-LD valide (Rich Results Test) sur landing + articles.
- [ ] og:image dynamiques OK (partage social testé).
- [ ] Pages légales `/privacy` + `/terms` à jour.

## 6. Performance

- [ ] `npx tsx scripts/lighthouse.ts` → scores > 90 (mobile & desktop) sur pages clés.
- [ ] `npm run analyze` → pas de chunk anormalement lourd.
- [ ] Images en `next/image` avec `sizes`/`priority` corrects.

## 7. Sécurité

- [ ] En-têtes de sécurité présents (CSP, HSTS, X-Frame-Options) — vérifier sur securityheaders.com.
- [ ] Rate limiting actif sur l'auth.
- [ ] Pas de secret committé (`git log -p | grep -i secret`).

## 8. Monitoring & sauvegarde

- [ ] `scripts/backup.ts` planifié (backup quotidien Turso → R2).
- [ ] Alertes configurées (uptime sur `/api/health`).
- [ ] Rapport admin hebdomadaire activé.

## 9. Go / No-Go

- [ ] Page de maintenance prête (`MAINTENANCE_MODE=true` en cas d'urgence).
- [ ] Plan de rollback connu (Netlify → Publish deploy précédent).
- [ ] Premier client (Vincent) prévenu et lien `/demo/vincent` envoyé.

🚀 **Tout coché → GO.**
