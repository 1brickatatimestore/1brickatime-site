export type ThemeKey =
  | 'city'
  | 'star-wars'
  | 'ninjago'
  | 'harry-potter'
  | 'jurassic-world'
  | 'the-lego-movie'
  | 'speed-champions'
  | 'space'
  | 'pirates'
  | 'pirates-of-the-caribbean'
  | 'indiana-jones'
  | 'ghostbusters'
  | 'minions'
  | 'the-simpsons'
  | 'spongebob'
  | 'trains'
  | 'atlantis'
  | 'monster-fighters'
  | 'vidiyo'
  | 'adventurers'
  | 'hidden-side'
  | 'nexo-knights'
  | 'legends-of-chima'
  | 'toy-story'
  | 'ultra-agents'
  | 'racers'
  | 'ideas'
  | 'collectible-minifigures'
  | 'other'

export const THEME_LABELS: Record<ThemeKey, string> = {
  city: 'City',
  'star-wars': 'Star Wars',
  ninjago: 'Ninjago',
  'harry-potter': 'Harry Potter',
  'jurassic-world': 'Jurassic World',
  'the-lego-movie': 'The LEGO Movie',
  'speed-champions': 'Speed Champions',
  space: 'Space',
  pirates: 'Pirates',
  'pirates-of-the-caribbean': 'Pirates of the Caribbean',
  'indiana-jones': 'Indiana Jones',
  ghostbusters: 'Ghostbusters',
  minions: 'Minions',
  'the-simpsons': 'The Simpsons',
  spongebob: 'SpongeBob SquarePants',
  trains: 'Trains',
  atlantis: 'Atlantis',
  'monster-fighters': 'Monster Fighters',
  vidiyo: 'VIDIYO',
  adventurers: 'Adventurers',
  'hidden-side': 'Hidden Side',
  'nexo-knights': 'Nexo Knights',
  'legends-of-chima': 'Legends of Chima',
  'toy-story': 'Toy Story',
  'ultra-agents': 'Ultra Agents',
  racers: 'Racers',
  ideas: 'Ideas',
  'collectible-minifigures': 'Collectible Minifigures',
  other: 'Other (Singles)',
}

export function isCollectiblePrefix(p: string) {
  return p.startsWith('col') || p === 'cmf'
}

const CITYish = new Set(['twn', 'gen', 'air', 'cop'])

const PREFIX_MAP: Record<string, ThemeKey> = {
  // big ones
  sw: 'star-wars',
  hp: 'harry-potter',
  njo: 'ninjago',
  jw: 'jurassic-world',
  tlm: 'the-lego-movie',
  sc: 'speed-champions',
  sp: 'space',

  // City family
  twn: 'city',
  gen: 'city',
  air: 'city',
  cop: 'city',

  // other themes
  pi: 'pirates',
  poc: 'pirates-of-the-caribbean',
  iaj: 'indiana-jones',
  gs: 'ghostbusters',
  min: 'minions',
  sim: 'the-simpsons',
  trn: 'trains',
  atl: 'atlantis',
  mof: 'monster-fighters',
  vid: 'vidiyo',
  adp: 'adventurers',
  hs: 'hidden-side',
  nex: 'nexo-knights',
  loc: 'legends-of-chima',
  bob: 'spongebob',     // SpongeBob stays separate
  toy: 'toy-story',
  uagt: 'ultra-agents',
  rac: 'racers',
  idea: 'ideas',
}

export function extractPrefix(itemNo?: string) {
  if (!itemNo) return ''
  const m = itemNo.toLowerCase().match(/^[a-z]+/)
  return m ? m[0] : ''
}

export function mapThemeKey(prefix: string): ThemeKey {
  if (!prefix) return 'other'
  if (isCollectiblePrefix(prefix)) return 'collectible-minifigures'
  if (CITYish.has(prefix)) return 'city'
  return PREFIX_MAP[prefix] ?? 'other'
}