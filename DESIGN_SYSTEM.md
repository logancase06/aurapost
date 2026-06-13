# DESIGN_SYSTEM.md — AuraPost

Système de design « énergique sport » — comme si Nike avait designé un SaaS. Dark mode par
défaut, accent violet électrique, typographie massive, angles nets et diagonales, animations
rapides et nerveuses (150–200 ms).

---

## 1. Tokens (CSS variables — `app/globals.css`)

HSL sans wrapper, mappés sur Tailwind dans `tailwind.config.ts`. Dark forcé (`<html class="dark">`).

| Token | Valeur | Usage |
| ----- | ------ | ----- |
| `--background` | `240 24% 5%` (#0A0A0F) | Fond profond |
| `--card` | `240 18% 8%` (#111118) | Surfaces |
| `--primary` | `262 83% 58%` (#7C3AED) | Accent violet électrique |
| `--accent` | `271 91% 65%` (#A855F7) | Violet clair (gradients) |
| `--foreground` | `0 0% 98%` | Texte (blanc quasi pur) |
| `--muted-foreground` | `240 6% 64%` | Texte secondaire |
| `--success` / `--warning` / `--destructive` | vert / ambre / rouge | États |
| `--border` / `--input` / `--ring` | `240 10% 18%` / ring violet | Bordures, focus |
| `--radius` | **0.5rem (8px max)** | Angles nets, jamais d'arrondi excessif |

**Contraste fort** : blanc pur sur noir profond, accent violet pour les CTA et focus.

## 2. Typographie

- Police : **Geist Sans** (`next/font`, `font-display: swap`, préchargée dans `layout.tsx`).
- Titres hero : `text-8xl font-black uppercase tracking-tighter` (massif, agressif).
- Titres section : `text-4xl/5xl font-black uppercase tracking-tighter`.
- Numéros de section éditoriaux : classe `.section-number` (clamp 6–16rem, opacity 4 %).

## 3. Animations (`tailwind.config.ts`)

Keyframes premium : `meteor`, `spotlight`, `shimmer-slide`, `spin-around`, `border-beam`,
`aurora`, `shimmer`, `fade-up`. Durées d'interaction **150 ms** (boutons, tabs, hover).

Conventions :
- Boutons : `active:scale-[0.97]` (pression physique) — dans `components/ui/button.tsx`.
- Cards : classe `.hover-lift` (translateY -4px + ombre violette).
- Sections : `.clip-diagonal-top` / `.clip-diagonal-bottom` (diagonales, pas de rectangles plats).
- Grain : `<GrainOverlay/>` global (texture subtile façon Linear).

## 4. Composants premium (copiés dans `components/ui/` — modèle Aceternity/Magic)

| Composant | Source | Rôle |
| --------- | ------ | ---- |
| `Spotlight` | Aceternity | Halo SVG flou animé (hero) |
| `Meteors` | Aceternity | Étoiles filantes (déterministes, SSR-safe) |
| `Particles` | Magic UI | Particules canvas (desktop only, dynamic import) |
| `TextGenerateEffect` / `TypewriterEffect` | Aceternity | Titres animés (framer-motion) |
| `MovingBorder` / `MovingBorderCard` | Aceternity | Bordure lumineuse animée (pricing) |
| `ShimmerButton` | Magic UI | CTA premium |
| `BorderBeam` | Magic UI | Faisceau de bordure (feature & post cards) |
| `CardContainer/Body/Item` (`card-3d`) | Aceternity | Hover 3D (stat cards) |
| `AnimatedTabs` | maison (framer) | Tabs à indicateur glissant (Instagram/LinkedIn) |
| `AnimatedCounter` / `ScrollReveal` | maison (framer) | Compteurs 0→N, apparition au scroll |
| `GrainOverlay` / `MouseGlow` / `BetaBadge` / `ScanLine` (`decor`) | maison | Détails premium |
| `CustomCursor` | maison (RAF) | Curseur suiveur mix-blend qui grossit/se remplit sur les éléments cliquables (desktop, `pointer:fine` only) |
| `FaviconController` / `setAppBusy()` | maison (canvas) | Favicon animé : pastille AuraPost → spinner violet pendant une génération |
| `MobileBottomBar` | maison | Bottom bar de navigation < md (remplace la sidebar sur smartphone, zones tactiles ≥ 56px) |
| `NotificationsBell` | maison | Cloche header + dropdown (badge pulse non-lus, marquage lu) |
| `SectionBoundary` | maison | Error boundary React réutilisable (isole un widget critique) |
| `HowItWorks` / `BeforeAfter` / `Testimonials` | maison (landing) | Sections de conversion : étapes SVG custom, comparatif avant/après, carrousel auto-scroll (marquee CSS) |
| `LiveCounter` | maison | Compteur « live » du hero (RAF + incrément lent) |
| `ExitIntent` | maison (Dialog) | Pop-in exit-intent (souris vers le haut, 1×/appareil via localStorage) |

**Composants fonctionnels (shadcn/ui)** : `button`, `card`, `badge`, `input`, `label`,
`table`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `progress`, `avatar`, `separator`,
`alert`, `skeleton` — pour formulaires, tables, dialogs, navigation.

## 5. Performance

- Effets lourds (Particles, Meteors) en **`next/dynamic` `ssr:false`** → bundle initial allégé.
- Effets Aceternity **désactivés sur mobile** via `useIsDesktop()` (`lib/hooks/use-media-query.ts`).
- Police préchargée, `font-display: swap`.
- Images : `next/image` (lazy par défaut) pour les assets ; photos coach via R2.

## 6. Voix & copywriting

Premium, direct, tutoiement énergique. Pas de « Bienvenue sur AuraPost » mais
« Ton contenu. Ton style. Généré en 2 minutes. ». Microcopy d'action orientée résultat :
« Créer mes 12 posts », « Génère mes 3 posts », « Je crée mon compte ». Empty states dessinés
(SVG custom) et motivants.

## 7. Patterns de page

- **Landing** : hero Spotlight + Particles + Typewriter + `text-8xl`, sections en diagonale,
  Meteors derrière le pricing, MovingBorder sur la card recommandée, ShimmerButton sur les CTA.
- **Dashboard** : sidebar fixe (glow au survol) + bottom bar mobile (`MobileBottomBar`), header
  avatar, stat cards 3D + compteurs animés, tabs animés IG/LinkedIn, post cards BorderBeam +
  hover-lift, empty state SVG.
- **Démo** : hero compact Spotlight, résultats en card-flip (framer), skeleton shimmer.
- **Onboarding** : stepper + progress bar à glow violet, entrée animée.

## 8. Repères pour un designer qui reprend le projet

- Tout passe par les tokens HSL → changer la teinte = éditer `--primary`/`--accent`.
- Garder `--radius` ≤ 8px (identité « angles nets »).
- Réutiliser `.hover-lift`, `.clip-diagonal-*`, `.section-number` plutôt que de redéfinir.
- Nouveaux effets : copier le composant Aceternity/Magic dans `components/ui/`, l'envelopper
  d'un `dynamic(..., { ssr:false })` s'il est lourd, et le gater sur `useIsDesktop()`.
