# Roadmap Globale AuraPost — Nouvelles Fonctionnalités
> Créée le 2026-06-27 · Audit complet du codebase, des roadmaps existantes et des lacunes produit.
> Les chantiers déjà documentés (Édition IA, Styles, Analytics, Affiliation, Zernio) sont résumés ici mais leurs roadmaps détaillées restent dans leurs fichiers dédiés.

---

## État de l'art — ce qui existe déjà

Avant de planifier du nouveau, cartographie de ce qui est production-ready (ou quasi) :

| Fonctionnalité | État |
|---|---|
| Génération IA de posts Instagram + LinkedIn (12/mois) | ✅ Prod |
| Variantes + pack de légendes (stories) | ✅ Prod |
| Export CSV + iCal | ✅ Prod |
| Calendrier éditorial avec planification | ✅ Prod |
| Profil coach multi-sections | ✅ Prod |
| Analyse IA profil Instagram + LinkedIn | ✅ Prod |
| Site vitrine coach (3 styles) | ✅ Prod |
| Publication sociale Zernio (Z-1 à Z-5) | ✅ Prod (infra manque) |
| Analytics site vitrine — Volet A | ✅ Prod (migration Turso manque) |
| Parrainage / affiliation (R-0 à R-3) | ✅ Prod |
| Organisations / agences (Teams) | ✅ Prod |
| Paiement Stripe | ✅ Prod (clés manquent) |
| Édition IA d'images — schéma DB | ✅ Schéma en place |
| Switch/never exhaustif pour le 4e style | ✅ Infra prête |

---

## Priorités de déploiement (actions humaines — pas de code)

> Ces 3 points débloquent les fonctionnalités **déjà codées**. À faire avant tout nouveau chantier.

1. **Migrations Turso prod** (`0003` analytics + `0006` social) → 15 min
2. **Clés Stripe prod** → active le revenu
3. **Clés Zernio prod** + webhook → active la publication sociale

---

## Organisation de la roadmap

Les chantiers sont groupés par thème et ordonnés par **impact business / effort** :

| Symbole | Effort |
|---|---|
| XS | < 2h |
| S | demi-journée |
| M | 1 journée |
| L | 2–3 jours |
| XL | 1 semaine+ |

---

## Chantier A — Contenu & Génération

*Cœur du produit. Tout ce qui améliore la qualité ou la quantité du contenu généré.*

---

### A-1 — Génération de contenu pour TikTok et Twitter/X *(M)*

**Problème :** Le contenu généré cible uniquement Instagram et LinkedIn. TikTok est le réseau le plus en croissance pour les coaches sportifs/bien-être. Twitter/X reste pertinent pour les coaches corporate et business.

**Ce qu'on ajoute :**
- Nouveaux formats dans `lib/content-generator.ts` : scripts TikTok (accroches + narration + CTA en 60s), fils Twitter/X (thread 5–7 tweets)
- Ajout de `network: 'tiktok' | 'twitter'` dans le type `GeneratedPost`
- Toggle dans le profil coach : activer/désactiver les réseaux voulus
- TikTok script : format caption + hashtags + indication "voix off" / "sous-titres"

**Gating :** `content_only` + `pack_complet` (pas sur `starter`).

**Dépend de :** Rien.

---

### A-2 — Séries thématiques de posts (Programme éditorial) *(L)*

**Problème :** Les 12 posts générés sont indépendants les uns des autres. Un coach qui veut faire une "semaine spéciale" sur un thème (préparation mentale, nutrition, etc.) doit tout retravailler à la main.

**Ce qu'on ajoute :**
- UI dans le dashboard : "Créer une série" → choisir un thème + durée (5, 7, 10 posts)
- Génération d'une série cohérente avec un fil narratif : intro, développement, conclusion
- La série est distinct du lot mensuel (pas de décompte sur les 12/mois)
- Nouveaux champs `seriesId` + `seriesPosition` dans `generatedPosts`
- Export de la série entière en bloc

**Gating :** `pack_complet` uniquement (2 séries/mois max en v1).

**Dépend de :** Rien.

---

### A-3 — Newsletter / contenu email pour les coaches *(M)*

**Problème :** Les coaches qui ont une liste email n'ont aucun outil dans AuraPost pour générer le contenu de leurs newsletters. C'est une lacune face à des outils comme Beehiiv ou Substack.

**Ce qu'on ajoute :**
- Nouvel onglet "Newsletter" dans le dashboard
- Génération d'une newsletter mensuelle (titre, intro, 3 sections de contenu, CTA) calibrée sur le profil du coach
- Format HTML propre exportable dans n'importe quel outil email (Mailchimp, Brevo, etc.)
- Pas d'envoi depuis AuraPost en v1 — uniquement génération + copie

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** Rien.

---

### A-4 — Suggestions de posts basées sur les tendances *(L)*

**Problème :** Les posts sont générés à partir du profil statique du coach. Aucune prise en compte des tendances du moment (rentrée, Nouvel An, Jeux olympiques, etc.) ou de l'actualité de sa niche.

**Ce qu'on ajoute :**
- Calendrier de "moments marketing" pré-rempli par niche (sport : préparation hivernale, saison été, etc.)
- Option "Intégrer l'actualité" au moment de la génération mensuelle → Claude reçoit le contexte temporel
- Suggestions automatiques dans le dashboard ("Ce mois-ci, beaucoup de coaches fitness parlent de X — veux-tu l'intégrer ?")
- Pas d'API externe de trending en v1 — contexte injecté manuellement par Logan + mis à jour mensuellement

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** A-1 (pour élargir aux nouveaux formats).

---

### A-5 — Traduction automatique des posts *(S)*

**Problème :** Des coaches francophones veulent publier en anglais (ou en espagnol) pour toucher une audience internationale. La retraduction manuelle est fastidieuse.

**Ce qu'on ajoute :**
- Bouton "Traduire" sur chaque post → appel Claude avec le contenu source
- Langue cible sélectionnable (EN, ES, PT pour commencer)
- Variante de traduction sauvegardée dans `generatedPosts` (via `variantOfId`)
- Pas de génération native dans une autre langue en v1 — uniquement traduction post-génération

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** Rien.

---

### A-6 — Recyclage des meilleurs posts *(M)*

**Problème :** Un post qui a bien performé il y a 6 mois peut être republié adapté. Aucun outil pour ça aujourd'hui.

**Ce qu'on ajoute :**
- Dans `/dashboard/history` : bouton "Recréer à partir de ce post"
- Claude reçoit le post original + la date + l'instruction de le réécrire avec un angle différent
- Sauvegardé comme variante du post source (`variantOfId`)
- Option "recycler automatiquement" : 1 des 12 posts mensuels est une réécriture du meilleur post d'il y a 3 mois

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** Rien.

---

### A-7 — Script pour Reels / vidéo courte *(M)*

**Problème :** Instagram Reels et TikTok sont du format vidéo, pas du texte. Les coaches qui font de la vidéo n'ont rien dans AuraPost.

**Ce qu'on ajoute :**
- Nouveau format `'reel_script'` dans `generatedPosts.format`
- Génération d'un script structuré : accroche (3s), développement (20-30s), conclusion + CTA (5s)
- Sous-titres suggérés pour chaque segment
- Export en texte formaté (compatible Capcut, Captions.ai, CapCut)
- Pas de génération vidéo en v1 — uniquement le script

**Gating :** `pack_complet` uniquement.

**Dépend de :** A-1 (logique de génération par format).

---

## Chantier B — Publication & Scheduling

*Tout ce qui améliore le workflow entre la génération et la publication réelle.*

---

### B-1 — Planification native avec file d'attente *(XL)*

**Problème :** Le calendrier éditorial actuel permet de planifier une date sur un post, mais la publication reste manuelle. Il n'y a pas de vraie file d'attente automatique.

**Ce qu'on ajoute :**
- Drag-and-drop du calendrier éditorial (déplacer les posts sur les jours)
- File de publication automatique via Zernio : si un post est "approuvé" + a une date planifiée + un compte connecté → Zernio publie automatiquement à l'heure
- Heure de publication optimale par réseau (LinkedIn : mardi/jeudi 8h–10h, Instagram : lundi/mercredi 18h–20h — injectée par défaut, éditable)
- Prévisualisation du post avec le visuel avant envoi
- Notification au coach 1h avant chaque publication planifiée

**Gating :** `pack_complet` uniquement.

**Dépend de :** Zernio prod (clés), B-2 (visuels).

---

### B-2 — Statistiques de publication (feedback Zernio) *(L)*

**Problème :** Une fois un post publié via Zernio, on ne sait pas comment il performe. Zernio peut retourner des métriques d'engagement via webhook.

**Ce qu'on ajoute :**
- Nouveau champ `engagementData` (JSON) dans `socialPublications`
- Webhook Zernio étendu : écouter les événements `post.stats` (likes, comments, reach)
- Dans `/dashboard/social` : vue des posts publiés avec leurs métriques
- Classement "Top 3 posts" par engagement
- Ces données alimentent les suggestions de recyclage (A-6)

**Gating :** `pack_complet`.

**Dépend de :** Zernio prod activé.

---

### B-3 — Support TikTok + Twitter/X dans Zernio *(M)*

**Problème :** Zernio supporte LinkedIn et Instagram. TikTok et Twitter/X sont des plateformes clés pour certains profils de coaches.

**Ce qu'on ajoute :**
- Ajout de `'tiktok' | 'twitter'` dans le type `platform` de `socialConnections`
- Flow OAuth Zernio pour ces deux plateformes (si supporté par Zernio)
- Adaptation du bouton Publier : filtrer les connexions par plateforme compatibles avec le format du post

**Gating :** `pack_complet`.

**Dépend de :** Disponibilité côté Zernio, A-1 (formats TikTok/Twitter).

---

## Chantier C — Site Vitrine Coach

*Tout ce qui améliore le site `<slug>.aurapost.fr`.*

---

### C-1 — 4e style visuel *(XL — voir roadmap-nouveaux-styles.md)*

**Résumé :** Infrastructure prête (S-0 + S-1). Bloqué uniquement sur la décision produit (identité visuelle, niche cible, palette). Dès que Logan décide, les phases S-2 à S-6 peuvent être enchaînées en ~1 semaine.

**Décision requise :** Nom, palette, typographie, mood, niche cible.

---

### C-2 — Domaine personnalisé pour le site coach *(L)*

**Problème :** Tous les coaches ont un site `<slug>.aurapost.fr`. Un coach sérieux veut `julien-martin-coach.fr` ou `coachingperformance.com` — son propre domaine.

**Ce qu'on ajoute :**
- Champ `customDomain` dans `websites` (déjà dans le schéma !)
- Interface dans `/dashboard/website` : saisir un domaine personnalisé + instructions de configuration DNS
- Vérification DNS côté serveur (TXT record) avant d'activer le domaine
- Proxy Netlify vers le bon slug (via `next.config.js` rewrites ou middleware)
- Certificat SSL automatique via Netlify (déjà géré par la plateforme)
- Gating : `pack_complet` uniquement (feature premium différenciante)

**Dépend de :** SSL wildcard déployé (checklist item 6).

---

### C-3 — Blog intégré au site vitrine *(XL)*

**Problème :** Pour le SEO du coach, avoir des articles de blog sur son sous-domaine est crucial. Aujourd'hui le site est une one-page statique.

**Ce qu'on ajoute :**
- Nouveau type de contenu `blogPosts` (table DB) : `tenantId`, `slug`, `title`, `content`, `excerpt`, `publishedAt`
- Interface de rédaction dans le dashboard (simple éditeur markdown ou rich text)
- **Génération IA** : Claude génère un article de blog à partir d'un thème saisi (ex: "comment préparer son premier marathon")
- Route publique `/[subdomain]/blog/[slug]` sur le site coach
- Sitemap.xml dynamique par coach (améliore le SEO)
- Page liste `/[subdomain]/blog` avec excerpts

**Gating :** `pack_complet`.

**Dépend de :** C-2 optionnel (fonctionne aussi sans domaine perso).

---

### C-4 — Formulaire de capture de leads *(M)*

**Problème :** Le site vitrine actuel a un formulaire de contact (`/api/site/contact`), mais il envoie juste un email au coach. Aucune liste de leads gérée dans AuraPost.

**Ce qu'on ajoute :**
- Table `siteLeads` : `tenantId`, `name`, `email`, `phone?`, `message?`, `source`, `createdAt`
- Le formulaire de contact alimente cette table en plus d'envoyer l'email
- Page `/dashboard/leads` : liste des contacts avec export CSV
- Segmentation simple : lead depuis le formulaire contact vs lead depuis un pop-up (v2)
- Notification email au coach pour chaque nouveau lead
- Optionnel : intégration webhook sortant vers Brevo/Mailchimp pour ajouter le lead à une liste

**Gating :** `pack_complet`.

**Dépend de :** Rien (formulaire de contact existe déjà).

---

### C-5 — Chatbot IA sur le site vitrine *(XL)*

**Problème :** Les visiteurs du site du coach ont des questions (tarifs, disponibilités, spécialité) qu'ils n'osent pas poser par formulaire. Un chatbot entraîné sur le profil du coach répondrait 24/7.

**Ce qu'on ajoute :**
- Widget de chat sur le site `<slug>.aurapost.fr` (bouton flottant en bas à droite)
- Claude reçoit comme contexte le profil complet du coach (bio, spécialité, services, tarifs, témoignages)
- Réponses en français, ton calé sur le style du coach
- Si la question dépasse le contexte : invitation à contacter le coach via le formulaire
- Leads capturés si le visiteur laisse son email dans le chat
- Log des conversations (anonymisé) dans le dashboard du coach

**Gating :** `pack_complet` uniquement (feature premium signature).

**Dépend de :** C-4 (leads), C-3 optionnel.

---

### C-6 — Section tarifs éditable *(S)*

**Problème :** Le site vitrine actuel n'a pas de section tarifs. Les coaches veulent afficher leurs offres (coaching individuel, programme en groupe, etc.) avec des prix.

**Ce qu'on ajoute :**
- Nouveau champ `pricingJson` dans `websites` : tableau d'offres (nom, prix, durée, inclusions)
- Section "Mes offres" dans le questionnaire d'onboarding du site
- Rendu de la section sur le site vitrine (dans les 3 styles existants + le 4e à venir)
- Option "masquer les prix" pour les coaches qui préfèrent "prix sur demande"

**Dépend de :** Rien.

---

### C-7 — Portail client pour les clients du coach *(XL)*

**Problème :** Les clients des coaches n'ont aucun espace dédié. Tout se fait par email, WhatsApp ou des outils externes (Notion, Google Drive).

**Ce qu'on ajoute :**
- Accès "client" distinct du compte coach : email + magic link
- Tableau de bord client : accéder à son programme, ses ressources, ses séances
- Le coach uploader des ressources (PDF, vidéos, plans d'entraînement) par client
- Messagerie interne coach ↔ client
- Paiement de séances (intégration Stripe pour les coaches)

**Gating :** Nouvelle offre à définir (serait un add-on ou plan supérieur).

**Dépend de :** C-2 (portail client sous le domaine coach), C-4 (leads → convertis en clients).

---

## Chantier D — Intelligence & IA

*Fonctionnalités qui exploitent l'IA pour mieux conseiller et personnaliser.*

---

### D-1 — Scoring prédictif des posts *(L)*

**Problème :** On génère 12 posts mais on ne sait pas lesquels vont bien performer avant de les publier. Les coaches approuvent souvent au feeling.

**Ce qu'on ajoute :**
- Endpoint `POST /api/posts/[id]/score` : Claude évalue le post sur 4 critères (accroche, lisibilité, CTA, hashtags) + donne un score /100
- Badge score sur chaque PostCard dans le dashboard
- Tri des posts par score (aider le coach à prioriser)
- Après 6 mois de données (via B-2 stats Zernio), calibrer le scoring sur les vraies performances

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** Rien pour la v1. B-2 pour la calibration réelle.

---

### D-2 — Analyse de la concurrence *(L)*

**Problème :** La feature "Analyse" actuelle ne regarde que le profil du coach lui-même. Il n'y a aucune comparaison avec d'autres coaches de la même niche.

**Ce qu'on ajoute :**
- Champ "URLs de concurrents à analyser" dans l'onglet Analyse
- Scraping des profils publics concurrents (même mécanisme que `lib/instagram.ts`)
- Analyse comparative : points forts du coach vs concurrents, lacunes à combler
- Recommandations spécifiques basées sur l'analyse concurrentielle

**Gating :** `pack_complet` uniquement.

**Dépend de :** Rien (infrastructure scraping déjà là).

---

### D-3 — Optimiseur de bio et headline *(S)*

**Problème :** La bio Instagram et le headline LinkedIn du coach ont un impact direct sur les abonnements. Pas d'outil dédié pour les optimiser.

**Ce qu'on ajoute :**
- Page ou modal "Optimise ta bio" dans `/dashboard/analyze`
- Saisie de la bio actuelle → Claude génère 3 variantes optimisées pour la conversion
- Pour LinkedIn : génère une headline + un résumé "About" en format storytelling
- Prend en compte le score d'analyse existant

**Gating :** `content_only` + `pack_complet`.

**Dépend de :** Rien.

---

### D-4 — Recommandations IA dynamiques basées sur les stats *(M)*

**Problème :** `SmartSuggestions` génère des suggestions statiques basées sur l'ancienneté du profil. Elles ne s'adaptent pas aux vraies données (posts rejetés, taux d'approbation faible, etc.).

**Ce qu'on ajoute :**
- Analyse hebdomadaire des patterns du coach (% de posts approuvés, types de posts approuvés vs rejetés)
- Suggestions dynamiques : "Tu approuves 80% des posts LinkedIn mais seulement 40% des posts Instagram — on peut adapter le ton ?"
- Intégration des données de publication (B-2) : "Tes posts éducatifs performent 2× mieux que tes posts motivationnels"
- Notification email hebdomadaire avec les 3 recommandations prioritaires

**Dépend de :** B-2 (stats réelles), D-1 (scoring).

---

### D-5 — Générateur de hashtags optimisés *(S)*

**Problème :** Les hashtags générés sont bons mais génériques. Pas d'outil dédié pour tester, comparer et optimiser les hashtags d'une niche.

**Ce qu'on ajoute :**
- Page `/dashboard/hashtags` : saisir un thème → Claude génère 3 ensembles de 20–30 hashtags (large audience / niche / local)
- Sauvegarde des ensembles préférés (favoris)
- Intégration : option "utiliser mes hashtags sauvegardés" dans la génération de posts
- Analyse de performance des hashtags (si données B-2 disponibles)

**Dépend de :** Rien pour la v1.

---

## Chantier E — Édition d'Images IA

*Voir `docs/roadmap-edition-images.md` pour le détail complet. Résumé ici.*

---

### E-1 — Mode manuel (I-1 + I-2) *(M+M)*

Bloqué sur 3 décisions produit (Q1 modèle API, Q2 plan dispo, Q3 quota). Schéma DB déjà en place (`editedPhotos`, `imageEditJobs`).

**Décisions requises avant de démarrer :**
- Q1 : FLUX.1 Kontext (recommandé) ou GPT Image 1.5 ?
- Q2 : `pack_complet` uniquement en v1 ? → **Oui recommandé**
- Q3 : 20 images/mois max → **Oui recommandé**

---

### E-2 — Mode automatique (I-3 + I-4) *(M+S)*

Job image déclenché en cascade après la génération texte. Photo sélectionnée automatiquement, prompt adapté par type de post.

**Dépend de :** E-1 validé en prod.

---

## Chantier F — Affiliation & Croissance

*Voir `docs/roadmap-affiliation.md` pour le détail. Résumé + nouvelles idées.*

---

### F-1 — Cookie d'attribution parrainage (R-1) *(XS)*

Poser un cookie `aurapost_ref` dans `/ref/[code]` → persiste 30 jours. Résout les conversions différées (visiteur qui revient plus tard).

**Effort :** < 2h. **Prêt à coder.**

---

### F-2 — Email de confirmation au filleul (R-2) *(XS)*

Envoyer un email au filleul confirmant le mois offert au moment de l'inscription. Réduit les contacts support.

**Effort :** < 2h. **Prêt à coder.**

---

### F-3 — Commission sur premier paiement (Affiliation v2) *(L)*

Lier le crédit au premier paiement Stripe du filleul (webhook `invoice.payment_succeeded`) plutôt qu'à l'inscription. Élimine les abus.

**Décision requise :** Q1 de la roadmap affiliation (A / B / C).

---

### F-4 — Programme Ambassadeur *(XL)*

**Problème :** Le programme de parrainage actuel est transactionnel (1 mois gratuit). Les coaches les plus engagés méritent un statut officiel avec des avantages supérieurs.

**Ce qu'on ajoute :**
- Statut "Ambassadeur AuraPost" débloqué après 5 parrainages actifs
- Avantages : remise permanente 20%, accès prioritaire aux nouvelles features, badge spécial sur la page Coaches
- Dashboard ambassadeur dédié : revenus générés pour AuraPost, classement, paliers
- Page publique `/ambassadeurs` avec les ambassadeurs actifs

**Dépend de :** F-3 (commission réelle).

---

### F-5 — Intégration PartnerStack ou impact.com *(XL)*

**Problème :** Le système de parrainage maison ne scale pas au-delà de quelques dizaines de parrains actifs. Des plateformes dédiées gèrent le tracking, les paiements, la conformité fiscale.

**Ce qu'on ajoute :**
- Migration du tracking vers PartnerStack ou impact.com
- Onboarding des parrains sur la plateforme externe
- Paiements réels via virement (dépasse le "mois gratuit")
- Programme d'affiliés ouvert à des influenceurs externes (pas seulement des clients AuraPost)

**Dépend de :** F-3 + décision produit forte.

---

## Chantier G — Analytics & Reporting

*Voir `docs/roadmap-analytics.md` pour le détail. Résumé + nouvelles idées.*

---

### G-1 — Dashboard analytics site vitrine (Volet A) *(Opérationnel après migration)*

Déjà implémenté. Nécessite uniquement la migration Turso prod `0003_site_visits.sql`.

---

### G-2 — Analytics sociaux via Zernio (Volet B-Zernio) *(M)*

Pas besoin de Meta App Review. Zernio expose déjà les métriques des posts publiés via son API. Plus rapide que la Meta Graph API.

**Ce qu'on ajoute :**
- Pull des métriques Zernio 24h après chaque publication (likes, impressions, engagement rate)
- Stockage dans `socialPublications.engagementData`
- Section "Performance sociale" dans `/dashboard/analytics`

**Dépend de :** Zernio prod activé, B-2.

---

### G-3 — Analytics sociaux natifs Meta/Instagram Graph API (Volet B-Meta) *(XL)*

**Bloquant externe :** nécessite une Meta App Review (1 semaine à 2 mois de délai). À planifier uniquement si Logan s'engage dans le processus d'approbation.

---

### G-4 — Rapport mensuel automatique par email *(S)*

**Problème :** Les coaches ne vérifient pas tous les jours leur dashboard. Un résumé mensuel par email garantit qu'ils voient leurs progrès.

**Ce qu'on ajoute :**
- Cron mensuel (1er du mois) : génère un rapport pour chaque coach actif
- Contenu : posts générés/approuvés/publiés ce mois, visiteurs du site, leads captés, post le plus performant
- Email HTML propre envoyé via Resend
- Option de désabonnement dédiée (distinct de l'email marketing général)

**Gating :** Tous les plans.

**Dépend de :** G-1 (pour les stats site), B-2 (pour les stats publication).

---

### G-5 — Panel admin — métriques temps réel *(M)*

Remplacer les valeurs hardcodées dans `lib/db/admin.ts` (`demoConversion: 32`, NPS simulé, MRR fictif) par des métriques réelles calculées depuis la DB + Stripe.

**Ce qu'on ajoute :**
- MRR réel : `SUM(subscriptions.amount)` depuis Stripe ou la DB
- Taux de conversion demo → payant : `paid / total_tenants`
- Churn mensuel : `canceled_this_month / active_last_month`
- NPS réel (si sondage en place — sinon placeholder honnête)

**Dépend de :** Stripe prod activé.

---

## Chantier H — Expérience Utilisateur

*Tout ce qui améliore l'ergonomie et la rétention des coaches.*

---

### H-1 — Onboarding interactif avec vidéo de bienvenue *(M)*

**Problème :** L'onboarding actuel est un stepper multi-étapes mais sans guidance visuelle forte. Les taux d'abandon sur les premières étapes sont probablement élevés.

**Ce qu'on ajoute :**
- Vidéo de bienvenue de 60s au premier login (peut être une vidéo de Logan ou un tutoriel animé)
- Tour interactif (tooltips) sur les éléments clés du dashboard au premier accès
- Email de bienvenue "J-1" avec 3 actions prioritaires à faire dans la semaine
- Tracking de l'avancement de l'onboarding dans `users.onboardingProgress`

**Dépend de :** Rien.

---

### H-2 — Notifications push (PWA) *(L)*

**Problème :** Les emails de notification sont parfois ignorés. Les notifications push sont plus immédiates.

**Ce qu'on ajoute :**
- Demande de permission push au premier login (si l'utilisateur a accepté l'installation de la PWA)
- Types de notifications : "Tes posts du mois sont prêts", "Nouveau lead sur ton site", "Post publié avec succès"
- Préférences de notification dans `/dashboard/settings`
- Backend : Web Push API (lib `web-push`), stockage des subscriptions push en DB

**Dépend de :** Rien (la PWA est déjà en place via `app/manifest.ts`).

---

### H-3 — Mode sombre *(S)*

**Problème :** L'app est en mode clair uniquement. Les coaches qui travaillent le soir préfèrent le mode sombre.

**Ce qu'on ajoute :**
- Toggle mode clair/sombre dans `/dashboard/settings`
- Respecter `prefers-color-scheme` par défaut
- Tokens CSS déjà compatibles via shadcn/ui (`.dark` classe sur le `html`)
- Persistance dans `localStorage`

**Dépend de :** Rien. Effort principalement de QA visuel.

---

### H-4 — Approbation groupée des posts *(S)*

**Problème :** Approuver ou rejeter 12 posts un par un est fastidieux. Les coaches veulent pouvoir tout sélectionner et approuver en bloc.

**Ce qu'on ajoute :**
- Checkbox sur chaque PostCard
- Barre d'action flottante : "Approuver la sélection" / "Rejeter la sélection"
- Action serveur batch pour mettre à jour plusieurs posts en une transaction
- Confirmation avant action de masse

**Dépend de :** Rien.

---

### H-5 — Raccourcis clavier *(XS)*

**Problème :** Les power users (coaches qui gèrent leur contenu quotidiennement) perdent du temps à naviguer à la souris.

**Ce qu'on ajoute :**
- `G` then `D` → dashboard, `G` then `H` → historique, `G` then `S` → social, `G` then `W` → site
- `?` → overlay des raccourcis disponibles
- Sur un post : `A` → approuver, `R` → rejeter, `C` → copier

**Dépend de :** Rien.

---

### H-6 — Support chat intégré *(S)*

**Problème :** Les coaches en difficulté n'ont que l'email support. Le chat intègre une aide instantanée et réduit le churn.

**Ce qu'on ajoute :**
- Intégration Crisp ou Chatwoot (open-source auto-hébergé)
- Widget de chat dans le dashboard
- Identification automatique du tenant/plan dans le chat
- Base de connaissances intégrée (FAQ articles dans l'interface Crisp)

**Dépend de :** Rien.

---

## Chantier I — Organisations & Agences

*Amélioration de l'offre Teams existante.*

---

### I-1 — Tableau de bord manager amélioré *(L)*

**Problème :** Le dashboard organisationnel actuel est basique. Les managers d'agences MLM ont besoin de vues avancées.

**Ce qu'on ajoute :**
- Vue "équipe" : liste tous les coaches/distributeurs avec leur plan, leur taux d'activation, leur last login
- Filtre par statut (actif, inactif depuis 30j, onboarding en cours)
- Rapport hebdomadaire agence : taux d'activation, posts approuvés par membre, classement interne
- Alerte automatique quand un membre est inactif depuis 14j

**Dépend de :** Rien (structure orgs déjà en place).

---

### I-2 — Brand kit et templates partagés (amélioré) *(M)*

**Problème :** `orgBrandKit` existe en DB (couleurs, ton, mots interdits) mais son utilisation dans la génération de posts n'est pas documentée.

**Ce qu'on ajoute :**
- Interface admin pour éditer le brand kit depuis le dashboard org
- Injection du brand kit dans le prompt de génération pour tous les membres
- Bibliothèque de templates approvés partagés entre membres
- Aperçu "conformité" : le manager peut voir si un post membre respecte les guidelines

**Dépend de :** Rien.

---

### I-3 — Facturation centralisée pour les agences *(L)*

**Problème :** Aujourd'hui chaque coach paie son abonnement individuellement. Les agences MLM veulent gérer la facturation de leurs distributeurs centralement.

**Ce qu'on ajoute :**
- Une agence peut "sponsoriser" le plan de ses membres (payer pour eux)
- Dashboard facturation agence : MRR payé par l'agence, répartition par membre
- Facturation Stripe unifiée : une seule facture pour N membres
- Gestion des départs : si un membre quitte l'agence, son plan revient à sa charge

**Dépend de :** Stripe prod activé, I-1.

---

## Chantier J — Intégrations Externes

*Connecter AuraPost à l'écosystème des outils que les coaches utilisent déjà.*

---

### J-1 — Google Calendar sync *(M)*

**Problème :** L'export iCal est unidirectionnel (AuraPost → calendrier). Les coaches veulent voir leurs sessions clients dans AuraPost.

**Ce qu'on ajoute :**
- OAuth Google Calendar dans les settings
- Affichage des événements Google Calendar dans le calendrier éditorial d'AuraPost
- Suggestion automatique : "Tu as une session lundi — on peut générer un post de recap pour le lendemain ?"

**Dépend de :** Google OAuth setup.

---

### J-2 — Zapier / Make (webhooks sortants) *(M)*

**Problème :** Les coaches qui utilisent des outils comme Notion, Airtable ou Slack veulent recevoir des données AuraPost sans passer par l'API.

**Ce qu'on ajoute :**
- Page `/dashboard/settings/integrations` : configurer des webhooks sortants
- Events disponibles : `post.approved`, `post.published`, `lead.captured`, `month.generated`
- Payload JSON standardisé, signature HMAC pour sécurité
- Intégration Zapier officielle (nécessite validation par Zapier — délai)

**Gating :** `pack_complet`.

**Dépend de :** Rien.

---

### J-3 — Import profil depuis Notion / LinkedIn PDF *(S)*

**Problème :** Les coaches ont déjà leur bio et leurs résultats documentés ailleurs (Notion, LinkedIn PDF export). Les resaisir dans AuraPost est fastidieux.

**Ce qu'on ajoute :**
- Upload d'un PDF ou d'un texte brut dans l'onboarding → Claude extrait les champs pertinents (nom, spécialité, bio, résultats, témoignages)
- Confirmation "Est-ce que ces informations sont correctes ?" avant de les sauvegarder
- Gain de temps significatif à l'onboarding

**Dépend de :** Rien.

---

### J-4 — API publique pour les coaches *(XL)*

**Problème :** Les coaches techniques (ou leurs développeurs) veulent accéder à leurs données AuraPost programmatiquement.

**Ce qu'on ajoute :**
- API REST publique : `/api/v1/posts`, `/api/v1/profile`, `/api/v1/analytics`
- Authentication par API key (générée dans les settings)
- Documentation API publique (Swagger/Redoc)
- Rate limiting par plan (100 req/h pour `content_only`, 1000 req/h pour `pack_complet`)
- SDK Node.js + Python (v2)

**Gating :** `pack_complet`.

**Dépend de :** Rien, mais effort XL.

---

## Chantier K — Modèle Économique

*Nouvelles sources de revenus et améliorations du système de plans.*

---

### K-1 — Plan annuel avec remise 20% *(S)*

**Problème :** `ANNUAL_DISCOUNT = 0.2` est déjà dans `lib/plans.ts` et `formatAnnualMonthly()` est implémenté, mais le plan annuel n'est pas exposé dans l'UI de pricing ni dans Stripe.

**Ce qu'on ajoute :**
- Toggle "Mensuel / Annuel" sur la page `/pricing` et dans `/dashboard/billing`
- Stripe : créer des Price IDs annuels pour les 2 plans
- Facturation annuelle via Stripe (une seule charge de 12× le tarif annuel)
- Badge "Économisez 20%" dans l'UI

**Dépend de :** Stripe prod activé.

---

### K-2 — Add-ons à la carte *(M)*

**Problème :** Certains coaches veulent ponctuellement plus que leur quota (ex: 5 éditions d'images supplémentaires ce mois-ci).

**Ce qu'on ajoute :**
- Add-on "Pack Images IA" : 10 crédits supplémentaires à 9,90€
- Add-on "Posts supplémentaires" : +6 posts pour le mois à 14,90€
- Add-on "Connexion sociale supplémentaire" : +1 compte Zernio à 4,90€/mois
- Achat via Stripe Payment Intent (pas d'abonnement, one-shot)
- Crédits stockés dans `tenants.addonsJson`

**Dépend de :** Stripe prod, E-1 (pour l'add-on images).

---

### K-3 — Plan "Agence White-Label" *(XL)*

**Problème :** Des agences de marketing veulent revendre AuraPost sous leur propre marque à leurs clients coaches.

**Ce qu'on ajoute :**
- Sous-domaine white-label : `app.agence-xyz.com` → interface AuraPost avec les couleurs de l'agence
- Logo + palette personnalisés par organisation
- Emails transactionnels rebrandés (expéditeur = l'agence)
- Prix de revente configurable (l'agence marge sur le prix AuraPost)
- Dashboard revenus pour l'agence

**Dépend de :** I-1, I-3, K-1.

---

### K-4 — LTV Booster — offre d'uprade contextuelle *(S)*

**Problème :** Les coaches `content_only` ne sont jamais sollicités pour upgrader sauf à la page billing. Manque de triggers contextuels.

**Ce qu'on ajoute :**
- Trigger : coach tente de publier directement (feature `pack_complet`) → modal "Passe à Coach+Site pour débloquer"
- Trigger : coach visite `/dashboard/social` → bandeau "Ta publication directe est à 1 clic"
- Trigger : coach atteint 3 mois consécutifs → email "Tu es régulier — voici ce que le plan supérieur t'apporterait"
- Tracking des triggers vus/cliqués pour optimiser les taux de conversion

**Dépend de :** Rien.

---

## Récapitulatif par priorité

### Court terme (< 1 mois)

| Réf | Chantier | Effort | Débloque |
|---|---|---|---|
| F-1 | Cookie attribution parrainage | XS | Conversions différées |
| F-2 | Email confirmation filleul | XS | UX parrainage |
| H-4 | Approbation groupée posts | S | Gain de temps coach |
| H-5 | Raccourcis clavier | XS | Power users |
| A-5 | Traduction automatique des posts | S | Coaches internationaux |
| K-1 | Plan annuel -20% | S | Revenus annuels |
| D-3 | Optimiseur de bio/headline | S | Valeur immédiate |
| D-5 | Générateur de hashtags | S | Valeur immédiate |
| K-4 | Upgrade contextuelle | S | LTV |
| G-4 | Rapport mensuel par email | S | Rétention |
| C-6 | Section tarifs site vitrine | S | Conversion site coach |
| E-1 | Édition IA images (mode manuel) | M+M | Feature promise pack_complet |

### Moyen terme (1–3 mois)

| Réf | Chantier | Effort | Débloque |
|---|---|---|---|
| C-1 | 4e style visuel | XL | Différenciation |
| C-2 | Domaine personnalisé | L | Premium feature |
| C-4 | Formulaire capture de leads | M | Valeur site vitrine |
| A-1 | TikTok + Twitter/X | M | Nouveaux réseaux |
| A-3 | Newsletter | M | Nouveau format |
| A-6 | Recyclage meilleurs posts | M | Réduction churn |
| D-1 | Scoring prédictif posts | L | Aide à la décision |
| G-5 | Admin métriques réelles | M | Pilotage business |
| H-1 | Onboarding vidéo interactif | M | Activation |
| H-2 | Notifications push PWA | L | Rétention |
| H-3 | Mode sombre | S | UX |
| B-2 | Stats publication Zernio | L | ROI publication |
| I-1 | Dashboard manager amélioré | L | Agences |
| K-2 | Add-ons à la carte | M | Revenu additionnel |

### Long terme (3 mois+)

| Réf | Chantier | Effort | Débloque |
|---|---|---|---|
| C-3 | Blog site vitrine | XL | SEO coach |
| C-5 | Chatbot IA site vitrine | XL | Conversion leads |
| C-7 | Portail client coaches | XL | Rétention clients coaches |
| A-2 | Séries thématiques | L | Contenu avancé |
| A-7 | Script Reels/vidéo | M | Format vidéo |
| B-1 | Planification native (queue) | XL | Publication automatisée |
| D-2 | Analyse concurrence | L | Intelligence marché |
| D-4 | Recommandations dynamiques | M | IA personnalisée |
| F-3 | Commission sur paiement | L | Affiliation v2 |
| F-4 | Programme Ambassadeur | XL | Growth |
| G-3 | Meta/Instagram Graph API | XL | Analytics sociaux natifs |
| H-6 | Support chat intégré | S | Rétention |
| I-3 | Facturation agence centralisée | L | B2B |
| J-1 | Google Calendar sync | M | Intégration écosystème |
| J-2 | Zapier/Make webhooks | M | Intégrations |
| J-3 | Import profil PDF/Notion | S | Onboarding |
| J-4 | API publique | XL | Ecosystem |
| K-3 | White-label agence | XL | B2B enterprise |

---

## Décisions produit encore en suspens

> Ces questions bloquent des chantiers entiers. Sans réponse, l'implémentation ne peut pas démarrer.

| ID | Question | Bloque |
|---|---|---|
| P1 | Modèle API édition image : FLUX.1 Kontext ou GPT Image 1.5 ? | E-1, E-2 |
| P2 | 4e style : nom, palette, niche, mood ? | C-1 |
| P3 | Affiliation : mois gratuit ou commission sur paiement ? | F-3, F-4 |
| P4 | Portail client coaches : fonctionnalité AuraPost ou partenariat Calendly ? | C-7 |
| P5 | API publique : priorité ou pas ? (effort XL) | J-4 |
| P6 | White-label : cibler des agences de coaching ou des réseaux MLM ? | K-3 |

---

*Document évolutif — à mettre à jour après chaque session de travail.*
