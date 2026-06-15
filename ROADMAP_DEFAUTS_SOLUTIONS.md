# AuraPost — Défauts → Solutions (roadmap détaillée)

> Issue de l'audit 10-perspectives. **Chaque défaut identifié = une solution concrète.**
> Score audité : **6,3/10**. Objectif de cette roadmap : lever les blocages produit/marché/prix
> qui plafonnent le produit, dans l'ordre où ils créent de la valeur (et du CA).

**Priorités** : `P0` survie / avant tout lancement · `P1` croissance & 1ᵉʳ revenu · `P2` scale · `P3` polish.
**Effort** : `S` <½j · `M` 1-3j · `L` 4-8j · `XL` >2 sem.
**Format** : Problème → Impact → Solution → Effort/Priorité → Critère de succès.

---

## THÈME A — Fermer la boucle produit *(le trou n°1)*

### A1. Publication automatique Instagram & LinkedIn `P0` `XL`
- **Problème** : AuraPost génère mais **ne publie pas** — le coach copie-colle. Export Buffer/Later seulement.
- **Impact** : valeur perçue faible, rétention fragile (« j'ai mes posts → je résilie »), différenciateur nul vs Buffer.
- **Solution** :
  1. Table `social_connections` (`tenantId, platform, accountId, accessToken` **chiffré**, `refreshToken`, `expiresAt`, `scopes`).
  2. **Instagram** : Facebook Login + Instagram Graph API (compte Business/Creator requis) → endpoint `media` + `media_publish`. **Prévoir l'App Review Meta** (2-4 semaines, bloquant — démarrer maintenant).
  3. **LinkedIn** : OAuth + Share/Posts API (compte perso + page).
  4. Réutiliser `generated_posts.scheduledFor` (déjà en base) + cron `/api/cron/publish` (toutes les 15 min) qui poste les dûs, avec retry/backoff (la file `lib/queue.ts` existe) et statut `published_at`/`publish_error`.
  5. Chiffrer les tokens (AES-GCM, clé en env). Révocation propre.
  6. Fallback : garder l'export Buffer/Later pour ceux qui refusent l'OAuth.
- **Critère de succès** : un coach connecte IG, planifie, et le post part seul. Rétention M2 > 60 %.

### A2. Analytics sociaux réels `P1` `L` *(dépend de A1)*
- **Problème** : « Analytics » = taux d'approbation interne, **aucune perf réelle** (reach, engagement).
- **Impact** : le coach ne sait pas si ça marche → pas de raison de rester/payer.
- **Solution** : pull insights via Instagram Graph (`insights`: reach, impressions, saves, profile_visits) + LinkedIn analytics ; snapshots quotidiens en table `post_metrics` ; remplacer `lib/db/analytics.ts` (interne) par un vrai dashboard perf + « ton meilleur post du mois » + reco créneau basée sur données réelles.
- **Critère de succès** : dashboard montre engagement réel ; recommandations data-driven.

### A3. Domaine personnalisé (ou reframe « site loué ») `P2` `L`
- **Problème** : champ domaine perso masqué ; « ton site » est en réalité un sous-domaine **loué**.
- **Impact** : sentiment de non-propriété, frein pour le coach pro.
- **Solution** : câbler `websites.customDomain` (déjà en schéma) + vérification DNS (TXT) + provisioning TLS (Netlify domain aliases / Vercel domains API). À défaut, **reformuler honnêtement** l'UI (« ta vitrine AuraPost sur ton-nom.aurapost.fr ») et retirer toute ambiguïté.
- **Critère de succès** : un coach branche `coach-x.fr` OU le wording ne sur-promet plus.

---

## THÈME B — Pricing & positionnement

### B1. Refonte du pricing solo (Scénario hybride) `P0` `M`
- **Problème** : 149 €/209 € **trop cher** pour un coach indé (WTP réelle 19-49 €) → conversion morte.
- **Impact** : tue le funnel en bas ; CAC > LTV.
- **Solution** : `lib/plans.ts` (source unique) →
  - **Découverte 0 €** : 4 posts/mois, sans site (acquisition + preuve sociale).
  - **Coach 39 €** : 12 posts + export.
  - **Coach+Site 79 €** : + site + variantes illimitées + (à terme) publication auto.
  - Gating serveur déjà en place (`getPlanLimits`) → ajuster les limites + ajouter le tier free.
- **Critère de succès** : conversion visiteur→payant ≥ 3-5 % ; ARPU solo ~55 €.

### B2. Pricing réseau par siège + pilote obligatoire `P1` `L`
- **Problème** : Enterprise « sur devis » flou ; pas de facturation par siège ; risque de vendre 500 sièges dormants.
- **Solution** : Stripe **quantity-based subscription** (quantité = nb distributeurs actifs), planchers (`Teams Starter ~490 €/≤50`, `Growth ~1 900 €/≤200`), et **pilote payant 50 sièges** systématique avant tout déploiement. Facturer l'**actif** (siège connecté ≥1×), pas le siège créé.
- **Critère de succès** : 1 contrat réseau signé sur base sièges actifs.

---

## THÈME C — Preuve & traction *(rien n'existe aujourd'hui)*

### C1. Valider la qualité de contenu réelle `P0` `M`
- **Problème** : tout repose sur Claude ; le mock par templates est répétitif ; **qualité non prouvée**.
- **Impact** : si le contenu « sent l'IA », rien d'autre ne compte.
- **Solution** : configurer `ANTHROPIC_API_KEY` ; générer pour **10 profils réels** ; évaluation humaine (grille : naturel, spécificité, voix) ; itérer le prompt (`buildPrompt`) ; **few-shot des vrais posts du coach** + bannir les clichés (« la régularité bat l'intensité »…) ; bouton « régénérer avec feedback ».
- **Critère de succès** : ≥ 8/10 posts jugés publiables sans retouche par de vrais coachs.

### C2. Bêta payant + témoignages réels `P0` `M`
- **Problème** : social proof **vide/fictif** (wall-of-love, compteurs) → crédibilité fragile.
- **Solution** : recruter **10 coachs en bêta payant** (prix réduit) ; collecter témoignages vidéo + 1 étude de cas chiffrée ; remplacer le faux social proof par du réel ; activer `/wall-of-love` avec de vrais avis.
- **Critère de succès** : 10 clients payants, 3 témoignages publiables.

### C3. Premier pilote réseau (référence) `P1` `L`
- **Problème** : pitch Herbalife sans **aucune référence**.
- **Solution** : signer 1 réseau/franchise FR (50 sièges) en pilote ; mesurer l'adoption réelle ; en faire le logo de référence du pitch.
- **Critère de succès** : 1 logo réseau + métriques d'adoption réelles.

---

## THÈME D — Couche réseau / conformité MLM

### D1. Conformité légale (au-delà du filtre de mots) `P1` `L`
- **Problème** : la « conformité » = blacklist de mots **contournable**, pas une validation juridique. Rédhibitoire pour Herbalife (secteur surveillé : allégations santé/revenus).
- **Solution** :
  1. **File de validation** : option « les posts des distributeurs passent en revue par le manager avant publication ».
  2. Détection IA des allégations (pas juste mots-clés) + injection automatique de **disclaimers** configurables.
  3. **Audit log** immuable de qui a validé quoi (preuve de conformité).
  4. Règles configurables par marque + export du registre de conformité.
- **Critère de succès** : un responsable marque valide le dispositif sans alerte juridique.

### D2. Adoption des distributeurs `P1` `M`
- **Problème** : 80 % des distributeurs ne se connecteront jamais → réseau paie pour des comptes morts.
- **Solution** : **1ᵉʳ mois auto-généré** dès l'import (le distributeur arrive sur du contenu prêt) ; relances magic-link (J+1/J+3/J+7) ; notification au manager des inactifs (déjà le pattern `listInactiveCoaches`) ; gamification légère (streak existe) ; publication auto (A1) = la clé d'usage.
- **Critère de succès** : ≥ 40 % de distributeurs actifs/semaine sur le pilote.

### D3. Délégation agence + rôles `P2` `M`
- **Problème** : `users.role='member'` inutilisé ; pas de vraie délégation (agence agit « au nom de »).
- **Solution** : `/dashboard/team` (invite intra-tenant, rôles owner/admin/member appliqués côté serveur) + bascule de contexte agence→client (s'appuie sur la couche org déjà livrée).
- **Critère de succès** : une agence gère 5 clients depuis un seul compte.

### D4. Marque blanche & SLA `P3` `XL`
- **Problème** : Enterprise demande marque blanche, intégrations, SLA — absents.
- **Solution** : sous-domaine/logo agence sur le produit, API publique (Zapier/Make), SLA contractuel. (Roadmap v1.5.)

---

## THÈME E — Rétention & Growth

### E1. Canaux d'acquisition explicites `P1` `M`
- **Problème** : le produit suppose un trafic qu'il n'a pas ; aucune stratégie d'acquisition.
- **Solution** : (a) **SEO programmatique** : pages « coach {niche} {ville} » + le blog existant ; (b) **partenariats** (fédérations, salles, certifs coach) ; (c) **activer le parrainage** (déjà en base) avec incitatif ; (d) 1 test paid (Meta/LinkedIn) mesuré sur le pilote.
- **Critère de succès** : ≥ 1 canal avec CAC < 1 mois d'ARPU.

### E2. Hooks de rétention `P2` `M`
- **Problème** : valeur chute après 1-2 mois.
- **Solution** : publication auto (A1) + analytics (A2) = les vrais hooks ; + récap mensuel « ton meilleur post », rappels calendrier, e-mails de valeur. La rétention se gagne en **fermant la boucle**, pas en ajoutant des badges.
- **Critère de succès** : churn mensuel < 7 %.

### E3. Funnel & landing crédibles `P1` `S`
- **Problème** : mur des 149 € + social proof vide.
- **Solution** : B1 (prix) + C2 (preuve) + free tier en haut de funnel ; CTA cohérents (cf. F3).
- **Critère de succès** : conversion démo→inscription en hausse mesurée.

---

## THÈME F — UX / Design

### F1. Onboarding plus court & « skip-friendly » `P2` `M`
- **Problème** : onboarding long ; 3 façons d'éditer le site (confusion).
- **Solution** : réduire à l'essentiel (nom + spécialité → génération immédiate, le reste en optionnel post-génération) ; **consolider les 3 éditeurs** en un seul avec onglets (Formulaire / IA / Aperçu) — `preview` déjà redirigé.
- **Critère de succès** : time-to-first-post < 3 min ; un seul point d'entrée d'édition.

### F2. Doser les animations `P3` `S`
- **Problème** : landing **sur-animée** (particles, spotlight, beams…) → « template premium », perf.
- **Solution** : réduire/cibler les effets, respecter `prefers-reduced-motion`, mesurer LCP/CLS.

### F3. Ton B2B vs B2C `P3` `S`
- **Problème** : emojis dans les CTA (🔥), incohérent pour le pitch agence.
- **Solution** : CTA sobres côté B2B (`/agency-*`, `/pitch`) ; garder le ton chaleureux côté coach.

### F4. Nettoyer les « Bientôt » & placeholders `P2` `S`
- **Problème** : pages/états « Bientôt », mockups PNG statiques, placeholders visibles hors seed.
- **Solution** : masquer ou router vers `/changelog` ; états vides soignés (déjà fait pour /coaches partiellement) ; vérifier que la démo est toujours seedée.

---

## THÈME G — Sécurité & RGPD

### G1. RGPD : sous-traitance & base légale `P1` `M`
- **Problème** : pas de DPA listés (Anthropic/Resend/Turso = transfert hors UE), pas de registre de traitement, **base légale floue** pour les comptes distributeurs créés sans consentement explicite (import MLM).
- **Solution** : page « sous-traitants » + DPA signés ; registre de traitement ; mention d'hébergement ; pour l'import distributeurs : base légale = intérêt légitime du réseau + **opt-out clair dès le 1ᵉʳ email** + double opt-in possible.
- **Critère de succès** : conforme à une revue DPO légère.

### G2. CSP sans `unsafe-inline` `P2` `M`
- **Problème** : `script-src 'unsafe-inline'` affaiblit l'anti-XSS.
- **Solution** : nonces par requête dans `proxy.ts` propagés au runtime Next ; tester que styles/effets passent. (Risqué → derrière feature flag.)

### G3. Durcir `/api/gdpr/delete` `P2` `S`
- **Problème** : route destructive hors gating middleware (repose sur le handler).
- **Solution** : ajouter au préfixe protégé du proxy **et** ré-authentification (mot de passe / OTP) avant suppression définitive.

### G4. Rate-limit & secrets prod `P2` `S`
- **Problème** : rate-limit IP du proxy in-memory par lambda ; risque de fallbacks mock en prod.
- **Solution** : forcer Upstash pour le rate-limit edge (ou accepter + documenter) ; `scripts/deploy-check.ts` **bloquant** sur clés critiques (Turso déjà gardé) ; alerte si un mock est actif en prod.

### G5. Chiffrer les tokens sociaux `P1` `S` *(avec A1)*
- **Solution** : AES-GCM sur `social_connections.accessToken/refreshToken`, clé en env, jamais en clair en base.

---

## THÈME H — Dette technique & qualité

### H1. Schéma : source unique `P2` `M`
- **Problème** : `bootstrap-schema.ts` recopié à la main de `schema.ts` → **dérive** (déjà causé un crash `payment_failed_at`).
- **Solution** : générer le bootstrap depuis le schéma Drizzle (script `db:bootstrap`), **ou** faire tourner les tests sur les migrations réelles appliquées à un libsql `:memory:`. Supprimer la double maintenance.
- **Critère de succès** : impossible d'ajouter une colonne sans qu'elle existe partout.

### H2. Tests couche org + E2E en CI `P2` `M`
- **Problème** : couche org/agence **0 test** ; pas d'E2E en CI.
- **Solution** : jest sur `organizations`/`org-invite`/import/reporting (isolation, idempotence) ; Playwright (déjà présent) branché en **GitHub Actions** sur le parcours clé.
- **Critère de succès** : couverture des chemins critiques ; CI rouge si régression.

### H3. Génération en jobs asynchrones + streaming `P2` `L`
- **Problème** : appel unique 20-40 s, timeout 26 s fragile, pas d'effet « temps réel ».
- **Solution** : job de génération (statut `pending/running/done` en base) + endpoint SSE/poll ; l'UI révèle les posts au fur et à mesure (le « wow » demandé). Supprime le risque 502 Netlify.
- **Critère de succès** : génération fiable quel que soit le plan d'hébergement + UI progressive.

### H4. Dépendance Anthropic (marge & plateforme) `P3` `M`
- **Problème** : coût + risque mono-fournisseur.
- **Solution** : abstraction provider (déjà 3 chemins : api/tunnel/mock) → ajouter un provider alternatif (fallback), suivre le coût/coach, mettre en cache les composants réutilisables.

### H5. Cohérences doc & nettoyage `P3` `S`
- **Problème** : incohérences résiduelles (ex. upload « 5 Mo » en doc vs 10 Mo en code).
- **Solution** : passe de cohérence docs ↔ code ; supprimer le code mort.

---

## THÈME I — Feature « Analyse & Recommandations de présence » *(lead magnet + activation)*

> Analyse le profil Instagram/LinkedIn du coach et délivre des recommandations concrètes
> (score + réécriture bio + hashtags + créneaux + action prioritaire). **Double valeur** :
> (1) hook d'acquisition gratuit en haut de funnel ; (2) activation/rétention.
> Distincte de **A2** (perf des posts publiés) ; **réutilise** `lib/instagram.ts`
> (`scrapeInstagram`, `analyzeInstagram`, `isInstagramUrl`) déjà en place.

**Priorité globale : `P1` · Effort global : `L`** (backend `M` grâce au scraping existant, UI `L`).
**Dépendances** : `ANTHROPIC_API_KEY` (mock propre sinon) ; scraping IG existant.
**Risques** : scraping Instagram fragile (déjà mitigé par saisie manuelle) ; **LinkedIn = saisie manuelle** (le scraping viole les CGU) → pas d'URL auto, le coach colle titre+résumé+posts.

### I1. Backend analyse Instagram — `lib/analyze/instagram.ts` `M`
- Étape 1 scraping (réutilise `scrapeInstagram`) : bio, abonnés, nb publications, fréquence (dates des 6 derniers posts), 6 dernières légendes, hashtags, longueur moyenne. Fallback compte privé : message « colle tes 3 dernières légendes » + chemin manuel.
- Étape 2 Claude (prompt fourni) → JSON validé par **schéma zod** (score_global, scores_detail 8 critères, points_forts, problemes[{titre,description,impact,correction}], bio_actuelle/proposee, hashtags_actuels/proposes, meilleur_post/pourquoi, post_a_ameliorer/comment, creneaux_recommandes, prochaine_action). **Mock déterministe** si pas de clé (réutilise le pattern `lib/reviews.ts`).

### I2. Backend analyse LinkedIn — `lib/analyze/linkedin.ts` `M`
- Saisie manuelle (titre, résumé, exemples de posts) → Claude → JSON (titre/resume actuel+proposé, scores_detail 6 critères, points_forts, problemes, prochaine_action). Mock propre.

### I3. Persistance & historique `S`
- Table `profile_analyses` (`id, tenant_id, platform, profile_url, score_global, analysis_json, created_at`) → **schema.ts + bootstrap-schema.ts + migration** (cf. dette H1 : garder les 2 en phase).
- Conserver les **3 dernières** analyses par plateforme. `coach_profiles.last_recommendation` (action prioritaire en cours, + colonne migration).

### I4. Routes API `M`
- `POST /api/analyze/instagram` (scrape → Claude → stocke → JSON), `POST /api/analyze/linkedin`, `GET /api/analyze/history` (3 dernières/plateforme).
- **Rate-limit 3/jour/tenant** (`checkAuthRateLimit`), `maxDuration = 45`, CSRF (`csrfGuard`), `auth()`+`requireTenantId()`. Mock propre sans clé.

### I5. Page `/dashboard/analyze` `L`
- Deux sections Instagram | LinkedIn (URL/champ + bouton « Analyser »). Résultats sous chaque section :
  - **Score circulaire** central (rouge <50, orange 50-70, vert >70) + libellé faible/moyen/solide/excellent.
  - **Grille de scores détaillés** (mini-cards + barre de progression + icône par critère).
  - **« Ce qui marche »** (3 points forts, check vert).
  - **« Ce qu'il faut corriger »** (problèmes triés par impact, badge rouge/orange/jaune, box bleue « Comment corriger »).
  - **Réécriture bio/titre** (actuelle grisée vs proposée mise en avant) + bouton **Copier** (clipboard) + bouton **Appliquer à mon profil AuraPost** (→ met à jour `coach_profiles.bio`).
  - **Hashtags** (actuels barrés si faibles, proposés en violet + explication) + Copier.
  - **Analyse des posts** (meilleur = vert + pourquoi ; à améliorer = orange + réécriture).
  - **Créneaux optimaux** (3 créneaux selon la niche, mini-calendrier).
  - **Priorité du moment** (1 action en grand + bouton « Marquer comme fait » → `last_recommendation`).

### I6. Intégration dashboard `S`
- Carte « Analyse de profil » avec score actuel (ou CTA « Analysez votre profil → »).
- **Badge score dans la sidebar** (« Instagram 72/100 »).
- Nudge si analyse > 30 jours (« relancez une analyse »).

### I7. Analyse auto à l'onboarding `S`
- Si URL Instagram fournie : lancer l'analyse **en arrière-plan** (`after()`), afficher au 1ᵉʳ login, **email** « Voici l'analyse de votre profil — 3 choses à améliorer cette semaine ».

### I8. Évolution `S`
- « Voir l'évolution » → graphe simple du score dans le temps + message motivant si hausse.

**Critères de succès (acceptance)** :
- `tsc` 0 erreur · **build vert** · tests verts (ajouter un test du parseur/schéma + mock).
- Screenshots dans **`/screenshots/analyze/`** : page principale, résultat Instagram, résultat LinkedIn, carte dashboard.
- Fonctionne **sans clé** (mock) et **avec clé** (Claude réel).

---

## Séquencement recommandé

```
SEMAINE 0  (avant tout)   C1 qualité contenu · B1 prix solo · G4 prod-check · démarrer A1 (App Review Meta)
SEMAINE 1-2 (1er revenu)  C2 bêta payant 10 coachs · E3 funnel · G1 RGPD de base
SPRINT 1-2 (boucle)       A1 publication auto · A2 analytics réels · G5 tokens chiffrés · I « Analyse & Reco » (hook d'activation)
SPRINT 3-4 (réseau)       B2 billing sièges · D1 conformité · D2 adoption · C3 pilote réseau
SPRINT 5-6 (scale)        H1 schéma · H2 tests/CI · H3 jobs async · A3 domaine · E1 acquisition
CONTINU                   F* UX · G2/G3 sécu · D3/D4 agence · E2 rétention · H4/H5 dette
```

## Table de correspondance défaut → solution

| # | Défaut (perspective) | Solution | Prio |
|---|----------------------|----------|------|
| A1 | Pas de publication auto (Coach, Concurrent, Growth) | OAuth IG/LinkedIn + scheduler | P0 |
| A2 | Pas d'analytics réels (Coach, Investisseur) | Insights API + dashboard perf | P1 |
| A3 | Sous-domaine loué / domaine masqué (Coach, UX) | Custom domain ou reframe | P2 |
| B1 | 149 € trop cher (Coach, Pricing, Growth) | Free + 39/79 € | P0 |
| B2 | Pas de billing par siège (Herbalife, Dev) | Stripe quantity + pilote | P1 |
| C1 | Qualité contenu non prouvée/générique (Investisseur, Coach) | Éval réelle + prompt few-shot | P0 |
| C2 | Social proof vide/fictif (Growth, Investisseur) | Bêta payant + témoignages | P0 |
| C3 | Aucune référence réseau (Herbalife) | Pilote payant 50 sièges | P1 |
| D1 | Conformité = blacklist faible (Herbalife) | File de validation + audit + disclaimers | P1 |
| D2 | Adoption distributeurs (Herbalife) | 1er mois auto + relances + auto-publish | P1 |
| D3 | `role=member` inutilisé / pas de délégation (Dev, Agence) | /dashboard/team + bascule contexte | P2 |
| D4 | Pas de marque blanche/SLA (Herbalife) | White-label + API + SLA | P3 |
| E1 | Canaux d'acquisition flous (Growth) | SEO programmatique + partenariats + parrainage | P1 |
| E2 | Rétention faible (Growth, Founder) | Boucle fermée + récaps/rappels | P2 |
| F1 | Onboarding long + 3 éditeurs (UX) | Onboarding court + éditeur unifié | P2 |
| F2 | Landing sur-animée (UX) | Doser effets + reduced-motion | P3 |
| F3 | Emojis CTA B2B (UX) | Ton sobre côté agence | P3 |
| F4 | « Bientôt »/placeholders (UX) | Masquer + états vides soignés | P2 |
| G1 | RGPD sous-traitance/base légale (Sécurité) | DPA + registre + opt-out distributeurs | P1 |
| G2 | CSP unsafe-inline (Sécurité) | Nonces | P2 |
| G3 | GDPR delete hors gating (Sécurité) | Préfixe protégé + ré-auth | P2 |
| G4 | Rate-limit in-mem / mocks en prod (Sécurité) | Upstash forcé + deploy-check bloquant | P2 |
| G5 | Tokens sociaux en clair (Sécurité, avec A1) | Chiffrement AES-GCM | P1 |
| H1 | bootstrap-schema dupliqué (Dev) | Source unique générée | P2 |
| H2 | Couche org 0 test / pas d'E2E CI (Dev) | Jest + Playwright CI | P2 |
| H3 | Génération single-call/timeout (Dev) | Jobs async + streaming | P2 |
| H4 | Dépendance Anthropic (Investisseur, Dev) | Abstraction multi-provider + suivi coût | P3 |
| H5 | Incohérences doc / code mort (Dev) | Passe de cohérence | P3 |
| I1-I8 | Manque d'un hook d'activation/acquisition gratuit (Growth, Coach) | Feature « Analyse & Recommandations » IG/LinkedIn (score + reco + réécriture bio/hashtags + créneaux + action) | P1 |

---

## Le seul ordre qui compte

1. **Prouver la qualité de contenu (C1)** — sinon tout le reste est inutile.
2. **Baisser le prix (B1)** — sinon personne ne convertit.
3. **10 clients payants (C2)** — sinon pas de preuve, pas d'investisseur, pas de pitch.
4. **Fermer la boucle (A1)** — sinon ils résilient au mois 2.
5. **Un pilote réseau (C3+D1+D2)** — sinon le pitch Herbalife reste une promesse.

Tout le reste (UX, sécu avancée, dette) est important mais **secondaire tant que 1→5 ne sont pas faits**.
