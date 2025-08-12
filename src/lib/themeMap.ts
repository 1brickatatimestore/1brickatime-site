// src/lib/themeMap.ts
// Shared helpers so API + pages agree on theme names and CMF series.

export type ProductLite = {
  _id?: string;
  itemNo: string;   // e.g. "sw0542", "hp123", "col18-12", "colhp-10"
  name: string;
  type?: string;    // "MINIFIG"
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------ Collectible Minifigures ------------------------ */

export const CMF_SERIES: Record<string, string> = {
  col01: "Series 1",
  col02: "Series 2",
  col03: "Series 3",
  col04: "Series 4",
  col05: "Series 5",
  col06: "Series 6",
  col07: "Series 7",
  col08: "Series 8",
  col09: "Series 9",
  col10: "Series 10",
  col11: "Series 11",
  col12: "Series 12",
  col13: "Series 13",
  col14: "Series 14 (Monsters)",
  col15: "Series 15",
  col16: "Series 16",
  col17: "Series 17",
  col18: "Series 18 (Party)",
  col19: "Series 19",
  col20: "Series 20",
  col21: "Series 21",
  col22: "Series 22",
  col23: "Series 23",
  col24: "Series 24",
  col25: "Series 25",

  // Named series (BrickLink style)
  coldis:  "Disney Series 1",
  coldis2: "Disney Series 2",
  colhp:   "Harry Potter Series 1",
  colhp2:  "Harry Potter Series 2",
  colmar:  "Marvel Studios",
  collt:   "Looney Tunes",
  colmup:  "The Muppets",
  colsim:  "The Simpsons Series 1",
  colsim2: "The Simpsons Series 2",
  coltlm:  "The LEGO Movie",
  coltlm2: "The LEGO Movie 2",
  colbat:  "The LEGO Batman Movie",
  colgb:   "Team GB",
  coldfb:  "German National Team",
};

export const CMF_ORDER: string[] = [
  "col01","col02","col03","col04","col05","col06","col07","col08","col09","col10",
  "col11","col12","col13","col14","col15","col16","col17","col18","col19","col20",
  "col21","col22","col23","col24","col25",
  "coldis","coldis2","colhp","colhp2","colmar","collt","colmup","colsim","colsim2",
  "coltlm","coltlm2","colbat","colgb","coldfb",
];

export function getCmfSeries(itemNo: string) {
  const s = (itemNo || "").toLowerCase();

  // Named first
  for (const key of Object.keys(CMF_SERIES)) {
    if (s.startsWith(key)) {
      return { seriesCode: key, seriesTitle: CMF_SERIES[key] };
    }
  }
  // Numbered col01..col25
  const m = s.match(/^col(\d{2})/);
  if (m) {
    const k = `col${m[1]}`;
    if (CMF_SERIES[k]) return { seriesCode: k, seriesTitle: CMF_SERIES[k] };
  }
  return null;
}

/* ------------------------ Main theme inference ------------------------ */
/** Merge many BrickLink-ish short codes and collapse subthemes. */
const THEME_PREFIX_MAP: Array<{ re: RegExp; title: string }> = [
  // City family (CTY/TWN/COP etc.)
  { re: /^(cty|twn|cop|pol|res|tra|con)/, title: "City" },

  { re: /^sw/,         title: "Star Wars" },
  { re: /^hp/,         title: "Harry Potter" },
  { re: /^njo/,        title: "Ninjago" },
  { re: /^jw/,         title: "Jurassic World" },
  { re: /^toy/,        title: "Toy Story" },
  { re: /^dis(?!ney\s*cmf)/, title: "Disney" },

  // Super Heroes (both Marvel/DC use sh)
  { re: /^sh/,         title: "Super Heroes" },

  // Common classics / licensed
  { re: /^loc/,        title: "Legends of Chima" },
  { re: /^lor/,        title: "The Lord of the Rings" },
  { re: /^(cas|kn)/,   title: "Castle" },
  { re: /^pir|^pi$/,   title: "Pirates" },
  { re: /^poc/,        title: "Pirates of the Caribbean" },
  { re: /^iaj|^ind/,   title: "Indiana Jones" },
  { re: /^rac|^rc/,    title: "Racers" },
  { re: /^mm$/,        title: "Mars Mission" },
  { re: /^ac$/,        title: "Arctic" },
  { re: /^atl/,        title: "Atlantis" },
  { re: /^uagt/,       title: "Ultra Agents" },
  { re: /^agt/,        title: "Agents" },
  { re: /^sim(?!pson)/,title: "The Simpsons" },
  { re: /^vid/,        title: "VIDIYO" },
  { re: /^mk$/,        title: "Monkie Kid" },
  { re: /^tlr$/,       title: "The Lone Ranger" },
  { re: /^ovr$/,       title: "Overwatch" },
  { re: /^son(ic)?/,   title: "Sonic" },
  { re: /^bob$/,       title: "SpongeBob SquarePants" },
  { re: /^gs$/,        title: "Galaxy Squad" },
  { re: /^sc$/,        title: "Speed Champions" },
  { re: /^sp/,         title: "Space" },
  { re: /^hol$/,       title: "Holiday / Seasonal" },
  { re: /^hs$/,        title: "Hidden Side" },
  { re: /^gen$/,       title: "General" },
  { re: /^adp$/,       title: "Adventurers" },
  { re: /^dim$/,       title: "Dimensions" },
  { re: /^tlm$/,       title: "The LEGO Movie" },
  { re: /^bat$/,       title: "Batman" },
  { re: /^air$/,       title: "Avatar (The Last Airbender)" },
  { re: /^ww$/,        title: "Wild West" },
  { re: /^rac$/,       title: "Racers" },
];

export function inferMainTheme(itemNo: string, name: string): string {
  const s = (itemNo || "").toLowerCase();

  if (s.startsWith("col")) return "Collectible Minifigures";

  for (const { re, title } of THEME_PREFIX_MAP) {
    if (re.test(s)) return title;
  }

  // Name heuristics as a last resort
  const n = (name || "").toLowerCase();
  if (/star\s*wars/.test(n)) return "Star Wars";
  if (/harry\s*potter|hogwarts/.test(n)) return "Harry Potter";
  if (/ninjago/.test(n)) return "Ninjago";

  return "Other";
}