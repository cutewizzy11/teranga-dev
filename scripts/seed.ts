/**
 * Seeds a realistic bilingual demo community. Translations are written by hand here so the
 * demo works without an Anthropic API key; in production they are generated on post.
 * Usage: npm run db:seed   (refuses to run on a non-empty database unless SEED_FORCE=1)
 */
import bcrypt from "bcryptjs";
import { count, sql } from "drizzle-orm";
import { createDb } from "@/db/client";
import { answers, questions, translations, users } from "@/db/schema";
import { acceptAnswer, castVote, requestHelpSession, transitionHelpSession } from "@/server/services";

const db = createDb();

const PEOPLE = [
  { username: "demo", name: "Demo Teranga", email: "demo@teranga.dev", country: "NG", lang: "en", bio: "Demo account — explore freely!", skills: ["javascript", "react"] },
  { username: "awa_dev", name: "Awa Ndiaye", email: "awa@example.com", country: "SN", lang: "fr", bio: "Développeuse full-stack à Dakar. Next.js, Postgres, Wave API.", skills: ["nextjs", "postgresql", "typescript"] },
  { username: "chidi_codes", name: "Chidi Okafor", email: "chidi@example.com", country: "NG", lang: "en", bio: "Backend engineer in Lagos. Go, Kafka, fintech.", skills: ["go", "kafka", "fintech"] },
  { username: "kwame_k", name: "Kwame Mensah", email: "kwame@example.com", country: "GH", lang: "en", bio: "Mobile dev (Flutter) building for low-end Android.", skills: ["flutter", "dart", "android"] },
  { username: "fatou_ml", name: "Fatoumata Traoré", email: "fatou@example.com", country: "ML", lang: "fr", bio: "Data scientist, NLP pour les langues africaines.", skills: ["python", "nlp", "pytorch"] },
  { username: "wanjiru", name: "Wanjiru Kamau", email: "wanjiru@example.com", country: "KE", lang: "en", bio: "DevOps @ Nairobi. M-Pesa integrations, Kubernetes.", skills: ["kubernetes", "m-pesa", "terraform"] },
  { username: "yao_dev", name: "Yao Kouassi", email: "yao@example.com", country: "CI", lang: "fr", bio: "Laravel & Vue.js, Abidjan. Mentor à mes heures.", skills: ["laravel", "php", "vue"] },
  { username: "tunde_dev", name: "Tunde Adeyemi", email: "tunde@example.com", country: "NG", lang: "en", bio: "Backend engineer in Lagos. Payments, Node.js, Paystack & Flutterwave integrations.", skills: ["node", "paystack", "postgresql"] },
  { username: "ngozi_ai", name: "Ngozi Eze", email: "ngozi@example.com", country: "NG", lang: "en", bio: "ML engineer in Enugu building speech models for Igbo, Yoruba and Hausa.", skills: ["python", "speech", "pytorch"] },
  { username: "aisha_codes", name: "Aisha Bello", email: "aisha@example.com", country: "NG", lang: "en", bio: "Flutter & offline-first apps from Kano. GDG organizer.", skills: ["flutter", "offline-first", "firebase"] },
  { username: "emeka_ops", name: "Emeka Okonkwo", email: "emeka@example.com", country: "NG", lang: "en", bio: "DevOps in Abuja. Making servers survive power cuts.", skills: ["linux", "docker", "aws"] },
  { username: "nadia_cm", name: "Nadia Mbarga", email: "nadia@example.com", country: "CM", lang: "fr", bio: "Ingénieure sécurité applicative à Douala.", skills: ["security", "owasp", "node"] },
] as const;

type Post = { lang: "fr" | "en"; title?: string; body: string; tTitle?: string; tBody: string };

const QA: { author: string; tags: string[]; q: Post; answers: (Post & { author: string; accepted?: boolean; votes?: number })[]; votes: number }[] = [
  {
    author: "awa_dev",
    tags: ["react", "nextjs"],
    votes: 5,
    q: {
      lang: "fr",
      title: "Pourquoi mon useEffect s'exécute deux fois en développement ?",
      body: "Dans mon app Next.js, ce code appelle mon API deux fois au chargement :\n\n```tsx\nuseEffect(() => {\n  fetch('/api/paiements').then(r => r.json()).then(setData)\n}, [])\n```\n\nEn production ça n'arrive pas. Est-ce un bug ?",
      tTitle: "Why does my useEffect run twice in development?",
      tBody: "In my Next.js app, this code calls my API twice on load:\n\n```tsx\nuseEffect(() => {\n  fetch('/api/paiements').then(r => r.json()).then(setData)\n}, [])\n```\n\nIt doesn't happen in production. Is it a bug?",
    },
    answers: [
      {
        author: "chidi_codes", lang: "en", accepted: true, votes: 4,
        body: "Not a bug — that's React **Strict Mode**. In development React mounts, unmounts and re-mounts every component once to surface effects that don't clean up properly.\n\nThe fix is to make the effect safe to run twice, e.g. abort the first request:\n\n```tsx\nuseEffect(() => {\n  const ctrl = new AbortController()\n  fetch('/api/paiements', { signal: ctrl.signal })\n    .then(r => r.json())\n    .then(setData)\n    .catch(() => {})\n  return () => ctrl.abort()\n}, [])\n```\n\nBetter still: fetch on the server in a Server Component and skip the effect entirely.",
        tBody: "Ce n'est pas un bug — c'est le **Strict Mode** de React. En développement, React monte, démonte puis remonte chaque composant une fois pour révéler les effets qui ne se nettoient pas correctement.\n\nLa solution est de rendre l'effet sûr à exécuter deux fois, par exemple en annulant la première requête :\n\n```tsx\nuseEffect(() => {\n  const ctrl = new AbortController()\n  fetch('/api/paiements', { signal: ctrl.signal })\n    .then(r => r.json())\n    .then(setData)\n    .catch(() => {})\n  return () => ctrl.abort()\n}, [])\n```\n\nEncore mieux : récupère les données côté serveur dans un Server Component et supprime complètement l'effet.",
      },
    ],
  },
  {
    author: "wanjiru",
    tags: ["m-pesa", "webhooks", "node"],
    votes: 4,
    q: {
      lang: "en",
      title: "How do I make M-Pesa STK Push callbacks idempotent?",
      body: "Safaricom sometimes sends the same STK Push callback 2–3 times. My handler credits the user's wallet each time. What's the right pattern to process each payment exactly once?",
      tTitle: "Comment rendre idempotents les callbacks M-Pesa STK Push ?",
      tBody: "Safaricom envoie parfois le même callback STK Push 2 à 3 fois. Mon handler crédite le portefeuille de l'utilisateur à chaque fois. Quel est le bon pattern pour traiter chaque paiement exactement une fois ?",
    },
    answers: [
      {
        author: "nadia_cm", lang: "fr", accepted: true, votes: 3,
        body: "Utilise le `CheckoutRequestID` comme clé d'idempotence avec une contrainte d'unicité en base, et fais le crédit dans la **même transaction** :\n\n```sql\nCREATE TABLE mpesa_callbacks (\n  checkout_request_id text PRIMARY KEY,\n  processed_at timestamptz NOT NULL DEFAULT now()\n);\n```\n\n```ts\nawait db.transaction(async (tx) => {\n  const inserted = await tx.insert(mpesaCallbacks)\n    .values({ checkoutRequestId: id })\n    .onConflictDoNothing()\n    .returning()\n  if (inserted.length === 0) return // déjà traité\n  await creditWallet(tx, userId, amount)\n})\n```\n\nRéponds toujours `200` à Safaricom, même pour un doublon, sinon ils réessaient.",
        tBody: "Use the `CheckoutRequestID` as an idempotency key with a unique constraint in the database, and do the credit in the **same transaction**:\n\n```sql\nCREATE TABLE mpesa_callbacks (\n  checkout_request_id text PRIMARY KEY,\n  processed_at timestamptz NOT NULL DEFAULT now()\n);\n```\n\n```ts\nawait db.transaction(async (tx) => {\n  const inserted = await tx.insert(mpesaCallbacks)\n    .values({ checkoutRequestId: id })\n    .onConflictDoNothing()\n    .returning()\n  if (inserted.length === 0) return // déjà traité\n  await creditWallet(tx, userId, amount)\n})\n```\n\nAlways reply `200` to Safaricom, even for a duplicate, otherwise they retry.",
      },
    ],
  },
  {
    author: "kwame_k",
    tags: ["flutter", "android", "performance"],
    votes: 3,
    q: {
      lang: "en",
      title: "Reducing Flutter APK size for users on 2G/3G",
      body: "Our release APK is 38 MB and many users in rural Ghana give up downloading it. What are the most effective ways to shrink a Flutter app?",
      tTitle: "Réduire la taille de l'APK Flutter pour les utilisateurs en 2G/3G",
      tBody: "Notre APK de release fait 38 Mo et beaucoup d'utilisateurs dans le Ghana rural abandonnent le téléchargement. Quelles sont les méthodes les plus efficaces pour réduire une app Flutter ?",
    },
    answers: [
      {
        author: "yao_dev", lang: "fr", votes: 2,
        body: "Les trois gains les plus importants chez nous :\n\n1. **Split par ABI** : `flutter build apk --split-per-abi` — chaque APK ne contient qu'une architecture (≈ -60 %).\n2. Publier un **App Bundle** (`.aab`) sur le Play Store, qui fait ce découpage automatiquement.\n3. `--obfuscate --split-debug-info=build/symbols` et compresser les images en WebP.\n\nOn est passé de 41 Mo à 14 Mo.",
        tBody: "The three biggest wins for us:\n\n1. **Split per ABI**: `flutter build apk --split-per-abi` — each APK contains only one architecture (≈ -60%).\n2. Publish an **App Bundle** (`.aab`) on the Play Store, which does this split automatically.\n3. `--obfuscate --split-debug-info=build/symbols` and compress images to WebP.\n\nWe went from 41 MB to 14 MB.",
      },
      {
        author: "chidi_codes", lang: "en", votes: 1,
        body: "Also audit your dependencies with `flutter build apk --analyze-size`. A single icon font package was 4 MB for us — we replaced it with the handful of SVGs we actually used.",
        tBody: "Vérifie aussi tes dépendances avec `flutter build apk --analyze-size`. Chez nous, un seul package de police d'icônes pesait 4 Mo — on l'a remplacé par les quelques SVG qu'on utilisait vraiment.",
      },
    ],
  },
  {
    author: "fatou_ml",
    tags: ["python", "nlp"],
    votes: 2,
    q: {
      lang: "fr",
      title: "Quel tokenizer pour du texte en wolof et bambara ?",
      body: "Je fine-tune un modèle de classification sur des messages WhatsApp en wolof et bambara. Les tokenizers pré-entraînés découpent très mal les mots. Faut-il entraîner un tokenizer SentencePiece dédié ?",
      tTitle: "Which tokenizer for Wolof and Bambara text?",
      tBody: "I'm fine-tuning a classification model on WhatsApp messages in Wolof and Bambara. Pre-trained tokenizers split the words very badly. Should I train a dedicated SentencePiece tokenizer?",
    },
    answers: [],
  },
  {
    author: "yao_dev",
    tags: ["laravel", "php", "security"],
    votes: 2,
    q: {
      lang: "fr",
      title: "Stocker les clés API Orange Money dans Laravel en production",
      body: "Où mettre les clés API Orange Money sur un VPS ? Le `.env` est-il suffisant ou faut-il un coffre-fort de secrets ?",
      tTitle: "Storing Orange Money API keys in Laravel in production",
      tBody: "Where should Orange Money API keys go on a VPS? Is the `.env` file enough, or do I need a secrets vault?",
    },
    answers: [
      {
        author: "nadia_cm", lang: "fr", accepted: true, votes: 2,
        body: "Le `.env` est acceptable **si** :\n\n- il est hors du dossier public et en `chmod 600`, propriétaire = l'utilisateur PHP-FPM ;\n- il n'est jamais commité (`.gitignore`) ;\n- tu lances `php artisan config:cache` pour ne pas relire le fichier à chaque requête.\n\nPour aller plus loin : injecte les variables via systemd (`EnvironmentFile=`) et fais une rotation des clés tous les 90 jours.",
        tBody: "The `.env` file is acceptable **if**:\n\n- it lives outside the public folder with `chmod 600`, owned by the PHP-FPM user;\n- it is never committed (`.gitignore`);\n- you run `php artisan config:cache` so the file isn't re-read on every request.\n\nTo go further: inject the variables through systemd (`EnvironmentFile=`) and rotate the keys every 90 days.",
      },
    ],
  },
  {
    author: "chidi_codes",
    tags: ["go", "postgresql"],
    votes: 1,
    q: {
      lang: "en",
      title: "Go + pgx: connection pool exhausted under load",
      body: "Under ~300 req/s our Go service starts failing with `failed to acquire connection`. Pool `MaxConns` is 10. Should I just raise it?",
      tTitle: "Go + pgx : pool de connexions épuisé sous charge",
      tBody: "À environ 300 req/s, notre service Go commence à échouer avec `failed to acquire connection`. Le `MaxConns` du pool est à 10. Faut-il simplement l'augmenter ?",
    },
    answers: [
      {
        author: "awa_dev", lang: "fr", votes: 2,
        body: "Avant d'augmenter, vérifie que tu libères bien les connexions : un `rows` non fermé garde la connexion. Toujours :\n\n```go\nrows, err := pool.Query(ctx, q)\nif err != nil { return err }\ndefer rows.Close()\n```\n\nEnsuite, la règle pratique : `MaxConns ≈ (cœurs CPU de Postgres × 2) + disques`. Et ajoute un `context.WithTimeout` pour échouer vite au lieu d'empiler.",
        tBody: "Before raising it, check that you release connections properly: an unclosed `rows` keeps the connection. Always:\n\n```go\nrows, err := pool.Query(ctx, q)\nif err != nil { return err }\ndefer rows.Close()\n```\n\nThen the rule of thumb: `MaxConns ≈ (Postgres CPU cores × 2) + disks`. And add a `context.WithTimeout` to fail fast instead of piling up.",
      },
    ],
  },
  {
    author: "tunde_dev",
    tags: ["paystack", "node", "webhooks", "security"],
    votes: 6,
    q: {
      lang: "en",
      title: "How do I verify Paystack webhook signatures in Express?",
      body: "My Express endpoint receives Paystack `charge.success` events, but anyone could POST fake events to it. Paystack sends an `x-paystack-signature` header — how do I verify it correctly?\n\n```js\napp.post('/webhooks/paystack', express.json(), (req, res) => {\n  // how do I check the signature here?\n})\n```",
      tTitle: "Comment vérifier la signature des webhooks Paystack dans Express ?",
      tBody: "Mon endpoint Express reçoit les événements Paystack `charge.success`, mais n'importe qui pourrait y envoyer de faux événements. Paystack envoie un en-tête `x-paystack-signature` — comment le vérifier correctement ?\n\n```js\napp.post('/webhooks/paystack', express.json(), (req, res) => {\n  // how do I check the signature here?\n})\n```",
    },
    answers: [
      {
        author: "nadia_cm", lang: "fr", accepted: true, votes: 5,
        body: "La signature est un **HMAC SHA-512** du corps *brut* de la requête, calculé avec ta clé secrète. Deux pièges : il faut le corps brut (pas le JSON re-sérialisé), et la comparaison doit se faire en temps constant.\n\n```js\nimport crypto from 'node:crypto'\n\napp.post('/webhooks/paystack', express.raw({ type: 'application/json' }), (req, res) => {\n  const expected = crypto\n    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)\n    .update(req.body)\n    .digest('hex')\n  const received = req.get('x-paystack-signature') ?? ''\n  const ok = received.length === expected.length &&\n    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))\n  if (!ok) return res.sendStatus(401)\n\n  const event = JSON.parse(req.body)\n  // process idempotently, keyed by event.data.reference\n  res.sendStatus(200)\n})\n```\n\nVérifie aussi toujours la transaction côté serveur avec `GET /transaction/verify/:reference` avant de livrer la commande.",
        tBody: "The signature is an **HMAC SHA-512** of the *raw* request body, computed with your secret key. Two traps: you need the raw body (not re-serialized JSON), and the comparison must be constant-time.\n\n```js\nimport crypto from 'node:crypto'\n\napp.post('/webhooks/paystack', express.raw({ type: 'application/json' }), (req, res) => {\n  const expected = crypto\n    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)\n    .update(req.body)\n    .digest('hex')\n  const received = req.get('x-paystack-signature') ?? ''\n  const ok = received.length === expected.length &&\n    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))\n  if (!ok) return res.sendStatus(401)\n\n  const event = JSON.parse(req.body)\n  // process idempotently, keyed by event.data.reference\n  res.sendStatus(200)\n})\n```\n\nAlso always verify the transaction server-side with `GET /transaction/verify/:reference` before delivering the order.",
      },
    ],
  },
  {
    author: "chidi_codes",
    tags: ["payments", "flutterwave", "paystack"],
    votes: 4,
    q: {
      lang: "en",
      title: "Paystack or Flutterwave for an app selling in Nigeria and Côte d'Ivoire?",
      body: "We're launching in Lagos first, then Abidjan. Which payment provider handles both markets best — cards, bank transfer and mobile money?",
      tTitle: "Paystack ou Flutterwave pour une app qui vend au Nigeria et en Côte d'Ivoire ?",
      tBody: "Nous lançons d'abord à Lagos, puis à Abidjan. Quel prestataire de paiement gère le mieux les deux marchés — cartes, virement bancaire et mobile money ?",
    },
    answers: [
      {
        author: "yao_dev", lang: "fr", accepted: true, votes: 4,
        body: "À Abidjan, l'essentiel des paiements passe par le **mobile money** (Orange Money, MTN MoMo, Wave), pas par la carte. D'expérience :\n\n- **Flutterwave** couvre le Nigeria *et* le mobile money ivoirien avec une seule intégration.\n- **Paystack** est excellent au Nigeria (virement, USSD, cartes), mais vérifie la couverture XOF avant de t'engager.\n- Beaucoup d'équipes gardent Paystack au Nigeria et ajoutent **CinetPay** pour l'Afrique francophone.\n\nConseil : cache le prestataire derrière une interface `PaymentProvider` dès le départ — en changer plus tard coûtera beaucoup moins cher.",
        tBody: "In Abidjan, most payments go through **mobile money** (Orange Money, MTN MoMo, Wave), not cards. From experience:\n\n- **Flutterwave** covers Nigeria *and* Ivorian mobile money with a single integration.\n- **Paystack** is excellent in Nigeria (transfer, USSD, cards), but check XOF coverage before committing.\n- Many teams keep Paystack in Nigeria and add **CinetPay** for French-speaking Africa.\n\nTip: hide the provider behind a `PaymentProvider` interface from day one — switching later will cost far less.",
      },
      {
        author: "tunde_dev", lang: "en", votes: 2,
        body: "+1 to the abstraction. Also plan for **bank transfer** in Nigeria: a big share of our checkout volume is pay-with-transfer through dedicated virtual accounts.",
        tBody: "+1 pour l'abstraction. Prévois aussi le **virement bancaire** au Nigeria : une grande partie de nos paiements passe par le virement vers des comptes virtuels dédiés.",
      },
    ],
  },
  {
    author: "aisha_codes",
    tags: ["offline-first", "flutter", "sync"],
    votes: 5,
    q: {
      lang: "en",
      title: "Offline-first sync strategy for unstable power and network?",
      body: "Our field-agent app in Kano must keep working through hours of power cuts and dead network, then sync when back online. How do you avoid duplicate or lost records when syncing?",
      tTitle: "Stratégie de synchronisation hors ligne pour une électricité et un réseau instables ?",
      tBody: "Notre application pour agents de terrain à Kano doit continuer à fonctionner pendant des heures de coupures de courant et de réseau, puis se synchroniser au retour en ligne. Comment éviter les doublons ou les pertes d'enregistrements pendant la synchronisation ?",
    },
    answers: [
      {
        author: "awa_dev", lang: "fr", accepted: true, votes: 3,
        body: "Le pattern qui marche chez nous :\n\n1. **ID généré côté client** (UUID v7) pour chaque enregistrement — le serveur fait un `INSERT ... ON CONFLICT`, donc renvoyer deux fois ne crée jamais de doublon.\n2. Une **file d'envoi locale** (SQLite/Drift) : on n'efface une entrée qu'après l'accusé de réception du serveur.\n3. Envoi **par petits lots** (ex. 50) avec reprise exponentielle — une connexion 2G qui coupe ne perd qu'un lot.\n4. Pour les conflits de modification : `updated_at` et la règle « la dernière écriture gagne ».\n\n```sql\nINSERT INTO visits (id, agent_id, data, updated_at)\nVALUES ($1, $2, $3, $4)\nON CONFLICT (id) DO UPDATE\n  SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at\n  WHERE visits.updated_at < EXCLUDED.updated_at;\n```",
        tBody: "The pattern that works for us:\n\n1. **Client-generated ID** (UUID v7) for every record — the server does `INSERT ... ON CONFLICT`, so sending twice never creates a duplicate.\n2. A **local outbox** (SQLite/Drift): an entry is only deleted after the server acknowledges it.\n3. Send in **small batches** (e.g. 50) with exponential retry — a dropping 2G connection only loses one batch.\n4. For edit conflicts: `updated_at` and a \"last write wins\" rule.\n\n```sql\nINSERT INTO visits (id, agent_id, data, updated_at)\nVALUES ($1, $2, $3, $4)\nON CONFLICT (id) DO UPDATE\n  SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at\n  WHERE visits.updated_at < EXCLUDED.updated_at;\n```",
      },
    ],
  },
  {
    author: "emeka_ops",
    tags: ["typescript", "validation"],
    votes: 3,
    q: {
      lang: "en",
      title: "Normalizing Nigerian phone numbers (+234) in TypeScript",
      body: "Users type `08031234567`, `+2348031234567`, `2348031234567` or `0803 123 4567`. What's a robust way to normalize these to E.164 before sending OTPs?",
      tTitle: "Normaliser les numéros de téléphone nigérians (+234) en TypeScript",
      tBody: "Les utilisateurs saisissent `08031234567`, `+2348031234567`, `2348031234567` ou `0803 123 4567`. Quelle est une méthode robuste pour les normaliser au format E.164 avant d'envoyer des OTP ?",
    },
    answers: [
      {
        author: "fatou_ml", lang: "fr", votes: 2,
        body: "Retire tout sauf les chiffres, puis gère les trois formes possibles. Les numéros mobiles nigérians ont 10 chiffres après l'indicatif :\n\n```ts\nexport function toE164NG(input: string): string | null {\n  const d = input.replace(/\\D/g, '')\n  const local =\n    d.startsWith('234') ? d.slice(3) :\n    d.startsWith('0') ? d.slice(1) : d\n  return /^[789][01]\\d{8}$/.test(local) ? `+234${local}` : null\n}\n```\n\nPour un produit multi-pays, utilise plutôt `libphonenumber-js` (licence MIT).",
        tBody: "Strip everything except digits, then handle the three possible forms. Nigerian mobile numbers have 10 digits after the country code:\n\n```ts\nexport function toE164NG(input: string): string | null {\n  const d = input.replace(/\\D/g, '')\n  const local =\n    d.startsWith('234') ? d.slice(3) :\n    d.startsWith('0') ? d.slice(1) : d\n  return /^[789][01]\\d{8}$/.test(local) ? `+234${local}` : null\n}\n```\n\nFor a multi-country product, use `libphonenumber-js` instead (MIT licence).",
      },
    ],
  },
  {
    author: "ngozi_ai",
    tags: ["python", "speech", "nlp"],
    votes: 4,
    q: {
      lang: "en",
      title: "Speech-to-text for Hausa, Yoruba and Igbo with little data?",
      body: "I have about 40 hours of transcribed audio across Hausa, Yoruba and Igbo. Is it better to fine-tune one multilingual model or three separate ones? Tonal diacritics in Yoruba are a big problem.",
      tTitle: "Reconnaissance vocale pour le haoussa, le yoruba et l'igbo avec peu de données ?",
      tBody: "J'ai environ 40 heures d'audio transcrit en haoussa, yoruba et igbo. Vaut-il mieux fine-tuner un seul modèle multilingue ou trois modèles séparés ? Les diacritiques tonals du yoruba posent un gros problème.",
    },
    answers: [],
  },
];

async function main() {
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n > 0 && process.env.SEED_FORCE !== "1") {
    console.log(`Database already has ${n} users — skipping seed (set SEED_FORCE=1 to wipe and reseed).`);
    return;
  }
  if (n > 0) {
    await db.execute(sql`truncate users, questions, answers, translations, votes, help_sessions, credit_ledger restart identity cascade`);
  }

  const demoHash = await bcrypt.hash("Demo2026!", 12);
  const otherHash = await bcrypt.hash(crypto.randomUUID(), 12); // seeded community accounts cannot be logged into
  const ids = new Map<string, number>();
  for (const p of PEOPLE) {
    const [u] = await db
      .insert(users)
      .values({ ...p, skills: [...p.skills], passwordHash: p.username === "demo" ? demoHash : otherHash, credits: 5 })
      .returning({ id: users.id });
    ids.set(p.username, u.id);
  }
  const voters = [...ids.values()];

  for (const item of QA) {
    const authorId = ids.get(item.author)!;
    const [q] = await db
      .insert(questions)
      .values({ authorId, title: item.q.title!, body: item.q.body, lang: item.q.lang, tags: item.tags, answerCount: item.answers.length })
      .returning({ id: questions.id });
    await db.insert(translations).values({ entityType: "question", entityId: q.id, targetLang: item.q.lang === "fr" ? "en" : "fr", title: item.q.tTitle, body: item.q.tBody });
    for (const v of voters.filter((id) => id !== authorId).slice(0, item.votes)) await castVote(db, v, "question", q.id, 1);

    for (const a of item.answers) {
      const aid = ids.get(a.author)!;
      const [row] = await db.insert(answers).values({ questionId: q.id, authorId: aid, body: a.body, lang: a.lang }).returning({ id: answers.id });
      await db.insert(translations).values({ entityType: "answer", entityId: row.id, targetLang: a.lang === "fr" ? "en" : "fr", body: a.tBody });
      for (const v of voters.filter((id) => id !== aid).slice(0, a.votes ?? 0)) await castVote(db, v, "answer", row.id, 1);
      if (a.accepted) await acceptAnswer(db, authorId, row.id);
    }
  }

  // A few help sessions so the exchange feature is visible in the demo account.
  const demo = ids.get("demo")!;
  await requestHelpSession(db, ids.get("kwame_k")!, { mentorId: demo, topic: "Code review of my React Native login screen", message: "30 min on Google Meet?", credits: 2 });
  const s2 = await requestHelpSession(db, demo, { mentorId: ids.get("nadia_cm")!, topic: "Audit sécurité de mon API Express", message: "Surtout l'authentification JWT.", credits: 3 });
  await transitionHelpSession(db, ids.get("nadia_cm")!, s2.id, "accept");

  console.log(`✓ seeded ${PEOPLE.length} developers, ${QA.length} questions`);
  console.log("  demo login: demo@teranga.dev / Demo2026!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
