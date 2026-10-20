# Teranga Dev

**La plateforme d'entraide des développeurs africains — en français et en anglais.**
**The help network for African developers — in French and English.**

Projet CADEV 2026 (Coupe d'Afrique des Développeurs) — thème : *« Construire la plateforme d'échange africaine, pour les devs, par les devs. »*

## Le problème

L'Afrique compte des centaines de milliers de développeurs, mais l'entraide est coupée en deux par la langue : un dev de Dakar et un dev de Lagos résolvent les mêmes problèmes (paiement mobile, réseaux lents, appareils d'entrée de gamme) sans jamais se lire. Les plateformes mondiales sont en anglais et ignorent les réalités locales (M-Pesa, Wave, Orange Money, 2G/3G).

## La solution

| Fonctionnalité | Ce que ça fait |
|---|---|
| **Questions/réponses bilingues** | Chaque question et réponse est traduite automatiquement FR ⇄ EN. Le lecteur voit sa langue, avec « Voir l'original » en un clic. **Le code n'est jamais modifié** par la traduction. |
| **Réputation** | Votes et réponses acceptées construisent une réputation publique — un portfolio vérifiable. |
| **Échange de crédits** | Une réponse acceptée rapporte des crédits. Les crédits servent à réserver une session de mentorat / pair-programming avec un autre dev (crédits bloqués en séquestre, versés à la fin, remboursés en cas de refus). |
| **Classement par pays** | Classement panafricain et par pays — on code aussi pour le drapeau. |
| **Pensé pour l'Afrique** | Pages rendues côté serveur, très peu de JavaScript : fonctionne sur réseau lent et téléphone d'entrée de gamme. Les votes et formulaires marchent même sans JavaScript. |

## Démo

- Compte démo : `demo@teranga.dev` / `Demo2026!`
- Données de démonstration : 8 développeurs de 7 pays, questions réelles (React, M-Pesa, Flutter, NLP wolof/bambara, Laravel/Orange Money, Go).

## Architecture

```
Navigateur ──► Next.js 16 (App Router, Server Components, Server Actions)
                 │
                 ├─ src/lib/auth.ts        Data Access Layer : session → utilisateur courant
                 ├─ src/lib/session.ts     Cookie de session JWT signé (HS256), httpOnly, SameSite=Lax
                 ├─ src/server/services.ts Règles métier transactionnelles (votes, acceptation, séquestre)
                 ├─ src/server/rules.ts    Économie réputation/crédits (un seul fichier, facile à expliquer)
                 ├─ src/server/queries.ts  Lectures (liste, détail, profils, classements)
                 └─ src/lib/translate.ts   Traduction FR⇄EN (API Claude, sortie JSON structurée)
                 │
                 ▼
            PostgreSQL (Drizzle ORM) — PGlite embarqué en local, PostgreSQL managé Systalink en production
```

**Choix techniques à retenir (pour le jury)**

- **Intégrité des crédits** : chaque mouvement passe par une transaction ; le débit est une mise à jour conditionnelle (`credits >= montant`), donc impossible de passer en négatif même avec des requêtes simultanées (testé). Un registre `credit_ledger` en ajout seul trace chaque mouvement. Une contrainte `CHECK (credits >= 0)` en base sert de dernier filet.
- **Machine à états des sessions** : `pending → accepted → completed`, ou `declined/cancelled` avec remboursement. Chaque transition vérifie le rôle (mentor ou demandeur).
- **Votes** : un vote par utilisateur et par contenu (clé primaire composite), modifiable/annulable ; le score et la réputation sont mis à jour dans la même transaction. Impossible de voter pour soi.
- **Traduction asynchrone** : la traduction est lancée avec `after()` *après* l'envoi de la réponse HTTP — publier ne dépend jamais de l'API. Les traductions sont mises en cache en base (une ligne par contenu et par langue). Sans clé API, l'app fonctionne et affiche l'original.
- **Sécurité** :
  - Mots de passe bcrypt (coût 12), temps de réponse constant à la connexion (pas d'énumération des e-mails).
  - Limitation de débit sur inscription, connexion, publication, votes.
  - Validation de toutes les entrées avec Zod côté serveur.
  - Markdown rendu sans HTML brut puis assaini (`rehype-sanitize`) : pas de XSS ; liens en `rel="nofollow noopener"`.
  - Redirection après connexion limitée aux chemins internes (pas d'open redirect).
  - En-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
  - Le contenu traduit est traité comme donnée, jamais comme instruction (prompt système dédié).

## Lancer en local

```bash
npm install
npm run setup     # migrations + données de démo (base PGlite embarquée dans ./.data)
npm run dev       # http://localhost:3000
```

Aucune installation de PostgreSQL ni de Docker n'est nécessaire en local. Pour activer la traduction automatique, copier `.env.example` vers `.env.local` et renseigner `ANTHROPIC_API_KEY`.

```bash
npm test          # tests des règles métier sur un vrai Postgres en mémoire
npm run typecheck
npm run lint
```

## Déploiement (Systalink Datacloud)

Produits utilisés : **Serveur cloud** (application, image Docker) + **Base de données PostgreSQL** managée.

```bash
# 1. Migrations sur la base managée (depuis un poste avec accès réseau)
DATABASE_URL=postgres://... DATABASE_SSL=no-verify npm run db:migrate
DATABASE_URL=postgres://... npm run db:seed   # optionnel : données de démo

# 2. Image Docker sur le serveur cloud
docker build -t teranga-dev .
docker run -d --restart unless-stopped -p 80:3000 \
  -e DATABASE_URL=... -e DATABASE_SSL=no-verify \
  -e SESSION_SECRET=... -e ANTHROPIC_API_KEY=... \
  teranga-dev
```

`GET /api/health` vérifie l'application et la base (utilisé par le `HEALTHCHECK` Docker).

## Déclarations (article 6 du règlement CADEV)

### Composants tiers et licences

Toutes les dépendances livrées sont sous licence permissive. Principales dépendances directes :

| Composant | Licence | Rôle |
|---|---|---|
| next, react, react-dom | MIT | Framework web |
| drizzle-orm | Apache-2.0 | ORM / requêtes SQL typées |
| pg | MIT | Pilote PostgreSQL |
| @electric-sql/pglite | Apache-2.0 / PostgreSQL | Postgres embarqué (dev et tests) |
| zod | MIT | Validation |
| bcryptjs | MIT | Hachage des mots de passe |
| jose | MIT | Signature des cookies de session (JWT) |
| @anthropic-ai/sdk | MIT | Client de l'API de traduction |
| react-markdown, remark-gfm, rehype-sanitize, rehype-highlight | MIT | Rendu Markdown sûr + coloration du code |
| tailwindcss | MIT | Styles |
| Outils de dev : typescript (Apache-2.0), vitest (MIT), drizzle-kit (MIT), tsx (MIT), eslint (MIT) | | Non livrés en production |

Audit complet des 221 paquets de production : MIT, Apache-2.0, ISC, BSD, 0BSD, Unlicense, CC-BY-4.0 (données caniuse). **Aucun composant GPL/AGPL/LGPL n'est livré** : `sharp`/libvips (LGPL), dépendance *optionnelle* de Next.js, n'est pas utilisée (`images.unoptimized`) et est retirée de l'image Docker.

L'API Claude (Anthropic) est un service distant appelé via HTTP ; aucun code sous licence restrictive n'est intégré.

### Code préexistant

Aucun. Le projet a été créé intégralement pendant la compétition.

### Utilisation de l'intelligence artificielle

- **Outil** : Claude Code (Anthropic) comme assistant de programmation.
- **Parties concernées** : génération initiale de la structure du projet, du schéma de base, des services métier, des pages et des tests, puis revue et itérations par l'équipe.
- **Dans le produit** : l'API Claude traduit les contenus FR ⇄ EN (`src/lib/translate.ts`).
- L'équipe maîtrise et peut expliquer l'ensemble du code (voir la section *Architecture*).

## Équipe

<!-- À compléter : nom, rôle et pays de chaque membre -->
