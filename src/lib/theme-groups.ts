// Friendly theme groups for BrickLink-style minifig prefixes.
// We match by itemNo prefix (case-insensitive).
export type ThemeGroupKey =
  | 'starwars' | 'harrypotter' | 'superheroes'
  | 'city' | 'space' | 'pirates' | 'trains'
  | 'simpsons' | 'spongebob' | 'nexoknights' | 'hiddenSide'
  | 'ideas' | 'dimensions' | 'chima' | 'indianajones'
  | 'atlantis' | 'monsterFighters' | 'toyStory'
  | 'agents' | 'piratesCaribbean' | 'collectibleMinifigs'
  | 'vidiyo' | 'adventurers' | 'other';

type GroupDef = { key: ThemeGroupKey; label: string; prefixes: string[] };

// NOTE: Prefixes gathered from common BL usage; adjust if you discover more.
export const THEME_GROUPS: GroupDef[] = [
  { key: 'starwars',          label: 'Star Wars',                  prefixes: ['sw'] },
  { key: 'harrypotter',       label: 'Harry Potter',               prefixes: ['hp'] },
  // BL uses "sh" for Super Heroes (both DC + Marvel). If you later want to split,
  // you can add specific sub-prefixes here (e.g., 'shm','shdc') and separate keys.
  { key: 'superheroes',       label: 'Super Heroes',               prefixes: ['sh'] },

  { key: 'city',              label: 'City / Town',                prefixes: ['twn','cty'] },
  { key: 'space',             label: 'Space & Sci-Fi',             prefixes: ['sp','gs','ice','uf','mtr'] },
  { key: 'pirates',           label: 'Pirates',                    prefixes: ['pi','pir'] },
  { key: 'trains',            label: 'Trains',                     prefixes: ['trn'] },

  { key: 'simpsons',          label: 'The Simpsons',               prefixes: ['sim'] },
  { key: 'spongebob',         label: 'SpongeBob',                  prefixes: ['bob'] },
  { key: 'nexoknights',       label: 'Nexo Knights',               prefixes: ['nex'] },
  { key: 'hiddenSide',        label: 'Hidden Side',                prefixes: ['hs'] },
  { key: 'ideas',             label: 'LEGO Ideas',                 prefixes: ['idea'] },
  { key: 'dimensions',        label: 'LEGO Dimensions',            prefixes: ['dim'] },
  { key: 'chima',             label: 'Legends of Chima',           prefixes: ['loc'] },
  { key: 'indianajones',      label: 'Indiana Jones',              prefixes: ['iaj'] },
  { key: 'atlantis',          label: 'Atlantis',                   prefixes: ['atl'] },
  { key: 'monsterFighters',   label: 'Monster Fighters',           prefixes: ['mof'] },
  { key: 'toyStory',          label: 'Toy Story',                  prefixes: ['toy'] },
  { key: 'agents',            label: 'Agents / Ultra Agents',      prefixes: ['uagt','agt'] },
  { key: 'piratesCaribbean',  label: 'Pirates of the Caribbean',   prefixes: ['poc'] },
  // Collectible minifig series vary by era/movie; fold them together here.
  { key: 'collectibleMinifigs', label: 'Collectible Minifigures',  prefixes: ['col','colhp','coltl','colma'] },
  { key: 'vidiyo',            label: 'VIDIYO',                     prefixes: ['vid'] },
  { key: 'adventurers',       label: 'Adventurers',                prefixes: ['adp','adv'] },

  // Anything that didn’t match above
  { key: 'other',             label: 'Other',                      prefixes: [] },
];

export function findGroupKeyByItemNo(itemNo: string): ThemeGroupKey {
  const v = (itemNo || '').toLowerCase();
  for (const g of THEME_GROUPS) {
    if (g.prefixes.some(p => v.startsWith(p))) return g.key;
  }
  return 'other';
}

export function regexForGroup(key: ThemeGroupKey): RegExp | null {
  const g = THEME_GROUPS.find(t => t.key === key);
  if (!g) return null;
  if (!g.prefixes.length) return null;
  // ^(sw|hp|sh) case-insensitive
  return new RegExp(`^(${g.prefixes.join('|')})`, 'i');
}