// src/lib/theme-map.js
// Canonical theme → list of patterns that should map to it.
// Tweak/extend freely — this is what drives the “Other” shrink.
const THEME_MAP = [
  { canonical: 'Star Wars',              patterns: ['star\\s*wars', '^sw\\b'] },
  { canonical: 'Super Heroes Marvel',    patterns: ['marvel', 'avengers', 'spider-?man', 'super\\s*heroes.*marvel'] },
  { canonical: 'Super Heroes DC',        patterns: ['\\bdc\\b', 'batman', 'superman', 'justice\\s*league', 'super\\s*heroes.*dc'] },
  { canonical: 'City',                   patterns: ['^city$', '^city\\s*-'] },
  { canonical: 'Technic',                patterns: ['technic'] },
  { canonical: 'Ninjago',                patterns: ['ninjago'] },
  { canonical: 'Harry Potter',           patterns: ['harry\\s*potter', 'hogwarts'] },
  { canonical: 'Friends',                patterns: ['^friends$'] },
  { canonical: 'Minecraft',              patterns: ['minecraft'] },
  { canonical: 'Super Mario',            patterns: ['super\\s*mario', '\\bmario\\b'] },
  { canonical: 'Disney',                 patterns: ['\\bdisney\\b', 'frozen'] },
  { canonical: 'Lord of the Rings',      patterns: ['lord\\s*of\\s*the\\s*rings', '\\blotr\\b', '\\bhobbit\\b'] },
  { canonical: 'Ideas',                  patterns: ['ideas', 'cuusoo'] },
  { canonical: 'Architecture',           patterns: ['architecture'] },
  { canonical: 'Speed Champions',        patterns: ['speed\\s*champions'] },
  { canonical: 'Creator',                patterns: ['^creator\\b'] },
  { canonical: 'Collectible Minifigures',patterns: ['collectible', '\\bcmf\\b', 'minifigures\\s*series'] },
  { canonical: 'Duplo',                  patterns: ['duplo'] },
];

function buildThemeNormalizeStage(rawField = '$_theme') {
  // Turns raw theme into "themeNorm" using THEME_MAP (server-side in the aggregation).
  const branches = [];
  for (const { canonical, patterns } of THEME_MAP) {
    for (const pat of patterns) {
      branches.push({
        case: { $regexMatch: { input: '$$t', regex: pat, options: 'i' } },
        then: canonical,
      });
    }
  }
  return {
    $addFields: {
      themeNorm: {
        $let: {
          vars: { t: { $toString: rawField } },
          in: { $switch: { branches, default: 'Other' } },
        },
      },
    },
  };
}

module.exports = { THEME_MAP, buildThemeNormalizeStage };