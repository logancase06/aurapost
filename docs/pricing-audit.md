# Audit tarifaire — AuraPost
> Rédigé le 2026-06-26. Aucun prix ni configuration Stripe modifiés dans ce document.
> Basé sur lecture directe du code source + recherche web concurrents.

---

## Étape 1 — Coût réel par utilisateur

### A. Faits vérifiés dans le code

| Élément | Valeur | Source |
|---|---|---|
| Modèle IA utilisé | `claude-sonnet-4-6` (configurable via `ANTHROPIC_MODEL`) | `lib/content-generator.ts:63` |
| Génération mensuelle posts | **1 seul appel API** (12 posts en une passe) | `generateMonthlyContent()` |
| Input max du prompt mensuel | `max_tokens=8000` output | `lib/content-generator.ts:141` |
| max_tokens édition IA site | `max_tokens=1200` output | `app/dashboard/website/actions.ts:172` |
| max_tokens variante post | `max_tokens=1500` output | `lib/content-generator.ts:389` |
| max_tokens pack légendes | `max_tokens=3000` output | `lib/content-generator.ts:685` |
| max_tokens onboarding demo | `max_tokens=1200` output | `lib/content-generator.ts:424` |
| Rate limit édition IA | 20 appels/heure/tenant | `app/dashboard/website/actions.ts:160` |
| Photos max par tenant | 10 (payant), 1 (starter) | `lib/plans.ts:116-117` |
| Resize photos | max 1200 px, JPEG qualité 85 | `lib/r2.ts:23` |
| Stripe frais EU | ~1,5 % + 0,25 € / transaction | Stripe pricing docs |
| Turso | prix fixe par plan (non par tenant) | Turso pricing |
| Upstash Redis | ~3 commandes / génération | `lib/rate-limit.ts` |

### B. Hypothèses et estimations (séparées des faits)

> Ces chiffres sont des estimations basées sur une lecture du code. Seules des données d'usage réel permettraient de les affiner.

**Estimation des tokens — génération mensuelle (12 posts) :**

`buildPrompt()` dans `lib/content-generator.ts` produit un prompt contenant :
- Header de rôle + données profil coach : ~600 tokens
- Exemples de qualité (2 posts) : ~300 tokens
- Règles de mission + format JSON : ~500 tokens
- **Total input estimé : ~1 400–2 000 tokens** selon richesse du profil

Output (12 posts × ~300 tokens/post en JSON) + overhead JSON : **~3 500–4 500 tokens**

| Élément | Tokens estimés | Tarif Sonnet 4.6 | Coût estimé |
|---|---|---|---|
| Input (génération mensuelle) | 2 000 | $3 / MTok | $0,006 |
| Output (génération mensuelle) | 4 000 | $15 / MTok | $0,060 |
| **Sous-total génération posts** | — | — | **~$0,066 (≈ €0,061)** |

**Estimation — usages optionnels (content_only et pack_complet) :**

| Usage | Input est. | Output max | Coût unitaire est. | Fréquence hypothèse |
|---|---|---|---|---|
| Variante d'un post | 2 000 tokens | 1 500 tokens | ~$0,029 | 3 / mois |
| Pack de 30 légendes (stories) | 300 tokens | 1 500 tokens | ~$0,025 | 1 × / trimestre |
| Demo post onboarding | 400 tokens | 1 200 tokens | ~$0,019 | 1 × (setup) |

**Estimation — édition IA site (pack_complet uniquement) :**

`applyAIEdit()` envoie : system prompt (~300 tokens) + JSON courant du site (~500 tokens) + instruction (~50 tokens)

| Élément | Tokens estimés | Tarif | Coût/appel |
|---|---|---|---|
| Input (system + JSON site + instruction) | ~1 000 | $3/MTok | $0,003 |
| Output (JSON modifié) | ~1 200 max | $15/MTok | $0,018 |
| **Par édition IA** | — | — | **~$0,021** |

**Hypothèse d'usage normal : 5 éditions IA/mois** → $0,105 ≈ €0,097
**Hypothèse haute : 15 éditions IA/mois** → $0,315 ≈ €0,29
(La rate limit à 20/heure empêche un abus massif mais pas une utilisation intensive.)

**Estimation — infrastructure :**

| Poste | Nature | Estimation par tenant |
|---|---|---|
| Cloudflare R2 (storage) | 10 photos × 300 KB ≈ 3 MB | ~€0,000045/mois (négligeable) |
| Cloudflare R2 (opérations) | ~10 PUT setup + 1 500 GET/mois | ~€0,001/mois (négligeable) |
| Cloudflare R2 (egress) | Gratuit (R2 → accès public) | €0 |
| Turso / LibSQL | Coût fixe ~$29/mois (Scaler) | €0,29 / 100 tenants → €0,03 / 1 000 tenants |
| Upstash Redis | ~3 cmd / génération / mois | <€0,001 (négligeable) |
| Netlify (fonctions Lambda) | 125 K incluses → $2/M | <€0,10 / mois à faible trafic |
| Resend (emails) | ~4 emails/user/mois | ~€0,0016 (négligeable) |

> **Avertissement** : les coûts Turso et Netlify sont des **coûts fixes mutualisés** — ils baissent par tenant à mesure que la base utilisateurs grandit. Les chiffres ci-dessus supposent 100 tenants actifs pour Turso et ~200 pour Netlify.

### C. Coût total et marge brute estimée

> **Toutes les hypothèses ci-dessous sont conservatrices (usage normal, pas de retry excessif, pas d'abus de variantes).**

**Scénario à 100 utilisateurs actifs :**

| Plan | Prix HT | Stripe (1,5%+0,25€) | AI (estimé) | Infra mutualisée | Total coût | Marge brute | % marge |
|---|---|---|---|---|---|---|---|
| `content_only` | 39 € | 0,84 € | 0,12 € | 0,40 € | **~1,36 €** | **~37,64 €** | **~96,5 %** |
| `pack_complet` | 79 € | 1,44 € | 0,21 € | 0,45 € | **~2,10 €** | **~76,90 €** | **~97,3 %** |

**Scénario à 1 000 utilisateurs actifs :**

| Plan | Prix HT | Stripe | AI | Infra mutualisée | Total coût | Marge brute | % marge |
|---|---|---|---|---|---|---|---|
| `content_only` | 39 € | 0,84 € | 0,12 € | 0,07 € | **~1,03 €** | **~37,97 €** | **~97,4 %** |
| `pack_complet` | 79 € | 1,44 € | 0,21 € | 0,08 € | **~1,73 €** | **~77,27 €** | **~97,8 %** |

> **Conclusion étape 1 :** le coût variable par utilisateur est dominé par les frais Stripe (80-85 % du coût variable), pas par les tokens IA. Même avec une utilisation intensive (15 éditions IA/mois), le coût IA reste sous €0,40/utilisateur/mois. Les marges brutes sont très élevées dans les deux cas — le modèle économique est sain à la variable.

---

## Étape 2 — Cohérence interne de la grille tarifaire

### A. Écart content_only vs pack_complet (+40€ / +103%)

**Ce que le code confirme comme différences réelles entre les plans :**

| Fonctionnalité | `content_only` | `pack_complet` | Source |
|---|---|---|---|
| Posts Instagram / mois | 8 | 8 | `lib/plans.ts:116` |
| Posts LinkedIn / mois | 4 | 4 | `lib/plans.ts:116` |
| Export (Buffer/Later) | ✅ | ✅ | `lib/plans.ts:116` |
| Variantes illimitées | ✅ (999/mois) | ✅ (999/mois) | `lib/plans.ts:116` |
| Photos profil | 10 | 10 | `lib/plans.ts:116` |
| `sitesEnabled` | ❌ | ✅ | `lib/plans.ts:117` |
| Portail réservations public | ❌ | ✅ (`hasWebsiteAccess()`) | `lib/plan-guard.ts:12` |
| Édition IA du site (20/h) | ❌ | ✅ (`canGenerateSite()` check) | `app/dashboard/website/actions.ts:154` |
| Badge "Certifié AuraPost" | ❌ | ✅ | `lib/plans.ts:58` |
| Support prioritaire | ❌ | ✅ (affiché) | `lib/plans.ts:58` |

**Constat important : les quotas de contenu sont identiques.** Un utilisateur `pack_complet` ne génère pas plus de posts qu'un `content_only`. Le différentiel de 40€ paie exclusivement le site vitrine + portail réservations + édition IA.

**Comparaison marché site seul :**
- Squarespace Personal : 16€/mois (site uniquement, édition manuelle)
- Wix Business : 17€/mois (site + e-commerce basique)
- Durable (site IA + outils marketing) : ~20-22€/mois
- Framer Pro (design avancé) : 30-40€/mois

Payer 40€ de plus pour obtenir un **site généré par IA depuis son profil + édition en langage naturel + portail réservations + sous-domaine hébergé** est cohérent et se situe dans le bas de la fourchette des constructeurs de sites web seuls (sans le contenu social). C'est une proposition de valeur lisible.

**⚠️ Point faible détecté :** le différentiel de quotas est nul entre les deux plans. Un coach sur `content_only` n'a aucun incentif à monter sur `pack_complet` via la quantité ou la personnalisation du contenu — uniquement via le site. Un palier intermédiaire de volume (ex: 20 posts/mois sur pack_complet) renforcerait la justification du premium.

### B. Limite de variantes : anomalie dans les constantes

`lib/constants.ts` définit des constantes `MAX_VARIANTS_FREE = 3`, `MAX_VARIANTS_CONTENT = 20`, `MAX_VARIANTS_PRO = 50` — mais `lib/plans.ts` écrase ces valeurs en définissant `variantesMax: 999` pour les deux plans payants.

**Les constantes de `lib/constants.ts` ne sont pas utilisées dans le gating réel.** Seul `getPlanLimits().variantesMax` fait foi. Les variantes sont effectivement illimitées en pratique pour les plans payants.

> ✅ **Résolu le 2026-06-26 (Option A — suppression)** : `MAX_VARIANTS_FREE`, `MAX_VARIANTS_CONTENT` et `MAX_VARIANTS_PRO` ont été supprimées de `lib/constants.ts`. Grep exhaustif confirmé : zéro usage dans le codebase actif. `MAX_VARIANTS_FREE = 3` était de surcroît incohérente avec la valeur réelle de gating du starter (`variantesMax: 0` dans `lib/plans.ts`). Le gating réel reste `getPlanLimits().variantesMax` (valeurs : `0` / `999` / `999`). Si un différentiel de variantes par plan est introduit à l'avenir, il suffira d'ajuster les valeurs dans le record `LIMITS` de `lib/plans.ts` — pas besoin de rétablir ces constantes.

### C. Mode organisation/réseau — grille propre mais désalignée

`lib/plans.ts` définit des `TEAMS_PLANS` séparés des plans individuels :

| Plan réseau | Limite | Tarif |
|---|---|---|
| `teams_starter` | jusqu'à 50 distributeurs | 490 €/mois |
| `teams_growth` | jusqu'à 200 distributeurs | 1 900 €/mois |
| `teams_enterprise` | 500+ distributeurs | sur devis |

Ces plans couvrent le mode **franchise/MLM** (organisations avec réseau de distributeurs, brand kit imposé, crons d'activation J+1/3/7). Il ne s'agit **pas** du cas coach solo + CM.

**Lacune confirmée :** un coach sur `pack_complet` (79€/mois) qui veut ajouter un Community Manager paye exactement le même prix qu'un coach seul. Il n'existe pas de plan intermédiaire "coach + 1 collaborateur" entre 79€ et 490€. C'est un saut tarifaire de 6× pour une fonctionnalité radicalement différente. Ce manque est cohérent avec l'état du code (multi-user non implémenté — voir ROADMAP Section C).

---

## Étape 3 — Recherche web : concurrents combinant site + contenu social

### Résultat de la recherche : la combinaison est rare, pas absente

**Outils identifiés combinant site web + génération de contenu social :**

| Outil | Prix | Site web | Contenu social | Spécialisation coach |
|---|---|---|---|---|
| **Durable** | 12-22 $/mois | ✅ IA, génération rapide | ✅ (suite marketing : posts génériques, Google Ads) | ❌ généraliste PME |
| **B12** | ~42-169 $/mois | ✅ + services agence | ✅ basique | ❌ généraliste freelance |
| **Jasper + Framer** | ~59 $ + 30 $ = ~90 $/mois | ✅ (Framer) | ✅ (Jasper, templates LinkedIn/IG) | ❌ outils séparés, non intégrés |
| **SocialBee** | 29-99 $/mois | ❌ | ✅ (IA captions, DALL-E images, scheduling) | ❌ généraliste |
| **Canva Pro** | 15 $/mois | ❌ (landing pages, pas de sous-domaine) | ✅ (visuels + texte) | ❌ généraliste |

**Ce qu'aucun concurrent identifié ne fait :**
- Générer 12 posts/mois **calibrés sur la spécialité du coach** (Hyrox, yoga, running, etc.)
- Analyser le profil Instagram du coach pour **imiter sa voix** dans les posts
- Combiner cela avec un **site vitrine éditable en langage naturel** sous un sous-domaine hébergé
- Tout en conservant la **personnalisation par spécialité** (accent couleur, ton, contenu de niche)

**Durable est le concurrent le plus proche.** À 22$/mois il inclut site + suite marketing + posts génériques. Mais :
- Ses posts sont des templates génériques, pas calibrés sur la spécialité/voix du professionnel
- Pas d'analyse Instagram/LinkedIn
- Pas de notion de 8 IG + 4 LI avec catégories (motivation, coulisses, CTA, expertise)
- Pas de portail réservations public intégré

> **Signal de différenciation confirmé :** aucun outil n'adresse exactement la combinaison "personnalisation profonde sur niche coach + site IA + contenu social en volume" dans une offre unifiée. Ce n'est pas un manque de recherche — c'est une niche réelle non couverte par les outils généralistes.

---

## Étape 4 — Scénarios de grille tarifaire

> Ces scénarios sont des options à comparer, pas une recommandation tranchée.

---

### Scénario 1 — Maintien des prix actuels (statu quo)

| Plan | Prix mensuel | Prix annuel (-20%) |
|---|---|---|
| Découverte | 0 € | — |
| Coach | 39 € | ~31 €/mois |
| Coach+Site | 79 € | ~63 €/mois |

**Impact marge :** inchangé (~96-97% brute variable).

**Positionnement :** milieu de gamme. En dessous de Jasper Pro (59$/mois) et Copy.ai (49$/mois pour contenu seul), comparable à SocialBee haut (99$/mois pour du scheduling sans personnalisation profonde).

**Risques :**
- À 39€, le plan Coach est **pas cher** par rapport à la valeur délivrée (12 posts personnalisés valent en temps de rédaction 3-5h/mois d'une personne à 20€/h = 60-100€ de valeur perçue). Un prix bas peut signaler "produit cheap" plutôt qu'accessible dans le marché coaching premium.
- À 79€, le pack_complet commence à peser lourd pour un coach débutant sans clients — conversion vers ce plan probablement faible sans données d'usage réel.
- Les deux plans ont les **mêmes quotas de posts** : difficulté à justifier l'upgrade autrement que par le site.

---

### Scénario 2 — Légère hausse et différentiel de volume

| Plan | Prix mensuel | Prix annuel (-20%) | Δ vs actuel |
|---|---|---|---|
| Découverte | 0 € | — | = |
| Coach | **49 €** | ~39 €/mois | +10 € (+26%) |
| Coach+Site | **97 €** | ~78 €/mois | +18 € (+23%) |

**Changement technique associé (optionnel) :** ajouter un différentiel de quota entre les plans (ex : Coach+Site → 20 posts/mois ou légendes illimitées incluses) pour renforcer la justification du prix.

**Impact marge :**
- Coach à 49€ : marge ~€47,6 / 97,1% (vs 37,6 / 96,5% actuellement)
- Coach+Site à 97€ : marge ~€95 / 97,9%

**Positionnement :** haut de gamme accessible. À 49€, AuraPost est au-dessus de SocialBee entrée (29$) mais en dessous de Jasper Pro (59$) et nettement sous les offres agence. Cohérent avec une différenciation qualitative (personnalisation profonde) plutôt que volumétrique.

**Risques :**
- +26% sur le plan d'entrée = risque de conversion réduite en early stage sans base de clients pour valider la valeur perçue.
- 97€/mois pour Coach+Site : au-dessus du prix psychologique de 79€ — peut réduire la conversion sur le plan flagship.
- À tester sur une page pricing A/B avant de déployer globalement.

---

### Scénario 3 — Ajout d'un palier intermédiaire "Coach Pro"

| Plan | Prix mensuel | Prix annuel (-20%) | Δ vs actuel |
|---|---|---|---|
| Découverte | 0 € | — | = |
| Coach | 39 € | ~31 €/mois | = |
| **Coach Pro** | **59 €** | ~47 €/mois | **nouveau** |
| Coach+Site | 79 € | ~63 €/mois | = |

**Différenciation proposée pour Coach Pro :**
- Tout le plan Coach (12 posts, export, analyse profil)
- + Pack de 30 légendes stories inclus chaque mois (actuellement optionnel)
- + Calendrier éditorial avancé
- OU + posts LinkedIn premium (contenu long-form en plus des 4 standards)

**Impact marge :** Coach Pro à 59€ → marge ~€57,6 / 97,6% (coût AI légèrement supérieur pour les légendes ~$0,025/mois de plus).

**Positionnement :** la grille à 3 paliers couvre le spectre débutant (39€) → intermédiaire (59€) → site inclus (79€). Évite le saut perçu de 40€ en une seule étape.

**Risques :**
- 3 plans payants = complexité de communication. La règle des 3 plans est une heuristique marketing connue (starter, pro, flagship) mais nécessite de bien différencier chaque palier.
- Si la différenciation du plan Coach Pro n'est pas claire (légendes perçues comme "pas grand chose"), le plan du milieu ne convertit pas — on se retrouve avec le problème que ce scénario était censé résoudre.
- Décision produit requise : qu'est-ce que "Coach Pro" apporte vraiment ? Sans réponse claire, ce scénario reste théorique.

---

## Synthèse des scénarios

| Critère | Scénario 1 (statu quo) | Scénario 2 (hausse ~23%) | Scénario 3 (palier intermédiaire) |
|---|---|---|---|
| Risque conversion | Faible | Moyen-élevé | Faible-moyen |
| Marge améliorée | Non | Oui (+20-25% par utilisateur) | Légèrement (+nouveau MRR) |
| Complexité produit | Faible | Faible | Moyenne |
| Faisable sans données d'usage | Oui | Non (risqué) | Partiellement |
| Signal "premium" | Moyen | Élevé | Élevé (via plan Pro) |
| Recommandé si | Pas encore de données réelles | 50+ utilisateurs actifs payants | Besoin de granularité dès maintenant |

---

## Appendice — Constantes tarifaires dans le code

> Pour référence, toutes les valeurs à modifier dans le code si un scénario est retenu.

| Valeur | Fichier | Ligne approx. |
|---|---|---|
| Prix content_only : `3900` (centimes) | `lib/plans.ts` | 37 |
| Prix pack_complet : `7900` (centimes) | `lib/plans.ts` | 47 |
| Remise annuelle : `ANNUAL_DISCOUNT = 0.2` | `lib/plans.ts` | 14 |
| Teams Starter : `49000` | `lib/plans.ts` | 85 |
| Teams Growth : `190000` | `lib/plans.ts` | 86 |
| Posts/mois starter : `4` | `lib/plans.ts` | 115 |
| Posts/mois payant : `12` | `lib/plans.ts` | 116-117 |
| Variantes/mois payant : `999` | `lib/plans.ts` | 116-117 |
| Photos max starter : `1`, payant : `10` | `lib/plans.ts` | 115-117 |
| Rate limit édition IA : `20` / heure | `app/dashboard/website/actions.ts` | 160 |
