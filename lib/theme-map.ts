// src/lib/theme-map.ts

/** Make a URL-friendly slug from any string. */
export function themeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')          // drop apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanum -> hyphen
    .replace(/^-+|-+$/g, '');      // trim hyphens
}

/** Canonical themes you care about. Add/remove as needed. */
export const CANONICAL_THEMES = [
  'Star Wars',
  'Marvel Super Heroes',
  'DC Super Heroes',
  'Harry Potter',
  'City',
  'Ninjago',
  'Friends',
  'Jurassic World',
  'Lord of the Rings',
  'The Hobbit',
  'The LEGO Movie',
  'Disney',
  'Minecraft',
  'Technic',
  'Speed Champions',
  'Ideas',
  'Icons (Creator Expert)',
  'Creator',
  'Architecture',
  'Trains',
  'Pirates',
  'Castle',
  'Space',
  'Monkie Kid',
  'Chima',
  'Nexo Knights',
  'Collectible Minifigures'
] as const;

export type CanonTheme = (typeof CANONICAL_THEMES)[number];

/**
 * Synonyms/keywords that map to a canonical theme.
 * Match is case-insensitive and uses word boundaries where sensible.
 */
export const THEME_SYNONYMS: Record<CanonTheme, string[]> = {
  'Star Wars': [
    'star wars', 'clone wars', 'stormtrooper', 'mandalorian',
    'grogu', 'baby yoda', 'boba fett', 'darth', 'skywalker', 'sith', 'jedi'
  ],
  'Marvel Super Heroes': [
    'marvel', 'avengers', 'spider-man', 'spiderman', 'iron man', 'hulk',
    'thor', 'black panther', 'captain america', 'guardians of the galaxy',
    'loki', 'ant-man', 'deadpool', 'x-men', 'wolverine'
  ],
  'DC Super Heroes': [
    'dc', 'batman', 'gotham', 'joker', 'harley quinn', 'superman',
    'wonder woman', 'flash', 'aquaman', 'justice league'
  ],
  'Harry Potter': [
    'harry potter', 'hogwarts', 'gryffindor', 'slytherin', 'hufflepuff',
    'ravenclaw', 'dumbledore', 'voldemort', 'death eater', 'quidditch'
  ],
  'City': ['city', 'police', 'fire', 'airport', 'town', 'stuntz'],
  'Ninjago': ['ninjago', 'lloyd', 'kai', 'zane', 'cole', 'jay', 'nya', 'garmadon'],
  'Friends': ['friends', 'heartlake'],
  'Jurassic World': ['jurassic', 'jurassic world', 'dinosaur', 't-rex', 't rex', 'raptor'],
  'Lord of the Rings': ['lord of the rings', 'lotr', 'gondor', 'mordor', 'frodo', 'aragorn'],
  'The Hobbit': ['the hobbit', 'hobbit', 'bilbo', 'smaug'],
  'The LEGO Movie': ['lego movie', 'emmet', 'wyldstyle', 'benny', 'uni-kitty', 'unikitty'],
  'Disney': ['disney', 'mickey', 'minnie', 'frozen', 'elsa', 'anna', 'encanto', 'pixar'],
  'Minecraft': ['minecraft', 'creeper', 'alex', 'steve', 'enderman'],
  'Technic': ['technic'],
  'Speed Champions': ['speed champions'],
  'Ideas': ['ideas'],
  'Icons (Creator Expert)': ['icons', 'creator expert', 'modular building', 'modular'],
  'Creator': ['creator', '3-in-1', '3 in 1'],
  'Architecture': ['architecture'],
  'Trains': ['train', 'trains', 'locomotive'],
  'Pirates': ['pirates', 'pirate'],
  'Castle': ['castle', 'knight', 'kingdoms', 'lion knights', 'black falcons'],
  'Space': ['space', 'classic space', 'astronaut'],
  'Monkie Kid': ['monkie kid', 'mk'],
  'Chima': ['chima', 'legends of chima'],
  'Nexo Knights': ['nexo knights', 'nexo'],
  'Collectible Minifigures': [
    'collectible minifigures', 'collectable minifigures', 'cmf', 'series \\d+'
  ]
};

/** Precomputed, case-insensitive regexes for fast checks. */
const ALIAS_REGEXES: Array<{ canon: CanonTheme; rx: RegExp }> = (() => {
  const list: Array<{ canon: CanonTheme; rx: RegExp }> = [];
  for (const canon of CANONICAL_THEMES) {
    const variants = [canon, ...(THEME_SYNONYMS[canon] || [])];
    for (const v of variants) {
      // word boundary around words; keep things like "series \d+"
      const source =
        v.includes('\\d')
          ? v
          : v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex
      const rx = new RegExp(`\\b${source}\\b`, 'i');
      list.push({ canon, rx });
    }
  }
  return list;
})();

/**
 * Try to detect a theme from any free text (product name, tags, etc.).
 * Returns the canonical theme name or null if no confident match.
 *
 * This is intentionally conservative: first match wins.
 */
export function sniffTheme(text?: string | null): CanonTheme | null {
  if (!text) return null;
  const hay = String(text).toLowerCase();
  for (const { canon, rx } of ALIAS_REGEXES) {
    if (rx.test(hay)) return canon;
  }
  return null;
}

/** Convenience: detect theme and return its slug, or null. */
export function sniffThemeSlug(text?: string | null): string | null {
  const t = sniffTheme(text);
  return t ? themeSlug(t) : null;
}

/** List available canonical themes (useful for dropdowns or admin UI). */
export function listCanonicalThemes(): { name: CanonTheme; slug: string }[] {
  return CANONICAL_THEMES.map((name) => ({ name, slug: themeSlug(name) }));
}