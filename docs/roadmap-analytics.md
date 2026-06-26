# Roadmap Analytics — AuraPost
> Chantier long terme · Dernière mise à jour : 2026-06-26 · **Volet A (sites vitrines) IMPLÉMENTÉ — Volet B (social) en roadmap uniquement**

---

## ⚠️ Questions produit à trancher avant de démarrer

Ces décisions ne peuvent pas être prises techniquement. Sans réponse, l'implémentation serait soit trop large, soit retravailler à mi-chemin.

### Volet A — Analytics du site vitrine

**Q1 — Responsable de traitement des données visiteurs**
Le site `<slug>.aurapost.fr` appartient au coach. Ses visiteurs sont traités par qui ? Deux options aux implications légales radicalement différentes :
- **Option A — AuraPost = sous-traitant** : AuraPost collecte pour le compte du coach. Le coach doit configurer une politique de confidentialité sur son site. AuraPost doit signer un DPA (Data Processing Agreement) avec chaque coach. Plus lourd légalement mais plus de contrôle.
- **Option B — AuraPost = responsable de traitement indépendant** : AuraPost collecte ses propres données d'usage pour améliorer le service. Plus simple, mais les metrics ne "appartiennent" pas au coach.

→ **Trancher avant la Phase A-1.**

**Q2 — Solution de tracking : propriétaire ou tierce ?**
Deux architectures possibles :
- **Propriétaire** : un script de tracking léger servi depuis AuraPost, événements stockés en DB (nouvelle table `site_visits`). Zéro dépendance externe, RGPD natif, données dans le même outil. Coût : ~2 jours de dev pour la collecte + ~1 jour pour le tableau de bord.
- **Tierce légère** (Plausible, Umami auto-hébergé, Fathom) : intégration d'un script externe. Moins de dev côté AuraPost mais dépendance, coût mensuel, et le coach verrait un outil externe au lieu d'une page AuraPost.

> **Recommandation technique** : solution propriétaire. Le fait d'héberger soi-même évite une bannière cookie supplémentaire (si tracking anonymisé sans fingerprinting), reste cohérent avec la marque, et représente un avantage différenciant ("analytics intégrés") plutôt qu'une redirection vers Plausible.

**Q3 — Quelles métriques côté coach ?**
Le scope change l'effort de 2× selon la réponse. Choisir avant de coder :
- Niveau minimal : visiteurs uniques/jour, pages vues totales, source de trafic (direct/organique/référent)
- Niveau standard : + durée moyenne, % de retour, device (mobile vs desktop), pays
- Niveau avancé : + heatmap, clics sur le CTA, taux de rebond, performance par section

Chaque niveau supplémentaire multiplie la taille de la table `site_visits` et la complexité du tableau de bord.

**Q4 — Cookie banner sur le site du coach ?**
Si le tracking est anonymisé (pas d'IP stockée, pas de fingerprinting, pas de cookie posé sur le navigateur du visiteur), la loi française n'exige pas de bannière cookie. Si on stocke des cookies (session ID), une bannière est obligatoire sur le site du coach — et c'est au coach d'expliquer à ses visiteurs ce qu'il collecte. Trancher le niveau de tracking pour en déduire l'obligation légale.

---

### Volet B — Analytics sociaux

**Q5 — Priorité relative des deux volets**
Les deux volets sont indépendants techniquement. Le Volet A (site vitrine) est réalisable sans accord externe, en interne, rapidement. Le Volet B (sociaux) requiert une Meta App approuvée (semaines à mois de délai), une review LinkedIn (idem). Souhaitez-vous démarrer A seul maintenant, et traiter B comme un chantier séparé plus tard ?

**Q6 — Périmètre Instagram : comptes Business uniquement ?**
L'Instagram Graph API (seule API officielle permettant d'accéder aux métriques réelles) est réservée aux comptes **Business ou Creator** connectés à une page Facebook. Les comptes personnels n'y ont pas accès. Si une part significative des coachs AuraPost ont des comptes personnels, le Volet B n'aurait d'impact que pour les autres.

**Q7 — Engagement Meta (vérification d'entreprise)**
Accéder aux insights Instagram (portée, impressions, engagement rate) via l'API Graph requiert :
1. Créer une Meta App
2. Passer le niveau de permissions avancé (scopes `instagram_manage_insights`, `pages_read_engagement`)
3. Soumettre à la review Meta — délai imprévisible (1 semaine à 2 mois), peut être refusé

Êtes-vous prêt à engager ce processus ? La review peut nécessiter des vidéos de démonstration, une politique de confidentialité à jour, et potentiellement une vérification d'identité d'entreprise.

---

## Audit technique

### Ce qui existe

| Élément | Fichier | Rôle actuel | Utilisable pour ce chantier ? |
|---|---|---|---|
| `lib/analytics.ts` | GA4 + Meta Pixel | Tracking de l'**app AuraPost** (sign_up, checkout, etc.) | Non — c'est pour AuraPost, pas pour les sites coaches |
| `lib/db/analytics.ts` | `getCoachAnalytics()` | Posts générés/approuvés/rejetés par thème et par mois | Partiellement — déjà consommé par `/dashboard/analytics` |
| `app/dashboard/analytics/page.tsx` | — | Tableau de bord "analytics" actuel — 4 KPIs posts + graphe mensuel | À étendre ou remplacer |
| `components/CookieBanner.tsx` | — | Bannière RGPD sur l'app AuraPost, granulaire (analytics/marketing) | À dupliquer/adapter pour le site coach si tracking non-anonyme |
| `lib/coach-site-theme.ts`, `lib/integrations.ts` | — | Aucun tracking Instagram/LinkedIn API configuré | Départ zéro pour les APIs sociales |
| `lib/instagram.ts` | — | **Scraping** HTML de profil public — extraction best-effort des balises og:, JSON embarqué | Lit un état ponctuel, jamais les métriques d'engagement |
| `lib/analyze/instagram.ts` | — | Analyse IA du profil scrapé (score, hashtags proposés, recommandations) | Analyse qualitative uniquement, sans données temps réel |
| `lib/analyze/linkedin.ts` | — | Analyse IA sur **saisie manuelle** — titre, résumé, posts collés | Aucune API, aucun OAuth |

### Ce qui est absent

| Ce qui manque | Impact |
|---|---|
| Table `site_visits` (ou équivalent) en DB | Le schema actuel n'a aucune table pour stocker des visiteurs de sous-domaine coach |
| Script de tracking sur `app/site/[subdomain]/layout.tsx` | Ce layout n'existe pas encore (ou n'a pas de script tracking) — aucun pixel ne se déclenche |
| Cookie banner sur les sites coachs | Le `CookieBanner.tsx` est monté uniquement dans `app/layout.tsx` — il ne s'affiche pas sur `app/site/[subdomain]/*` |
| OAuth Meta / Instagram Graph API | Aucune clé dans `lib/integrations.ts`, aucun flow OAuth dans le code |
| OAuth LinkedIn Marketing API | Idem — zéro infrastructure OAuth LinkedIn |
| Métriques temps réel sur le dashboard coach | Le `/dashboard/analytics` ne montre que des métriques de posts, pas de trafic site |

---

## Volet A — Analytics du site vitrine coach

### Phase A-1 : Collecte des événements de visite — S/M

**Quoi (fonctionnel)** : Un visiteur qui arrive sur `slug.aurapost.fr` est comptabilisé. On enregistre : timestamp, page visitée (toujours la racine pour l'instant), device (UA), référent (Referer header), pays (IP → GeoIP sans stocker l'IP brute).

**Quoi (technique)** :
- Nouvelle table `site_visits` dans le schéma Drizzle : `(id, websiteId, visitedAt, referrer, country, device, page)`
- Endpoint server-side `POST /api/track/visit` déclenché depuis un petit script inline dans `app/site/[subdomain]/layout.tsx` (ou un Server Component qui insère directement)
- **Anonymisation RGPD** : ne pas stocker l'IP brute ; résoudre pays depuis IP via une lib GeoIP légère (ex: `@maxmind/geoip2-node` avec la base GeoLite2 — gratuite, auto-hébergée) puis jeter l'IP
- Si la collecte est entièrement server-side et anonymisée (pas de cookie, pas d'IP stockée), aucune bannière cookie n'est requise côté RGPD français selon les lignes directrices CNIL de 2023 (exemption pour les analytics de mesure d'audience strictement nécessaire, sans croisement de données)

**Existe déjà / à créer** :
- À créer : table `site_visits`, endpoint `/api/track/visit`, script dans le layout du site coach
- À créer : migration Drizzle correspondante
- Réutilisable : `lib/db/index.ts` (Drizzle connection), pattern tables existantes

**Dépendances** : Décision Q2 (propriétaire vs tiers) et Q4 (niveau d'anonymisation) requises avant de coder.

**Effort** : S si tracking anonyme server-side sans GeoIP. M si GeoIP inclus (base à télécharger, processus de résolution à intégrer).

**Risques** :
- Overhead DB : chaque visite = 1 INSERT. Pour un coach avec 500 visites/mois c'est négligeable ; à 100 coaches actifs × 500 = 50k lignes/mois. Prévoir une politique de rétention (ex: 12 mois glissants, cron de nettoyage).
- Layout `app/site/[subdomain]/` : vérifier s'il existe un `layout.tsx` dédié. Si non, à créer.

---

### Phase A-2 : Tableau de bord visiteurs dans le dashboard coach — M

**Quoi (fonctionnel)** : Une section "Trafic de votre site" dans `/dashboard/analytics` (ou onglet séparé). Métriques affichées : visiteurs uniques (par jour/semaine/mois), sources de trafic (direct, Google, réseaux sociaux), répartition device (mobile/desktop), top pays.

**Quoi (technique)** :
- Requêtes sur `site_visits` avec `websiteId = tenant.websiteId` : COUNT DISTINCT sur combinaison (visitedAt::date, referrer hash) pour les "uniques"
- Agrégation par `device`, `referrer`, `country` pour les breakdowns
- Composant `SiteAnalyticsDashboard.tsx` dans `app/dashboard/analytics/` — Server Component avec recharts ou chart.js (ou recharts qui est déjà peut-être dans les deps — vérifier)
- Intégration à la page analytics existante (onglet supplémentaire ou section en dessous des métriques posts actuelles)

**Existe déjà** :
- `app/dashboard/analytics/page.tsx` — structure de base à étendre
- Pattern KPI cards et graphe barres déjà implémentés — réutiliser les composants

**Dépendances** : Phase A-1 obligatoire (données). Décision Q3 (quelles métriques exactement).

**Effort** : M — les queries SQL sont simples, l'effort est dans le dashboard UI.

**Risques** :
- "Visiteurs uniques" sans cookie est une approximation (combinaison IP+UA+date n'est pas parfaite). Il faut afficher "visiteurs estimés" pour être honnête.
- Besoin d'un graphique : vérifier si une lib chart est déjà installée. Si non, ajouter recharts (~30 KB gzip) ou utiliser une alternative CSS-only pour rester léger.

---

### Phase A-3 : RGPD — Bannière sur le site coach si cookies — S

**Quoi** : Si la décision Q4 conclut qu'un cookie est posé (ex: session visitor pour compter les visites de retour), le site du coach a besoin d'une bannière cookie propre.

**Quoi (technique)** :
- Créer un `CookieBanner` minimaliste dans `app/site/[subdomain]/` — distinct du `CookieBanner.tsx` de l'app AuraPost
- La politique de confidentialité du coach (`app/site/[subdomain]/privacy` ?) doit mentionner ce tracking
- Si AuraPost est sous-traitant du coach (Q1) : le coach devra valider un texte de politique avant activation du tracking

**Dépendances** : Décisions Q1 et Q4 uniquement.

**Effort** : S si bannière simple sans gestion fine (tout ou rien). M si granulaire.

**Risques** : Complexité légale si on ouvre la porte au coach de "personnaliser" sa politique — scope creep à éviter.

---

## Volet B — Analytics sociaux réels

### Phase B-0 : Audit des APIs et prérequis — S (avant tout code)

**Quoi** : Avant d'ouvrir un seul éditeur, faire le point sur la faisabilité réelle des APIs Meta et LinkedIn.

**État des APIs en 2026 :**

**Instagram Graph API (Meta)**
- Accès uniquement aux comptes **Business ou Creator** (pas les personnels)
- Scopes nécessaires pour les insights : `instagram_manage_insights`, `pages_read_engagement`, `instagram_basic`
- Scopes à review avancée (Meta App Review) : `instagram_manage_insights` est dans la catégorie "Advanced Access" — implique vérification d'entreprise Meta + vidéo démo + privacy policy review
- Rate limits : 200 appels/heure par token utilisateur (Graph API)
- Métriques disponibles : impressions, reach, engagement, profile_views, follower_count par période
- Durée du token : User Access Token = 60 jours max, puis re-auth obligatoire. Long-lived tokens via échange : 60 jours renouvelables.

**LinkedIn Marketing API**
- OAuth 2.0 avec scopes `r_organization_social` (pages entreprise) ou `r_member_social` (profil perso)
- Les analytics de posts personnels nécessitent `r_member_social` + approval de LinkedIn
- LinkedIn a drastiquement restreint l'accès aux APIs analytiques depuis 2021 — `rw_organization_admin` pour les pages est plus facile que les profils perso
- Pour les coachs avec profils personnels (pas de page entreprise) : accès très limité

**Conclusion Phase B-0** : évaluer avec la direction si l'effort d'approbation Meta (semaines à mois) justifie le chantier, et si la cible coaches sur comptes personnels (fréquent) est acceptable avec des metrics partiels.

**Effort** : S (recherche, pas de code). **Cette phase est un go/no-go**.

---

### Phase B-1 : OAuth Meta — connexion Instagram Business — L

**Quoi (fonctionnel)** : Le coach connecte son compte Instagram Business depuis son dashboard. AuraPost stocke son token OAuth et peut récupérer ses métriques périodiquement.

**Quoi (technique)** :
- Nouvelle table `oauth_tokens` : `(id, tenantId, platform, accessToken, expiresAt, scope, createdAt)`
- Flow OAuth Meta côté serveur : `/api/oauth/meta/connect` → redirect Meta → callback `/api/oauth/meta/callback` → échange code → token
- Variables d'env : `META_APP_ID`, `META_APP_SECRET`, `META_APP_REDIRECT_URI`
- Refresh automatique des tokens avant expiration (cron ou à la demande)
- Chiffrement du token en DB (ne jamais stocker un access token en clair — AES-256 ou champ chiffré via lib)

**Existe déjà** : Aucun OAuth dans le projet (Instagram est actuellement du scraping).

**Dépendances** : Phase B-0 (go/no-go Meta), décision Q6, Q7.

**Effort** : L — l'OAuth Meta en production nécessite la Meta App Review au préalable. Le code lui-même est ~2 jours, mais le processus Meta peut durer des semaines.

**Risques** :
- Meta App Review imprévisible — peut être refusé ou demander des modifications
- Token expiry : les tokens 60 jours nécessitent un mécanisme de refresh et de re-auth si expirés — UX complexe
- Compte Business requis : si le coach a un compte perso, il doit le convertir (action irréversible côté Meta)

---

### Phase B-2 : Récupération et affichage des insights Instagram — M

**Quoi (fonctionnel)** : Dashboard "Réseaux sociaux" dans le dashboard coach : portée sur les 30 derniers jours, engagement rate moyen, croissance followers, meilleur créneau horaire.

**Quoi (technique)** :
- Nouvelle table `social_insights` : `(id, tenantId, platform, period, impressions, reach, engagement, followerCount, fetchedAt)`
- Cron quotidien `fetch-social-insights` : pour chaque tenant avec token actif, appel à l'API Graph et upsert
- Endpoints API : `GET /v18.0/{ig-user-id}/insights?metric=impressions,reach&period=day`
- Dashboard UI : composants recharts (barres reach/impressions, évolution followers)

**Dépendances** : Phase B-1 (token OAuth actif).

**Effort** : M — la complexité est dans la gestion des tokens et les cas d'erreur (token expiré, compte déconnecté).

---

### Phase B-3 : LinkedIn (optionnel, si go après B-0) — L

**Quoi** : Même flow pour LinkedIn — OAuth, stockage token, fetch métriques profil perso ou page entreprise.

**Dépendances** : Phase B-0 (évaluation faisabilité LinkedIn), Phase B-1 (pattern OAuth réutilisable).

**Effort** : L — LinkedIn API est plus restrictive et moins bien documentée. À traiter après Instagram, jamais en parallèle.

---

## Synthèse — Effort par phase

| Phase | Description | Effort | Bloquant sur |
|---|---|---|---|
| A-1 | Collecte événements visites (server-side anonyme) | S–M | Q2, Q4 |
| A-2 | Tableau de bord trafic dans le dashboard | M | A-1, Q3 |
| A-3 | Bannière RGPD site coach (si cookies) | S | Q1, Q4 |
| B-0 | Audit faisabilité APIs Meta/LinkedIn (go/no-go) | S | Q5 |
| B-1 | OAuth Meta + connexion Instagram Business | L | B-0, Q6, Q7 |
| B-2 | Fetch insights Instagram + dashboard | M | B-1 |
| B-3 | LinkedIn (si go) | L | B-0, B-1 |

**Recommandation d'ordre** : A-1 → A-2 (→ A-3 si nécessaire) en premier — faisable en interne, sans dépendance externe, livrable rapidement. B-0 en parallèle pour décider si le Volet B vaut le temps de revue Meta. B-1/B-2/B-3 uniquement après go explicite.
