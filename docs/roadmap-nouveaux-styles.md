# Roadmap Nouveaux Styles Visuels — AuraPost
> Chantier long terme · Dernière mise à jour : 2026-06-26 · **Phase S-0 IMPLÉMENTÉE (refactor switch/never exhaustif)**

---

## ⚠️ Questions produit à trancher avant de démarrer

Ce document couvre le processus et le coût technique. Les questions d'identité visuelle (nom, palette, personnalité) sont volontairement exclues — elles relèvent de décisions produit.

**Q1 — Identité du 4e style**
Avant tout code : quel est le positionnement visuel de ce nouveau style ?
- Nom (ex: "Momentum", "Flow", "Lumière")
- Public cible / niche associée (ex: sport collectif, coaching en entreprise, well-aging, yoga dynamique)
- Registre visuel (sombre/clair, typographie serif/sans/display, mood global)
- Différenciation par rapport aux 3 existants : le 4e style doit répondre à un besoin non couvert par Impact (athlètes/performance), Clarté (wellness/épuré) et Authenticité (storytelling/coaching de vie)

Sans réponse à Q1, les phases S-2 à S-5 ne peuvent pas démarrer.

**Q2 — Niche cible et configuration de l'accent**
L'accent couleur est actuellement orthogonal au style — il varie par spécialité via `lib/coach-site-theme.ts`. Le 4e style héritera de ce système. Faut-il ajouter de nouvelles spécialités dans la table `themes` de `coach-site-theme.ts` en même temps que le style (ex: "sport collectif", "coaching corporate") ?

**Q3 — Disponibilité à la sortie**
Le 4e style doit-il être disponible pour tous les coachs dès son lancement, ou réservé à un plan supérieur (ex: `pack_complet` uniquement) ? Si gating par plan, un check `plan-guard.ts` est à ajouter.

**Q4 — Disponibilité sur la page Explore**
Lors du lancement du 4e style, combien de sites démo l'illustrent sur la page Explore ? (Aujourd'hui : 4 Impact + 3 Clarté + 3 Authenticité = 10 démos.) Faut-il ajouter 2-3 démos pour le nouveau style, ou le lancer d'abord sans démos Explore et l'ajouter après validation terrain ?

**Q5 — Nouvelle police Google Fonts ?**
Chaque style utilise une ou deux polices spécifiques (Bebas Neue pour Impact, Jakarta + Inter pour Clarté, Playfair + Lato pour Authenticité). Si le 4e style introduit une nouvelle police, elle sera hébergée via `next/font/google` — vérifier que cela ne viole pas la RGPD dans le contexte UE (Google Fonts self-hosted est la norme acceptable ; next/font/google auto-héberge les fonts donc c'est OK).

---

## Audit technique — Architecture des 3 styles existants

### Où sont définis les styles

L'architecture est **entièrement explicite** — pas d'abstraction générique, chaque style est une branche `if` dans chaque composant. C'est une décision délibérée : les 3 styles ne partagent pas de structure HTML commune.

**Fichiers à toucher pour ajouter un 4e style :**

| Fichier | Rôle | Type de modification |
|---|---|---|
| `templates/coach-site/types.ts` | `SiteStyle = 'impact' \| 'clarte' \| 'authenticite'` | Ajouter la nouvelle valeur à l'union |
| `templates/coach-site/theme.ts` | `themeFor(style)` retourne les tokens (bg, surface, ink, muted, border, fonts) · `styleForTone()` suggestion par ton | Ajouter un `if (style === 'nouveau')` dans `themeFor()` + cas dans `styleForTone()` |
| `templates/coach-site/fonts.ts` | Import Google Fonts via `next/font/google` | Ajouter la nouvelle font si différente |
| `templates/coach-site/CoachSite.tsx` | `SECTION_ORDER` record par style | Ajouter l'entrée pour le nouveau style |
| `templates/coach-site/components/HeroSection.tsx` | 3 branches `if` actuelles — **le composant le plus complexe** | Ajouter une nouvelle branche (la plus grande section de code) |
| `templates/coach-site/components/ForcesSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/AProposSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/ServicesSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/ResultsSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/TemoignagesSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/ContactSection.tsx` | 3 branches | Ajouter branche |
| `templates/coach-site/components/SiteNav.tsx` | Nav commune (barre sticky, logo) | Probablement peu de changement sauf si la nav doit varier par style |
| `templates/coach-site/components/SiteFooter.tsx` | `footerPalette()` par style | Ajouter cas |
| `templates/coach-site/components/GrainOverlay.tsx` | `null` si `style !== 'impact'` | Modifier si le nouveau style utilise du grain (sinon aucun changement) |
| `templates/coach-site/components/SectionTitle.tsx` | Titres de section stylisés par style | Ajouter branche (petit) |
| `lib/coach-site-theme.ts` | Accents par spécialité — orthogonal | Potentiellement ajouter de nouvelles spécialités si le style cible une niche non couverte |
| `lib/explore/sites.ts` | Démos statiques + `STYLE_RANK` | Ajouter 2-3 démos + ajuster le rang |
| `app/dashboard/website/explore/ExploreClient.tsx` | Filtres de la page Explore | Ajouter la valeur dans le sélecteur de filtre |
| `app/dashboard/website/TemplateChooser.tsx` | Sélecteur de template dans le wizard de création | Ajouter le nouveau style |
| `.claude/skills/aurapost-design/SKILL.md` | Documentation design — source de vérité | Documenter le nouveau style |

**Total : ~18 fichiers.** La majorité sont des ajouts isolés (une branche `if` de plus). L'effort concentré est dans `HeroSection.tsx` et les 6 composants de section.

---

### Risque de régression : le piège du fallback implicite

**Point critique à comprendre avant de toucher le code** :

Dans `HeroSection.tsx`, les branches actuelles sont :
```ts
if (style === 'impact') { /* ... */ }
if (style === 'clarte') { /* ... */ }
// pas de else explicite → retourne le JSX d'Authenticité
return (...) // authenticite implicite
```

Si on ajoute `SiteStyle = 'impact' | 'clarte' | 'authenticite' | 'nouveau'` sans ajouter la branche dans `HeroSection.tsx`, TypeScript **ne signalera aucune erreur** — le nouveau style affichera silencieusement le hero Authenticité.

Ce piège existe dans **tous les composants de section**.

**Solution recommandée pour le 4e style** : avant d'écrire la moindre UI, refactorer les branches pour qu'elles soient exhaustives :
```ts
// Remplacer le return implicite par un switch ou des assert
switch (style) {
  case 'impact': return <ImpactHero />;
  case 'clarte': return <ClarteHero />;
  case 'authenticite': return <AuthenticiteHero />;
  case 'nouveau': return <NouveauHero />;
  default: { const _: never = style; return null; }
}
```
Avec `never`, TypeScript signalera une erreur à la compilation si un nouveau style est ajouté à l'union sans être traité dans le switch. Ce refactoring ne change aucun comportement runtime mais rend le code exhaustif et protège les 5e, 6e styles futurs.

**Effort de ce refactoring préalable** : S (~2h pour transformer tous les `if/else` en `switch/never`).

---

### Coût de la section Hero : le gros morceau

`HeroSection.tsx` fait ~260 lignes pour 3 styles (environ 80-90 lignes par style, en comptant les animations Framer Motion). Un 4e style Hero de complexité similaire = ~80-90 lignes supplémentaires.

Les règles d'animation (du SKILL.md §7) doivent être respectées :
- `LazyMotion features={domAnimation} strict` — déjà en place, à conserver
- Photo jamais animée (LCP protection)
- H1 jamais `opacity:0` (LCP)
- `useReducedMotion()` doit couvrir le nouveau style

Les animations du nouveau style suivront le même système que les 3 existants — le pattern est éprouvé, pas besoin de l'inventer.

---

### Coût des sections de contenu : prévisible

Les 6 sections de contenu (forces, apropos, services, results, temoignages, contact) ont chacune 3 branches de ~20-50 lignes. Un 4e style = +20-50 lignes par section, soit ~150-200 lignes supplémentaires au total sur les 6 fichiers.

Le risque de régression sur les sections est **faible** : les branches sont indépendantes, et changer la branche `nouveau` ne peut pas casser `impact`, `clarte` ou `authenticite` si le code est bien isolé.

---

## Processus reproductible pour un nouveau style (4e, 5e, 6e...)

Ce processus est la vraie livraison de ce chantier : une méthode répétable, pas juste un 4e style.

### Étape 0 — Décision produit (hors code)
Répondre à Q1-Q5 et documenter les réponses dans ce fichier ou dans un brief dédié :
- Nom du style
- Palette : bg, surface, ink, muted, border (héxadécimal, pas de variable CSS car les sites sont rendus sans l'app AuraPost)
- Typographies : corps + titres (noms Google Fonts exact, weights, transformations)
- Mood : 2-3 mots (ex: "corporate, moderne, confiance")
- Structure hero : layout (full-width, deux colonnes, centré ?), position photo, CTA shape
- Ordre narratif des sections (quelle logique storytelling ?)
- Règles absolues propres au style (ex: "jamais de grain", "photo toujours en fond", etc.)

### Étape 1 — Refactoring exhaustivité (S, une fois pour toutes)
- Transformer les `if/else` implicites en `switch/never` dans HeroSection + les 6 sections + SiteFooter + GrainOverlay + SiteNav
- Build doit passer — les 3 styles existants sont inchangés fonctionnellement

### Étape 2 — Tokens et fonts (S)
- Ajouter les fonts dans `templates/coach-site/fonts.ts`
- Ajouter le cas dans `themeFor()` dans `theme.ts`
- Ajouter le cas dans `styleForTone()` si une association ton → style est pertinente
- Vérifier que `themeFor('nouveau')` retourne un objet `Theme` complet

### Étape 3 — Hero (M)
- Implémenter la branche hero dans `HeroSection.tsx`
- Définir les animations FM en respectant les règles §7 du SKILL.md (LCP, reduced motion, LazyMotion)
- Tester visuellement sur desktop + mobile + sans photo (le fallback doit être une vraie composition, pas un trou)
- Tester avec `useReducedMotion = true` (éléments en état final immédiat)

### Étape 4 — Sections de contenu (M)
- Implémenter une branche par section (forces, apropos, services, results, temoignages, contact)
- Pour chaque section : vérifier le comportement si `data.forces` est vide, si `testimonials` est vide, etc. — tous les guards sont déjà dans les sections existantes, les reproduire
- GrainOverlay : décider si le style utilise le grain. Si oui : changer la condition dans `GrainOverlay.tsx`. Si non : aucun changement.
- SiteFooter : ajouter la palette footer dans `footerPalette()`

### Étape 5 — Intégration explore (S)
- Ajouter 2-3 entrées dans `lib/explore/sites.ts` avec des données fictives crédibles (noms inventés, spécialités cohérentes avec le style)
- Ajouter le nouveau style dans `STYLE_RANK` et dans la liste des filtres
- Tester les vignettes `SiteThumbnail.tsx` — la vignette est une mini-maquette, vérifier qu'elle reflète fidèlement le layout hero du nouveau style

### Étape 6 — Questionnaire et TemplateChooser (S)
- Ajouter le style dans `app/dashboard/website/TemplateChooser.tsx` — description + vignette + tag de spécialité recommandée
- Vérifier que le flow complet fonctionne : Explore → "Utiliser ce style" → questionnaire → génération → site rendu

### Étape 7 — Documentation SKILL.md (S)
Documenter le nouveau style dans `.claude/skills/aurapost-design/SKILL.md` selon le format des §1 à §4 existants :
- Palette complète (tableau Token/Valeur)
- Typographies (corps + titres, avec weights et transformations)
- Structure hero (layout, photo position, CTA shape)
- Spécificités par section (forces, temoignages...)
- Règles absolues propres au style
- Ordre des sections (narratif)
- Footer palette

Sans cette documentation, la prochaine session de travail sur le style réintroduira des erreurs (c'est pourquoi le SKILL.md existe).

---

## Phasage du 4e style

| Phase | Description | Effort | Dépend de |
|---|---|---|---|
| S-0 | Décisions produit (Q1-Q5) — hors code | — | Vous |
| S-1 | Refactoring switch/never exhaustif (protège tous les styles futurs) | S | — |
| S-2 | Tokens + fonts (`theme.ts`, `fonts.ts`) | S | S-0 (palette/fonts décidées) |
| S-3 | Hero section (branche FM + fallback sans photo) | M | S-1, S-2 |
| S-4 | 6 sections de contenu + footer + grain | M | S-1, S-2 |
| S-5 | Démos Explore + filtres + TemplateChooser | S | S-3, S-4, Q4 |
| S-6 | Documentation SKILL.md | S | S-3, S-4 |

**Effort total : 1 S + 3 S + 2 M = environ 1 semaine de travail effectif**, à décomposer en 4 sessions dédiées (S-1 seul, S-2 seul, S-3+S-4, S-5+S-6).

---

## Notes sur le coût des styles 5e, 6e...

Avec le refactoring S-1 en place, chaque style supplémentaire suit exactement le même processus (Étapes 0-7). L'effort est prévisible et stable : environ L par nouveau style.

Le vrai coût à surveiller à long terme est la **taille du bundle** : chaque style ajoute des fonts (~10-30 KB gzip supplémentaires) et du code JSX. À partir du 5e ou 6e style, il faudra envisager du lazy loading par style (code splitting au niveau du composant `CoachSite`) pour éviter de charger tous les styles chez un coach qui n'en utilise qu'un.
