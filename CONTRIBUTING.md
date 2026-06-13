# CONTRIBUTING.md — AuraPost

Merci de contribuer à AuraPost ✦. Ce guide décrit l'environnement, les conventions et le
process de PR.

## Prérequis

- Node ≥ 20, npm.
- `npm install` — aucune clé n'est requise pour développer (tout a un mock).
- `npx tsx scripts/check-env.ts` pour voir ce qui tourne en mode mock vs live.

## Démarrer

```bash
npm run dev          # http://localhost:3000 (SQLite mémoire si pas de Turso)
npm run seed         # 3 coachs de démo (mdp : Demo!Aura2026)
```

## Avant toute PR — checklist verte

```bash
npm run type-check   # tsc --noEmit, 0 erreur
npm run lint         # eslint, 0 erreur
npm test             # jest (unitaires)
npm run build        # next build, 0 erreur
npm run test:e2e     # Playwright (optionnel, démarre un serveur de test)
```

Une PR ne passe que si **type-check + lint + build** sont verts.

## Conventions de code

- **TypeScript strict**, pas de `any` non justifié, pas de `@ts-ignore` sans commentaire.
- **Isolation multi-tenant** : toute lecture/écriture DB passe par `getTenantId()` /
  `requireTenantId()`. Jamais de requête sans filtre `tenant_id`.
- **Sécurité** : mutations publiques → `csrfGuard` + honeypot + `sanitizeText`.
  Uploads → `MAX_UPLOAD_BYTES` (5 Mo). Voir `lib/security.ts`.
- **Schéma DB** : modifier `lib/db/schema.ts` ET `lib/db/bootstrap-schema.ts` (mock) de pair,
  puis `npm run db:generate`.
- **UI** : composants visuels premium dans `components/ui/` (modèle Aceternity/Magic) ;
  composants fonctionnels shadcn ; respecter les tokens (`app/globals.css`) et
  `DESIGN_SYSTEM.md` (radius ≤ 8px, accent violet, animations 150 ms).
- **i18n** : toute chaîne UI nouvelle → `locales/fr.json` + `locales/en.json`.
- **Mock-first** : toute intégration externe doit fonctionner sans clé (fallback mock propre).

## Style des commits

Convention [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat(dashboard): ajoute le calendrier éditorial
fix(auth): corrige la détection d'origine CSRF
docs(api): documente /api/health/detailed
```

Types : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.

## Process de PR

1. Branche depuis `main` : `git checkout -b feat/ma-fonctionnalite`.
2. Commits atomiques, messages conventionnels.
3. Checklist verte (ci-dessus).
4. Ouvrir la PR avec : contexte, captures si UI, étapes de test.
5. Au moins une review. Squash & merge.

## Arborescence

```
app/            Pages & routes (App Router)
components/     UI réutilisable (ui/ = primitives premium + shadcn)
lib/            Logique métier, accès DB, intégrations, sécurité, i18n
locales/        Traductions fr/en
templates/      Templates de site coach
scripts/        check-env, seed, screenshots
e2e/            Tests Playwright
__tests__/      Tests unitaires Jest
```
