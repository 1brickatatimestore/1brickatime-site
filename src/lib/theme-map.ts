// src/lib/theme-map.ts

export type ThemeMapEntry = { key: string; label: string };

// Prefix -> normalized {key,label}
export const THEME_MAP: Record<string, ThemeMapEntry> = {
  // majors
  sw:   { key: 'star-wars',               label: 'Star Wars' },
  hp:   { key: 'harry-potter',            label: 'Harry Potter' },
  tlm:  { key: 'the-lego-movie',          label: 'The LEGO Movie' },
  jw:   { key: 'jurassic-world',          label: 'Jurassic World' },
  nin:  { key: 'ninjago',                 label: 'Ninjago' },
  cty:  { key: 'city',                    label: 'City' },
  twn:  { key: 'city',                    label: 'City' }, // Town → City
  sp:   { key: 'space',                   label: 'Space' },
  sc:   { key: 'speed-champions',         label: 'Speed Champions' },

  // from your inventory
  toy:  { key: 'toy-story',               label: 'Toy Story' },
  dim:  { key: 'lego-dimensions',         label: 'LEGO Dimensions' },
  adp:  { key: 'adventurers',             label: 'Adventurers' },
  hol:  { key: 'holiday-seasonal',        label: 'Holiday / Seasonal' },
  loc:  { key: 'legends-of-chima',        label: 'Legends of Chima' },
  bob:  { key: 'spongebob-squarepants',   label: 'SpongeBob SquarePants' },
  nex:  { key: 'nexo-knights',            label: 'Nexo Knights' },
  hs:   { key: 'hidden-side',             label: 'Hidden Side' },
  gen:  { key: 'general',                 label: 'General' },
  iaj:  { key: 'indiana-jones',           label: 'Indiana Jones' },
  air:  { key: 'air',                     label: 'Air' },
  uagt: { key: 'ultra-agents',            label: 'Ultra Agents' },
  gs:   { key: 'ghostbusters',            label: 'Ghostbusters' },
  min:  { key: 'minions',                 label: 'Minions' },
  pi:   { key: 'pirates',                 label: 'Pirates' },
  sim:  { key: 'the-simpsons',            label: 'The Simpsons' },
  ac:   { key: 'arctic',                  label: 'Arctic' },
  atl:  { key: 'atlantis',                label: 'Atlantis' },
  mof:  { key: 'monster-fighters',        label: 'Monster Fighters' },
  vid:  { key: 'vidiyo',                  label: 'VIDIYO' },
  poc:  { key: 'pirates-of-the-caribbean',label: 'Pirates of the Caribbean' },
  trn:  { key: 'trains',                  label: 'Trains' },
  cop:  { key: 'city',                    label: 'City' }, // Police → City
  idea: { key: 'ideas',                   label: 'IDEAS' },
  tmnt: { key: 'tmnt',                    label: 'Teenage Mutant Ninja Turtles' },
  rac:  { key: 'racers',                  label: 'Racers' },
  mk:   { key: 'monkie-kid',              label: 'Monkie Kid' },
};

// “col…” are Collectible Minifigures
export const isCollectiblePrefix = (prefix: string) => /^col/i.test(prefix);

// Map a BL prefix to our normalized theme (or null if unknown)
export function normalizePrefix(prefix: string): ThemeMapEntry | null {
  if (!prefix) return null;
  if (isCollectiblePrefix(prefix)) {
    return { key: 'collectible-minifigures', label: 'Collectible Minifigures' };
  }
  const hit = THEME_MAP[prefix.toLowerCase()];
  return hit ?? null;
}