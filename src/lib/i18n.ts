import type { Lang } from "@/db/schema";

export const LANGS: Lang[] = ["fr", "en"];

const fr = {
  brand: "Teranga Dev",
  tagline: "La plateforme d'entraide des développeurs africains — en français et en anglais.",
  nav: { questions: "Questions", ask: "Poser une question", leaderboard: "Classement", sessions: "Mes sessions", login: "Connexion", signup: "Créer un compte", logout: "Déconnexion" },
  hero: {
    title: "Pose ta question en français. Reçois la réponse de Lagos.",
    subtitle: "Chaque question et chaque réponse est traduite automatiquement entre le français et l'anglais. Un seul réseau pour tous les devs d'Afrique.",
    cta: "Rejoindre la communauté",
    browse: "Parcourir les questions",
  },
  home: {
    eyebrow: "L'entraide des devs africains",
    titleA: "Pose ta question en français.",
    titleB: "Reçois la réponse de Lagos.",
    from: "Des devs de",
    topDevs: "Top contributeurs",
    allRanking: "Voir le classement",
    popular: "Tags populaires",
    ctaTitle: "Ton prochain bug a déjà été résolu à Abidjan.",
    ctaBody: "Rejoins les développeurs qui s'entraident par-delà les langues et les frontières.",
    viewAll: "Toutes les questions",
  },
  how: {
    title: "Comment ça marche",
    s1t: "Demande", s1: "Pose ta question dans ta langue. Le code n'est jamais modifié par la traduction.",
    s2t: "Partage", s2: "Réponds aux autres, gagne de la réputation et des crédits quand ta réponse est acceptée.",
    s3t: "Échange", s3: "Dépense tes crédits pour réserver une session de mentorat ou de pair-programming.",
  },
  stats: { devs: "développeurs", questions: "questions", answers: "réponses", countries: "pays" },
  q: {
    latest: "Dernières questions", search: "Rechercher…", answers: "réponses", votes: "votes", noResults: "Aucune question trouvée.",
    title: "Titre", body: "Détails (Markdown supporté)", tags: "Tags (séparés par des virgules)", submit: "Publier",
    yourAnswer: "Ta réponse", postAnswer: "Publier la réponse", accept: "Accepter cette réponse", accepted: "Réponse acceptée",
    translated: "Traduit automatiquement de l'anglais", showOriginal: "Voir l'original", showTranslation: "Voir la traduction",
    askedBy: "par", loginToAnswer: "Connecte-toi pour répondre.", unanswered: "Sans réponse",
  },
  profile: { reputation: "réputation", credits: "crédits", skills: "Compétences", book: "Réserver une session", topic: "Sujet", message: "Message", offer: "Crédits offerts", send: "Envoyer la demande", loginToBook: "Connecte-toi pour réserver une session.", noCredits: "Tu n'as plus de crédits. Réponds à des questions pour en gagner.", questions: "Questions", answers: "Réponses" },
  sessions: { incoming: "Demandes reçues", outgoing: "Mes demandes", none: "Aucune session pour l'instant.", accept: "Accepter", decline: "Refuser", cancel: "Annuler", complete: "Marquer comme terminée", status: { pending: "En attente", accepted: "Acceptée", completed: "Terminée", declined: "Refusée", cancelled: "Annulée" } },
  board: { title: "Classement", global: "Afrique", byCountry: "Par pays", country: "Pays", devs: "devs", rep: "réputation" },
  auth: { username: "Nom d'utilisateur", name: "Nom complet", email: "E-mail", password: "Mot de passe", country: "Pays", lang: "Langue préférée", login: "Se connecter", signup: "Créer mon compte", haveAccount: "Déjà inscrit ?", noAccount: "Pas encore de compte ?", demo: "Essayer avec le compte démo" },
} as const;

type Dict = { [K in keyof typeof fr]: (typeof fr)[K] extends string ? string : { [P in keyof (typeof fr)[K]]: (typeof fr)[K][P] extends string ? string : Record<string, string> } };

const en: Dict = {
  brand: "Teranga Dev",
  tagline: "The help network for African developers — in French and English.",
  nav: { questions: "Questions", ask: "Ask a question", leaderboard: "Leaderboard", sessions: "My sessions", login: "Log in", signup: "Sign up", logout: "Log out" },
  hero: {
    title: "Ask in English. Get the answer from Dakar.",
    subtitle: "Every question and answer is translated automatically between French and English. One network for every developer in Africa.",
    cta: "Join the community",
    browse: "Browse questions",
  },
  home: {
    eyebrow: "Africa's developer help network",
    titleA: "Ask in English.",
    titleB: "Get the answer from Dakar.",
    from: "Developers from",
    topDevs: "Top contributors",
    allRanking: "See the leaderboard",
    popular: "Popular tags",
    ctaTitle: "Your next bug was already solved in Abidjan.",
    ctaBody: "Join developers helping each other across languages and borders.",
    viewAll: "All questions",
  },
  how: {
    title: "How it works",
    s1t: "Ask", s1: "Ask in your own language. Translation never touches your code.",
    s2t: "Share", s2: "Answer others, earn reputation, and earn credits when your answer is accepted.",
    s3t: "Exchange", s3: "Spend credits to book a mentoring or pair-programming session.",
  },
  stats: { devs: "developers", questions: "questions", answers: "answers", countries: "countries" },
  q: {
    latest: "Latest questions", search: "Search…", answers: "answers", votes: "votes", noResults: "No questions found.",
    title: "Title", body: "Details (Markdown supported)", tags: "Tags (comma separated)", submit: "Post",
    yourAnswer: "Your answer", postAnswer: "Post answer", accept: "Accept this answer", accepted: "Accepted answer",
    translated: "Automatically translated from French", showOriginal: "Show original", showTranslation: "Show translation",
    askedBy: "by", loginToAnswer: "Log in to answer.", unanswered: "Unanswered",
  },
  profile: { reputation: "reputation", credits: "credits", skills: "Skills", book: "Book a session", topic: "Topic", message: "Message", offer: "Credits offered", send: "Send request", loginToBook: "Log in to book a session.", noCredits: "You're out of credits. Answer questions to earn more.", questions: "Questions", answers: "Answers" },
  sessions: { incoming: "Requests received", outgoing: "My requests", none: "No sessions yet.", accept: "Accept", decline: "Decline", cancel: "Cancel", complete: "Mark as completed", status: { pending: "Pending", accepted: "Accepted", completed: "Completed", declined: "Declined", cancelled: "Cancelled" } },
  board: { title: "Leaderboard", global: "Africa", byCountry: "By country", country: "Country", devs: "devs", rep: "reputation" },
  auth: { username: "Username", name: "Full name", email: "Email", password: "Password", country: "Country", lang: "Preferred language", login: "Log in", signup: "Create my account", haveAccount: "Already a member?", noAccount: "No account yet?", demo: "Try the demo account" },
};

export function dict(lang: Lang) {
  return lang === "en" ? en : (fr as Dict);
}

/** Eligible CADEV countries: French- and English-speaking Africa. */
export const COUNTRIES: Record<string, string> = {
  SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun", ML: "Mali", BF: "Burkina Faso", NE: "Niger", TG: "Togo",
  BJ: "Bénin", GN: "Guinée", GA: "Gabon", CG: "Congo", CD: "RD Congo", TD: "Tchad", CF: "Centrafrique",
  MG: "Madagascar", RW: "Rwanda", BI: "Burundi", DJ: "Djibouti", KM: "Comores", MR: "Mauritanie", TN: "Tunisie",
  MA: "Maroc", DZ: "Algérie", MU: "Maurice", SC: "Seychelles", NG: "Nigeria", GH: "Ghana", KE: "Kenya",
  ZA: "South Africa", UG: "Uganda", TZ: "Tanzania", ZM: "Zambia", ZW: "Zimbabwe", MW: "Malawi", BW: "Botswana",
  NA: "Namibia", LR: "Liberia", SL: "Sierra Leone", GM: "Gambia", ET: "Ethiopia", SS: "South Sudan", LS: "Lesotho",
  SZ: "Eswatini", CV: "Cabo Verde",
};

export function flag(code: string): string {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
