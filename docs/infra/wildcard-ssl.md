# Wildcard SSL `*.aurapost.fr` sur Netlify

> Objectif : que `<slug>.aurapost.fr` serve les sites coachs avec HTTPS.

---

## Architecture actuelle

Le middleware Next.js (`middleware.ts`) lit le header `x-forwarded-host` pour identifier le sous-domaine et router vers `app/site/[subdomain]/page.tsx`. Pour que ça fonctionne en prod, deux choses sont nécessaires :

1. Un enregistrement DNS wildcard `*.aurapost.fr` pointant vers Netlify
2. Un certificat SSL wildcard couvrant `*.aurapost.fr`

---

## Étape 1 — Wildcard DNS chez votre registrar

Chez votre fournisseur DNS (OVH, Cloudflare, Gandi…), ajouter :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| `CNAME` | `*.aurapost.fr` | `<votre-site>.netlify.app` | 300 |

> Si votre DNS est Cloudflare : désactiver le proxy (nuage orange → gris) pour le wildcard dans un premier temps — Netlify doit pouvoir valider le certificat.

---

## Étape 2 — Configurer le domaine sur Netlify

1. Netlify Dashboard → **Site → Domain management → Custom domains**
2. Cliquer **Add custom domain** → saisir `*.aurapost.fr`
3. Netlify propose de vérifier l'ownership via un enregistrement DNS TXT — ajouter-le chez votre registrar
4. Attendre la propagation DNS (5–30 min selon le TTL)

---

## Étape 3 — Certificat SSL wildcard (Let's Encrypt)

Netlify gère automatiquement Let's Encrypt pour les domaines custom. Mais un wildcard nécessite une validation DNS-01 (pas HTTP-01).

**Avec Netlify :**
Netlify génère automatiquement un certificat wildcard quand le domaine `*.aurapost.fr` est ajouté ET que le DNS wildcard est confirmé. Aucune action manuelle supplémentaire dans la plupart des cas.

> Si le certificat ne se génère pas après 24h : Dashboard → **Domain management → HTTPS → Verify DNS configuration** → forcer le renouvellement.

---

## Étape 4 — Vérifier le routage dans `netlify.toml`

S'assurer que `netlify.toml` inclut une règle de réécriture pour les sous-domaines :

```toml
[[redirects]]
  from = "https://:subdomain.aurapost.fr/*"
  to = "https://aurapost.fr/site/:subdomain/:splat"
  status = 200
  force = true
  conditions = {Host = ["*.aurapost.fr"]}
```

> Ou utiliser la configuration actuelle du middleware Next.js si le proxy Netlify passe le header `x-forwarded-host` — vérifier dans les logs que le header est bien transmis.

---

## Étape 5 — Test

```bash
# DNS propagé ?
dig CNAME coach-test.aurapost.fr

# HTTPS OK ?
curl -I https://coach-test.aurapost.fr

# Attendu : HTTP/2 200 (ou 404 si le sous-domaine n'existe pas en DB)
```

---

## Notes

- Let's Encrypt wildcard expire tous les 90 jours — Netlify renouvelle automatiquement
- Un sous-domaine inexistant en DB retourne `404` via `notFound()` dans Next.js (gating déjà en place)
- Les sous-domaines de test peuvent être ajoutés directement en DB (`websites.subdomain`)
