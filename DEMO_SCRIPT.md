# Script de démo — Pitch réseau / Herbalife (20 minutes)

> Pré-requis : `npm run seed:demo` exécuté (crée « Réseau Vitalité France » + 8 distributeurs)
> et les clés configurées (au minimum `ANTHROPIC_API_KEY` pour la génération en live).
> `DEMO_TOKEN` défini (sinon le token par défaut est `demo`).

| Temps | Action | URL |
|------|--------|-----|
| **0:00** | Ouvrir le deck de présentation (plein écran, navigation clavier) | `/pitch` |
| **2:00** | Cadrer le problème : « vos distributeurs publient en moyenne 0,3 fois/semaine, hors charte, parfois non conformes » | (deck) |
| **4:00** | Basculer sur la démo **réseau** | `/demo-live?token=DEMO_TOKEN&mode=agency` |
| **5:00** | Montrer le tableau de bord : **8 distributeurs, 3 états** (Actif / Inactif / Jamais connecté) → « on sait exactement qui utilise l'outil » | (agency) |
| **8:00** | Pointer **Marc Dupont** → son post en attente avec le badge **« Allégation : résultats garantis »** détecté automatiquement | (agency) |
| **10:00** | Expliquer la **file de validation** : le manager approuve/rejette avant publication, tout est tracé (audit log) | (agency) |
| **12:00** | Montrer le **reporting d'adoption** : 3 actifs / 8, 2 jamais connectés → relances J+1/3/7 automatiques | (agency) |
| **13:00** | Montrer le **brand kit** imposé (couleurs + mots interdits hérités par tous) | (agency) |
| **14:00** | Basculer sur la démo **coach** → générer 1 post **en live** (effet « wow ») | `/demo-live?token=DEMO_TOKEN&mode=coach` |
| **17:00** | Ouvrir le **calculateur de ROI** : 500 distributeurs = X € économisés vs agence | `/agency-pricing` |
| **19:00** | Conclure : **pilote payant 50 sièges à 490 €/mois**, déployable en une semaine | (deck) |

## Comptes de démonstration

- **Manager réseau** : `manager@reseau-vitalite.fr` / `Demo2024!`
- **Coachs solo** : `vincent.demo@aurapost.fr` (+ sophie/thomas) / `Demo!Aura2026`

## Points clés à marteler

1. **Conformité** : allégations interdites bloquées + validation manager + audit → couvre le risque juridique (la hantise n°1 d'un réseau MLM).
2. **Adoption mesurable** : on distingue « jamais connecté » de « inactif » — la seule métrique qui compte pour un acheteur réseau.
3. **Zéro effort distributeur** : 1ᵉʳ mois généré automatiquement à l'import, relances automatiques.
4. **Marque protégée** : brand kit hérité, templates validés.

## Ce qui n'est PAS encore livré (à dire honnêtement si demandé)

- Publication automatique Instagram/LinkedIn (roadmap — OAuth en cours).
- Analytics de performance sociale réels (portée/engagement).
- Facturation par siège Stripe (interface prête, branchement en cours).
