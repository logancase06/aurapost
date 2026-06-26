# Programme de parrainage AuraPost — Conditions générales

> **⚠️ BROUILLON — À FAIRE VALIDER PAR UN HUMAIN (idéalement un juriste) AVANT TOUTE PUBLICATION EN PAGE LÉGALE.**
> Ce document est une ébauche technique à valider. Il ne constitue pas un avis juridique.
> Ne pas publier comme page publique sans révision et validation explicite.

---

## 1. Objet

Le programme de parrainage AuraPost permet à tout utilisateur titulaire d'un compte actif (le « Parrain ») d'inviter d'autres coachs à rejoindre la plateforme (les « Filleuls »). En contrepartie d'un parrainage effectif, des avantages sont accordés aux deux parties selon les conditions ci-dessous.

---

## 2. Éligibilité

- **Parrain** : tout titulaire d'un compte AuraPost actif (non suspendu, non annulé).
- **Filleul** : toute personne qui s'inscrit sur AuraPost pour la première fois en utilisant un lien de parrainage valide.
- **Restriction** : l'auto-parrainage est techniquement interdit (un compte ne peut pas être son propre filleul).

---

## 3. Fonctionnement

1. Le Parrain obtient son lien de parrainage unique depuis `/dashboard/referral`.
2. Le Filleul s'inscrit via ce lien (ou à l'aide du code unique affiché dans le lien).
3. Dès validation de l'inscription du Filleul, les deux parties reçoivent l'avantage décrit à l'article 4.

---

## 4. Avantage accordé

- **Parrain** : extension de 1 mois gratuit sur son abonnement AuraPost, dans la limite de **[REFERRAL_MAX_MONTHS — actuellement 12] mois cumulés** via le programme de parrainage.
- **Filleul** : extension de 1 mois gratuit sur son premier compte, appliquée immédiatement à l'inscription.
- L'avantage est accordé en extension de la date d'expiration du plan (`planExpiresAt`) — il ne constitue pas un paiement ou un avoir monétaire.

> **Note interne** : si le modèle de récompense évolue vers des commissions monétaires (Stripe Connect), cette section devra être réécrite et validée par un comptable/juriste en raison des obligations déclaratives fiscales (seuil 600€/an en France).

---

## 5. Durée de validité du code

Le code de parrainage est valide **sans limite de durée** tant que le compte du Parrain est actif. AuraPost se réserve le droit de modifier cette durée avec un préavis de 30 jours.

---

## 6. Conditions de crédit

- L'avantage est accordé **dès l'inscription effective du Filleul** (création du compte), indépendamment de la souscription à un plan payant.
- En cas d'annulation du compte Filleul dans les 14 jours suivant l'inscription, AuraPost se réserve le droit de révoquer l'avantage accordé au Parrain (anti-abus).

> **À trancher** : Souhaitez-vous conditionner le crédit Parrain au premier paiement du Filleul plutôt qu'à l'inscription ? Cela implique une modification du code (Phase R-3 de `docs/roadmap-affiliation.md`).

---

## 7. Abus et fraude

AuraPost se réserve le droit de :
- Désactiver un code de parrainage en cas d'utilisation abusive (inscriptions fictives, spam, etc.).
- Révoquer les avantages accordés à la suite d'abus constatés.
- Suspendre un compte utilisateur en cas de fraude caractérisée.

---

## 8. Modification du programme

AuraPost peut modifier les conditions du programme (avantages, plafonds, conditions d'éligibilité) à tout moment, avec un préavis de **30 jours** communiqué par email et/ou dans le dashboard. Les parrainages déjà crédités avant la modification restent acquis.

---

## 9. Absence de caractère monétaire

L'avantage accordé est exclusivement une extension de période d'abonnement. Il ne constitue pas une rémunération, une commission commerciale ou un avoir monétaire, et n'est pas convertible en espèces. Il n'est pas cessible et s'éteint en cas de fermeture du compte.

---

## 10. Droit applicable

Ce programme est régi par le droit français. Tout litige sera soumis aux tribunaux compétents de [ville du siège social d'AuraPost — à compléter].

---

*Dernière mise à jour du brouillon : 2026-06-26*
*Statut : BROUILLON — non publié, non engageant*
