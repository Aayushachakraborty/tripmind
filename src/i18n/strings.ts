export const LANGUAGES = ["EN", "HI", "FR", "ES", "AR", "ZH", "DE", "JA", "PT", "RU"] as const;
export type LanguageCode = typeof LANGUAGES[number];

type Strings = {
  appTagline: string;
  searchPlaceholder: string;
  plan: string;
  importReel: string;
  trips: string;
  alerts: string;
  language: string;
  currency: string;
  signIn: string;
  mountainsHeadline: string;
  mountainsTagline: string;
  beachesHeadline: string;
  beachesTagline: string;
  citiesHeadline: string;
  citiesTagline: string;
  desertsHeadline: string;
  desertsTagline: string;
};

const en: Strings = {
  appTagline: "Global AI travel planning from reels, preferences, and real constraints.",
  searchPlaceholder: "Search any destination, vibe, or reel-inspired route",
  plan: "Plan",
  importReel: "Import Reel",
  trips: "Trips",
  alerts: "Alerts",
  language: "Language",
  currency: "Currency",
  signIn: "Sign in to plan",
  mountainsHeadline: "Find the silence above the clouds",
  mountainsTagline: "AI-built alpine routes for slow mornings, starlit cabins, and wild ridgelines.",
  beachesHeadline: "Follow the sun to softer shores",
  beachesTagline: "Design island days around tides, food, sunsets, and barefoot recovery.",
  citiesHeadline: "Decode the city after dark",
  citiesTagline: "Culture, food, nightlife, and hidden blocks sequenced into one electric route.",
  desertsHeadline: "Cross gold horizons with care",
  desertsTagline: "Cinematic desert escapes paced around heat, stars, dunes, and old caravan towns."
};

export const strings: Record<LanguageCode, Strings> = {
  EN: en,
  HI: { ...en, appTagline: "रील, पसंद और वास्तविक सीमाओं से वैश्विक AI यात्रा योजना।", language: "भाषा", currency: "मुद्रा", signIn: "योजना बनाने के लिए साइन इन करें" },
  FR: { ...en, appTagline: "Planification de voyage IA mondiale.", language: "Langue", currency: "Devise", signIn: "Connectez-vous pour planifier" },
  ES: { ...en, appTagline: "Planificación global de viajes con IA.", language: "Idioma", currency: "Moneda", signIn: "Inicia sesión para planificar" },
  AR: { ...en, appTagline: "تخطيط سفر عالمي بالذكاء الاصطناعي.", language: "اللغة", currency: "العملة", signIn: "سجّل الدخول للتخطيط" },
  ZH: { ...en, appTagline: "全球 AI 旅行规划。", language: "语言", currency: "货币", signIn: "登录后规划" },
  DE: { ...en, appTagline: "Globale KI-Reiseplanung.", language: "Sprache", currency: "Währung", signIn: "Zum Planen anmelden" },
  JA: { ...en, appTagline: "グローバルAI旅行プランナー。", language: "言語", currency: "通貨", signIn: "ログインして計画" },
  PT: { ...en, appTagline: "Planejamento global de viagens com IA.", language: "Idioma", currency: "Moeda", signIn: "Entre para planejar" },
  RU: { ...en, appTagline: "Глобальное планирование путешествий с ИИ.", language: "Язык", currency: "Валюта", signIn: "Войдите, чтобы планировать" }
};
