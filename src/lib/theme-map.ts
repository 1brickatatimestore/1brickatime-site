// src/lib/theme-map.ts

// Map BrickLink-ish names/aliases to a canonical theme slug
export const THEME_MAP: Record<string, string> = {
  // Canonical        // Aliases (lowercased, punctuation-insensitive)
  "star-wars":        "star wars,sw,starwars",
  "harry-potter":     "harry potter,hp",
  "city":             "city,town",
  "technic":          "technic,tech",
  "friends":          "friends",
  "ninjago":          "ninjago",
  "creator":          "creator,3in1,3-in-1",
  "creator-expert":   "creator expert,expert,icons", // legacy->icons
  "marvel":           "marvel,avengers,super heroes,super-heroes",
  "dc":               "dc,batman,super heroes dc,super-heroes dc",
  "jurassic-world":   "jurassic world,jurassic",
  "minecraft":        "minecraft,mc",
  "disney":           "disney",
  "ideas":            "ideas,cuusoo",
  "speed-champions":  "speed champions,speed",
  "lord-of-the-rings":"lotr,lord of the rings",
  "architecture":     "architecture,arch",
  "classic":          "classic,bricks and eyes",
  "duplo":            "duplo",
  "monkie-kid":       "monkie kid,monkiekid,mk",
  "icon":             "icons", // keep new branding reachable
};

// Build a quick lookup from aliases → canonical
const ALIAS_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [canonical, aliases] of Object.entries(THEME_MAP)) {
    for (const raw of aliases.split(",")) {
      const k = normalize(raw);
      if (!map[k]) map[k] = canonical;
    }
    // also map the canonical name to itself
    map[normalize(canonical)] = canonical;
  }
  return map;
})();

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

/**
 * Best-effort theme detector.
 * Accepts a raw theme name from data, returns a canonical slug present in THEME_MAP,
 * or `null` if we couldn’t confidently map it.
 */
export function sniffTheme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const norm = normalize(raw);

  // direct alias/canonical hit
  if (ALIAS_LOOKUP[norm]) return ALIAS_LOOKUP[norm];

  // relaxed contains-based guesses
  for (const [needle, canonical] of [
    ["star wars", "star-wars"],
    ["harry potter", "harry-potter"],
    ["creator expert", "creator-expert"],
    ["speed champions", "speed-champions"],
    ["jurassic", "jurassic-world"],
    ["lord of the rings", "lord-of-the-rings"],
  ]) {
    if (norm.includes(needle)) return canonical;
  }

  // last-resort: single word exacts
  for (const canonical of Object.keys(THEME_MAP)) {
    if (norm === normalize(canonical)) return canonical;
  }

  return null;
}