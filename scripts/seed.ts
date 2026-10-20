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
  { username: "demo", name: "Démo Teranga", email: "demo@teranga.dev", country: "SN", lang: "fr", bio: "Compte de démonstration — explore librement !", skills: ["javascript", "react"] },
  { username: "awa_dev", name: "Awa Ndiaye", email: "awa@example.com", country: "SN", lang: "fr", bio: "Développeuse full-stack à Dakar. Next.js, Postgres, Wave API.", skills: ["nextjs", "postgresql", "typescript"] },
  { username: "chidi_codes", name: "Chidi Okafor", email: "chidi@example.com", country: "NG", lang: "en", bio: "Backend engineer in Lagos. Go, Kafka, fintech.", skills: ["go", "kafka", "fintech"] },
  { username: "kwame_k", name: "Kwame Mensah", email: "kwame@example.com", country: "GH", lang: "en", bio: "Mobile dev (Flutter) building for low-end Android.", skills: ["flutter", "dart", "android"] },
  { username: "fatou_ml", name: "Fatoumata Traoré", email: "fatou@example.com", country: "ML", lang: "fr", bio: "Data scientist, NLP pour les langues africaines.", skills: ["python", "nlp", "pytorch"] },
  { username: "wanjiru", name: "Wanjiru Kamau", email: "wanjiru@example.com", country: "KE", lang: "en", bio: "DevOps @ Nairobi. M-Pesa integrations, Kubernetes.", skills: ["kubernetes", "m-pesa", "terraform"] },
  { username: "yao_dev", name: "Yao Kouassi", email: "yao@example.com", country: "CI", lang: "fr", bio: "Laravel & Vue.js, Abidjan. Mentor à mes heures.", skills: ["laravel", "php", "vue"] },
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
