// UI chrome strings. Keys are shared across locales; `t()` falls back to
// English for any key missing in another locale.
import { defaultLocale, type Locale } from "./index";

export const ui = {
  en: {
    "nav.work": "Work",
    "nav.articles": "Articles",
    "nav.music": "Music",
    "nav.about": "About",
    "nav.contact": "Contact",

    "site.description":
      "Daniel “Klokie” Grossfeld — senior web architect and entrepreneur in Stockholm. Twenty-six years of shipped work: MoMA, Tiffany & Co., Rawkus, Scania, Werlabs.",

    "home.eyebrow": "Senior web architect · Stockholm",
    "home.lede":
      "I'm Daniel — known to many as Klokie. I architect and build data-driven websites, e-commerce, and media systems, and I've been shipping since 1998.",
    "home.featured": "Selected work",
    "home.allWork": "→ All work",
    "home.contact": "→ Let's chat",

    "work.eyebrow": "Things I've worked on",
    "work.title.pre": "years",
    "work.title.post": "of shipped work",
    "work.lede.tail":
      "A ledger, not a highlight reel — click any tag, place, role, or year to filter it.",
    "work.projects": "projects across New York, Paris, London, Barcelona, Tokyo, and Stockholm.",
    "work.clear": "clear ×",
    "work.project": "project",
    "work.projects.short": "projects",
    "work.imagePending": "IMAGE · COMING SOON",
    "work.back": "← All work",
    "work.visit": "VISIT ↗",
    "work.featured": "Featured",

    "articles.title": "Articles",
    "articles.metaDesc": "Articles and notes from 25+ years of web publishing.",
    "articles.empty": "More articles are on their way over from the archive.",
    "articles.back": "← All articles",

    "music.title": "Music",
    "music.metaDesc": "Bands and music projects, 1988 → today: Arbetarorkestern, Howler Monkey Gods, Moveable, and the long tail.",
    "music.present": "present",
    "music.placeholder": "More on this one soon.",

    "notfound.title": "Not found",
    "notfound.body": "This page doesn't exist (or doesn't anymore). If you were looking for something specific, get in touch and I'll point you to it.",
    "notfound.contact": "→ Contact me",
    "notfound.home": "→ Home",
  },
  sv: {
    "nav.work": "Arbete",
    "nav.articles": "Artiklar",
    "nav.music": "Musik",
    "nav.about": "Om",
    "nav.contact": "Kontakt",

    "site.description":
      "Daniel “Klokie” Grossfeld — senior webbarkitekt och entreprenör i Stockholm. Tjugosex år av levererat arbete: MoMA, Tiffany & Co., Rawkus, Scania, Werlabs.",

    "home.eyebrow": "Senior webbarkitekt · Stockholm",
    "home.lede":
      "Jag heter Daniel — även känd som Klokie. Jag bygger datadrivna webbplatser, e-handel och mediesystem, och har levererat sedan 1998.",
    "home.featured": "Utvalda arbeten",
    "home.allWork": "→ Allt arbete",
    "home.contact": "→ Hör av dig",

    "work.eyebrow": "Saker jag har arbetat med",
    "work.title.pre": "år",
    "work.title.post": "av levererat arbete",
    "work.lede.tail":
      "En liggare, inte en höjdpunktsrulle — klicka på en tagg, plats, roll eller ett år för att filtrera.",
    "work.projects": "projekt i New York, Paris, London, Barcelona, Tokyo och Stockholm.",
    "work.clear": "rensa ×",
    "work.project": "projekt",
    "work.projects.short": "projekt",
    "work.imagePending": "BILD · KOMMER SNART",
    "work.back": "← Allt arbete",
    "work.visit": "BESÖK ↗",
    "work.featured": "Utvald",

    "articles.title": "Artiklar",
    "articles.metaDesc": "Artiklar och anteckningar från 25+ år av webbpublicering.",
    "articles.empty": "Fler artiklar är på väg över från arkivet.",
    "articles.back": "← Alla artiklar",

    "music.title": "Musik",
    "music.metaDesc": "Band och musikprojekt, 1988 → idag: Arbetarorkestern, Howler Monkey Gods, Moveable med flera.",
    "music.present": "nu",
    "music.placeholder": "Mer om detta snart.",

    "notfound.title": "Hittades inte",
    "notfound.body": "Den här sidan finns inte (eller inte längre). Letade du efter något särskilt? Hör av dig så pekar jag dig rätt.",
    "notfound.contact": "→ Kontakta mig",
    "notfound.home": "→ Hem",
  },
} as const;

type UiKey = keyof (typeof ui)[typeof defaultLocale];

export function t(lang: Locale) {
  return (key: UiKey): string =>
    (ui[lang] as Record<string, string>)[key] ?? ui[defaultLocale][key];
}
