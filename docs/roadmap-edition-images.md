# Roadmap Édition d'Images par IA — AuraPost
> Chantier XL · Document de cadrage technique · Créé le 2026-06-26 · Aucun code produit à ce stade

---

## ⚠️ Questions produit à trancher avant de démarrer

Ces questions sont listées en fin de document (§6) avec les options pour chacune. L'implémentation ne peut pas démarrer sans réponse aux questions marquées **[BLOQUANTE]**.

---

## 1. Audit des APIs d'édition d'image disponibles

### Contexte : Anthropic ne fait pas d'édition d'image

L'API Anthropic offre uniquement de la **vision** (analyse d'image en entrée). Elle ne supporte pas la modification ou la génération d'images. Ce choix est délibéré — Anthropic a publiquement écarté l'édition d'image pour limiter les risques deepfake. Il n'existe pas d'alternative via MCP ou intégration officielle Anthropic pour ce besoin.

**Conséquence** : une API tierce est obligatoire pour ce chantier.

---

### Comparatif des APIs pertinentes (état juin 2026)

| API | Préservation visage | Prix indicatif | Latence | Notes |
|-----|--------------------|--------------:|---------|-------|
| **OpenAI GPT Image 1.5** | ✅ Mode "high input fidelity" explicite | $0.005–$0.21/img | 5–15 s | Successeur de DALL-E (shutdowns mai 2026). Support masque inpainting. |
| **FLUX.1 Kontext [pro]** (fal.ai) | ✅ "Character consistency" documentée | $0.04/img | 3–8 s | Spécialisé édition photo réelle. Meilleure cohérence visage selon benchmarks. |
| **Google Vertex AI Imagen 3** | ⚠️ Pas de garantie explicite | $0.02/img | 5–12 s | Moins cher mais identité non garantie. |
| **Stability AI** | ⚠️ Standard inpainting non garanti | $0.05/img | 3–10 s | Pas de mode identité. Résultats variables sur visages réels. |
| **Replicate (modèles divers)** | Variable | $0.001–0.003/s GPU | Variable | 50+ modèles. Impossible de garantir la cohérence visage sans test par modèle. |

### Recommandation

**Candidats retenus pour la décision finale : GPT Image 1.5 ou FLUX.1 Kontext.**

Les deux sont les seuls à offrir une **garantie explicite de préservation d'identité** sur des photos réelles (pas des personae synthétiques). Les autres APIs utilisent des techniques d'inpainting génériques qui peuvent altérer les traits du visage, ce qui est incompatible avec l'usage "photo du coach".

**Avantage GPT Image 1.5** : support masque (inpainting précis sur fond uniquement), intégration OpenAI SDK mature, pricing dynamique adapté à la résolution réelle.

**Avantage FLUX.1 Kontext** : prix fixe ($0.04 flat), latence légèrement meilleure, conçu spécifiquement pour l'édition de personnages réels dans des contextes/fonds différents — correspond exactement au cas d'usage "changer le fond sans toucher au visage".

La question de choix final est listée en §6 — Q1.

---

## 2. Architecture technique proposée

### 2.1 Intégration dans le système d'upload existant

Le système d'upload actuel (`lib/upload.ts`, `lib/r2.ts`, `lib/db/photos.ts`) impose un pipeline strict :
- Validation magic bytes → `sharp` resize (max 1200 px, JPEG 85 %) → upload R2 → insertion `coachPhotos`
- Table `coachPhotos` : `id`, `tenantId`, `r2Key`, `r2Url`, `width`, `height`, `sizeBytes`
- Les photos éditées par IA doivent **ne pas écraser** la photo originale (réversibilité, audit)

**Proposition** : nouvelle table `editedPhotos` avec référence à la photo source.

```
editedPhotos
  id            text PK
  tenantId      text FK → tenants
  sourcePhotoId text FK → coachPhotos   -- photo originale
  r2Key         text                    -- nouvelle clé R2 (fichier distinct)
  r2Url         text
  prompt        text                    -- description de la modification
  model         text                    -- ex: "gpt-image-1.5" | "flux-kontext-pro"
  status        enum pending|done|failed
  errorMessage  text nullable
  createdAt     timestamp
```

Le stockage R2 utilise un sous-dossier dédié : `coaches/{tenantId}/edited/{timestamp}-{sourceId}.jpg`.

Les images éditées passent par le même pipeline `sharp` de recompression avant stockage (cohérence + sécurité).

---

### 2.2 Mode manuel

**Parcours UX proposé :**

1. Le coach est sur la page Posts ou la page Photos de son dashboard
2. Il sélectionne une photo existante (galerie `coachPhotos`, déjà affichée dans l'interface)
3. Il saisit une description en texte libre : `"Remplace le fond par un bureau moderne lumineux"`, `"Style photo lifestyle extérieur, parc ensoleillé"`
4. Clic "Modifier avec l'IA" → appel `POST /api/photos/edit` avec `{ photoId, prompt }`
5. L'API récupère l'image source depuis R2 (signed URL ou buffer), appelle l'API d'édition, stocke le résultat dans R2, insère dans `editedPhotos`
6. **Prévisualisation obligatoire** : l'image modifiée est affichée côte à côte avec l'originale, avec deux actions : "Valider" (l'image devient disponible pour les posts) ou "Refaire" (nouveau prompt ou relance)
7. Validation → l'image éditée apparaît dans la galerie avec un badge "Modifiée par IA" (obligation légale, voir §4.1)

**Point d'attention latence** : 5–15 secondes de traitement API → afficher un état de chargement explicite. Si appel depuis le front, le timeout Netlify (26 s) est limite — envisager un polling court ou un job léger plutôt qu'un appel direct bloquant.

**Recommandation** : appel direct (pas de job) pour le mode manuel, avec un timeout front de 30 s et un message d'erreur clair si l'API image dépasse ce délai. La latence est acceptable pour un usage interactif one-shot.

---

### 2.3 Mode automatique (intégré à la génération de posts)

**Contrainte critique** : le job de génération de texte tourne déjà à la limite des timeouts serverless (26 s configurés, job async via `after()` déjà mis en place pour résoudre ce problème — voir `app/api/generate/route.ts`). Ajouter 5–15 secondes × N photos dans ce job **recrée exactement le problème que l'async a résolu**.

**Architecture recommandée : job image séparé, déclenché en cascade.**

```
Job texte (existant)
  → generateMonthlyContent() → 12 posts insérés → status: done
  → [NOUVEAU] si plan autorise l'édition image : créer imageEditJob (status: pending)

Job image (nouveau)
  → sélectionner photo source (voir ci-dessous)
  → pour chaque post : générer un prompt d'édition adapté au contenu du post
  → appeler API image → stocker résultat → lier à postPhotos
  → status: done → notification coach
```

**Sélection automatique de la photo source :**

Le job image doit choisir parmi les photos disponibles dans `coachPhotos` pour le tenant. Deux approches :
- **Option A** : sélection par Claude — passer les métadonnées des photos disponibles (dimensions, noms de fichiers si descriptifs) + le contenu du post dans un prompt Claude court → Claude suggère quelle photo utiliser et quel prompt d'édition appliquer. Coût : ~200 tokens/post soit ~€0.001 additionnel.
- **Option B** : règle déterministe simple — choisir la photo la plus récente du coach, appliquer un prompt d'édition générique basé sur le type de post (motivation → fond lumineux extérieur, éducatif → fond bureau épuré, etc.).

Option A est plus pertinente mais ajoute un appel LLM. Option B est plus robuste et prévisible pour une v1.

**Gestion d'échec :**

Le job image est **entièrement découplé de la livraison du texte** — si l'édition image échoue, les posts texte sont déjà disponibles et le coach n'est pas bloqué. L'échec image est loggé dans `imageEditJob.errorMessage` et une notification distincte informe le coach ("Vos images n'ont pas pu être générées — vous pouvez les créer manuellement").

**Table `imageEditJobs` :**

```
id, tenantId, postId (nullable, si lié à un post spécifique), status, model, prompt, errorMessage, createdAt, completedAt
```

---

### 2.4 Latence et impact sur les jobs existants

| Scénario | Temps additionnel | Risque timeout | Verdict |
|----------|------------------|---------------|---------|
| Mode manuel, appel direct | +5–15 s (une image) | Faible (interactif) | OK — appel direct acceptable |
| Mode auto, dans le job texte | +60–180 s (12 posts × 5 s) | Élevé — dépasse 26 s | ❌ À proscrire |
| Mode auto, job séparé | 0 s sur job texte | Nul | ✅ Recommandé |

---

## 3. Impact sur les plans et quotas

### Situation actuelle

`lib/plans.ts` indique que **`pack_complet` (€79/mo) inclut déjà "AI editing"** dans ses fonctionnalités listées. Cette fonctionnalité est donc déjà **promise** aux utilisateurs de ce plan.

`content_only` (€39/mo) ne mentionne pas l'édition image.

### Coût réel par image

Sur la base des deux candidats retenus :
- GPT Image 1.5 (cas moyen, résolution standard) : ~$0.05/img = ~€0.046/img
- FLUX.1 Kontext : $0.04/img fixe = ~€0.037/img

### Proposition de quotas

| Plan | Quota édition image/mois | Coût max côté AuraPost | % du revenu plan |
|------|-------------------------|-----------------------|-----------------|
| `starter` (€0) | 0 — non disponible | €0 | — |
| `content_only` (€39) | 5 images/mois | ~€0.23 | ~0.6 % |
| `pack_complet` (€79) | 20 images/mois | ~€0.92 | ~1.2 % |

Ces coûts sont marginaux (< 2 % du revenu plan), et bien en dessous de la marge brute actuelle estimée à 96.5–97.8 % (source : `docs/pricing-audit.md`).

**Recommandation v1** : réserver l'édition image à `pack_complet` uniquement (déjà promis dans ce plan). Étendre à `content_only` avec un quota réduit (5/mois) lors d'une itération ultérieure, après validation terrain de la qualité des résultats.

La question de disponibilité pour `content_only` est listée en §6 — Q3.

---

## 4. Risques et points d'attention

### 4.1 Obligation légale — Mention "Images virtuelles" (EU AI Act + loi française)

**Situation réglementaire (juin 2026) :**

- **EU AI Act Article 50** : en vigueur au 2 août 2026. Toute image générée ou **significativement modifiée par IA** utilisée dans un contexte commercial/publicitaire doit porter une **mention visible** de type "Image virtuelle" ou équivalent. S'applique à tous les canaux de distribution.
- **Loi française du 9 juin 2023** (influenceurs) : déjà en vigueur — mention "images virtuelles" requise pour tout contenu retouché par IA publié par un influenceur à des fins commerciales.
- **Décret du 4 mai 2017** : "photographie retouchée" requis si l'apparence corporelle d'un modèle est altérée dans une image publicitaire.

**Application au cas AuraPost :**

Un coach qui publie un post Instagram/LinkedIn commercial avec une photo dont le fond a été modifié par IA **est potentiellement soumis à ces obligations**. AuraPost ne peut pas contrôler ce que le coach publie, mais peut être en responsabilité partagée si la plateforme facilite la publication sans avoir proposé l'outil de conformité.

**Proposition d'implémentation (non-bloquante, mais requise avant mise en prod) :**

1. **Badge "Modifié par IA"** dans l'interface AuraPost sur toute image issue de `editedPhotos` — visible dans la galerie et dans l'éditeur de post. Ce badge est interne (pas exporté sur l'image).
2. **Suggestion de mention automatique** dans le texte du post : lors de l'association d'une image éditée à un post, proposer d'ajouter `[Image modifiée par IA]` en fin de caption (le coach peut supprimer, mais la suggestion remplit l'obligation d'information de la plateforme).
3. **Pas de watermark gravé sur l'image** — la photo originale appartient au coach, la mention légale relève de sa responsabilité éditoriale, pas d'AuraPost.

Aucune obligation de faire appel à un juriste pour ce point spécifique (la loi est claire), mais la CGV d'AuraPost devrait mentionner la responsabilité du coach sur la publication de contenus IA.

---

### 4.2 Qualité et mécanisme de validation avant publication

Les modèles d'édition peuvent produire des résultats de mauvaise qualité : déformation légère du visage, artefacts sur les bords, incohérence lumière/ombre. Ce risque est plus élevé en mode automatique (prompt généré sans contrôle humain).

**Règles pour la v1 :**

- **Mode manuel** : prévisualisation **obligatoire** avant que l'image soit disponible. Bouton "Valider" / "Refaire" / "Annuler". Maximum 3 tentatives par crédits-image pour éviter les abus.
- **Mode automatique** : les images générées sont dans un statut **"En attente de validation"** — elles ne sont pas automatiquement attachées au post. Une notification invite le coach à les valider depuis le dashboard. Le post texte reste publié/disponible indépendamment.
- **Pas de publication automatique sans validation humaine en v1** — à assouplir en v2 si le taux de satisfaction terrain est bon.

---

### 4.3 Modération de contenu

**Mode manuel (texte libre du coach) :** risque de prompt inapproprié (contenu sexuel, mise en scène violente, etc.).

- **GPT Image 1.5** : modération de contenu intégrée côté OpenAI — les prompts ou images résultantes contraires aux guidelines retournent une erreur API. AuraPost n'a pas à réimplémenter une modération.
- **FLUX.1 Kontext (fal.ai)** : politique de contenu de fal.ai en place, mais moins stricte qu'OpenAI. Peut nécessiter un filtre de prompt côté AuraPost (liste de mots bloqués ou appel Claude pour valider le prompt avant envoi).

**Recommandation** : si FLUX.1 Kontext est retenu, ajouter une passe de modération via Claude (`claude-haiku-4-5` pour le coût) sur le prompt du coach avant d'appeler l'API image. Coût ~€0.001/appel — négligeable. Si OpenAI GPT Image 1.5 est retenu, s'appuyer sur la modération native.

---

## 5. Phasage proposé

> Chaque phase est indépendante et livrable séparément. Les phases I-0 et I-1 sont des prérequis pour toutes les suivantes.

### Phase I-0 — Décisions produit *(hors code, ~1 jour)*
Répondre aux questions §6 avant tout démarrage. En particulier Q1 (modèle API) et Q2 (disponibilité par plan) bloquent l'architecture concrète.

---

### Phase I-1 — Infrastructure de base *(S — ~4h)*
- Migration DB : table `editedPhotos` (voir §2.1), table `imageEditJobs`
- Lib `lib/image-editor.ts` : wrapper autour de l'API retenue (appel, polling si async, retry x3)
- Endpoint `POST /api/photos/edit` : validation plan, quota, appel lib, stockage R2, insertion DB
- Ajout `editedImagesMax` dans `lib/plans.ts` (0 pour starter et content_only en v1, 20 pour pack_complet)

---

### Phase I-2 — Mode manuel *(M — ~1 jour)*
- UI : bouton "Modifier avec l'IA" sur la galerie de photos (`app/dashboard/photos` ou composant existant)
- Sélecteur de photo + champ prompt + indicateur de crédits restants
- Composant prévisualisation côte-à-côte (original / modifié) avec actions Valider / Refaire / Annuler
- Badge "Modifié par IA" dans la galerie pour les images issues de `editedPhotos`
- Suggestion de mention légale dans l'éditeur de post si image éditée attachée

---

### Phase I-3 — Mode automatique *(M — ~1 jour)*
- Job `imageEditJob` : création en cascade après fin du job texte (`lib/generation-jobs.ts`)
- Logique de sélection photo (v1 : option B déterministe, voir §2.3)
- Prompt d'édition auto basé sur le type de post (table de correspondance `postType → editPrompt`)
- Notification coach : "Vos images sont prêtes — validez avant publication"
- Gestion d'échec sans impact sur les posts texte
- Réconciliation via le cron existant (`/api/cron/reconcile-jobs`)

---

### Phase I-4 — Quotas, gating et conformité *(S — ~2h)*
- Vérification quota dans l'endpoint `/api/photos/edit` (comptage mensuel depuis `editedPhotos`)
- UI : affichage des crédits restants (ex: "12/20 images ce mois")
- Unlock `content_only` si décision produit Q3 est "oui" — changement dans `lib/plans.ts` uniquement
- Documentation dans CGV : responsabilité du coach sur la publication de contenus IA

---

## 6. Questions produit à trancher

> Ces questions bloquent tout ou partie de l'implémentation. Elles ne peuvent pas être décidées par l'implémentation elle-même.

---

**Q1 — Modèle API à retenir [BLOQUANTE]**

Deux candidats valables pour la préservation de visage fiable :

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **OpenAI GPT Image 1.5** | Support masque inpainting, modération native, SDK mature, pricing variable (moins cher à basse résolution) | Prix potentiellement plus élevé à haute résolution ($0.21 max), dépendance OpenAI |
| **FLUX.1 Kontext [pro]** (fal.ai) | Prix fixe $0.04 prévisible, conçu pour édition de personnages réels, latence légèrement meilleure | Modération moins stricte (nécessite filtre AuraPost), API moins connue, vendor fal.ai plus petit |

Recommandation personnelle si tu veux un avis : **FLUX.1 Kontext** pour la v1 — prix prévisible, cas d'usage plus proche, et le filtre de modération via Claude est trivial à ajouter.

---

**Q2 — Disponibilité par plan [BLOQUANTE]**

`pack_complet` inclut déjà "AI editing" dans ses fonctionnalités — c'est une promesse faite aux utilisateurs actuels.

- **Option A** : `pack_complet` uniquement pour la v1, puis extension à `content_only` (5/mois) en v2
- **Option B** : `content_only` + `pack_complet` dès la v1 (quotas différenciés)
- **Option C** : feature disponible à tous, mais quota 0 pour `starter`

Recommandation : Option A pour réduire la surface de risque en v1 et honorer la promesse `pack_complet` avant d'élargir.

---

**Q3 — Quota mensuel pour `pack_complet` [BLOQUANTE pour I-1]**

Proposition : 20 images/mois. Alternatives : 10 (plus conservateur), 30 (plus généreux).
Le coût côté AuraPost reste < €1/mois à 20 images.

---

**Q4 — Mode automatique : sélection de la photo source**

- **Option A** : Claude choisit (pertinence contextuelle, coût ~€0.001/post)
- **Option B** : règle déterministe (photo la plus récente + prompt basé sur type de post)

Recommandation : Option B pour la v1 (prévisible, zéro risque de choix surprenant).

---

**Q5 — Validation avant publication en mode auto**

- **Option A** : toujours obligatoire (coach valide dans le dashboard avant que l'image soit attachée au post)
- **Option B** : optionnelle (coach peut activer "publication auto sans validation")

Recommandation forte : Option A pour la v1. La qualité des modèles d'édition n'est pas encore assez fiable pour une publication sans contrôle humain. À reconsidérer après 100+ éditions terrain.

---

**Q6 — Mention légale "Images virtuelles" dans les captions**

- **Option A** : suggestion automatique non-obligatoire (ajout en un clic, mais le coach peut supprimer)
- **Option B** : insertion forcée dans le texte du post si image éditée attachée (coach peut modifier manuellement mais pas supprimer via l'UI)
- **Option C** : aucune action côté AuraPost, responsabilité entièrement au coach (mention dans les CGV)

Context légal : l'EU AI Act Art.50 entre en vigueur le 2 août 2026. L'Option C est probablement insuffisante pour un lancement post-août 2026. Option A est un bon équilibre UX/conformité.

---

*Document de cadrage — aucun code produit. Dépendances : aucune des phases ci-dessus ne peut démarrer sans réponse à Q1, Q2, Q3.*
