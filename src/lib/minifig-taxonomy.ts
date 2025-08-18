// src/lib/minifig-taxonomy.ts
export const CANON = {
  STAR_WARS: "Star Wars",
  MARVEL: "Marvel",
  DC: "DC",
  SUPER_HEROES: "Super Heroes",
  NINJAGO: "Ninjago",
  CITY: "City",
  TECHNIC: "Technic",
  FRIENDS: "Friends",
  DISNEY: "Disney",
  HARRY_POTTER: "Harry Potter",
  MINECRAFT: "Minecraft",
  LOTR: "The Lord of the Rings",
  SPEED_CHAMPIONS: "Speed Champions",
  JURASSIC_WORLD: "Jurassic World",
  CREATOR: "Creator",
  IDEAS: "Ideas",
  COLLECTIBLE_MINIFIGS: "Collectible Minifigures",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

// Build $switch branches (specific first)
function branches(inputExpr: any) {
  const mk = (regex: RegExp, then: string) => ({
    case: { $regexMatch: { input: inputExpr, regex } },
    then,
  });

  return [
    mk(/collectible minifig|cmf|minifigure series|series\s?\d+/i, CANON.COLLECTIBLE_MINIFIGS),
    mk(/star\s*wars/i, CANON.STAR_WARS),
    mk(/\bharry\s*potter\b/i, CANON.HARRY_POTTER),
    mk(/\bmarvel\b/i, CANON.MARVEL),
    mk(/\bdc(\s|$)|dc super heroes/i, CANON.DC),
    mk(/super heroes/i, CANON.SUPER_HEROES),
    mk(/ninjago/i, CANON.NINJAGO),
    mk(/\bcity\b/i, CANON.CITY),
    mk(/technic/i, CANON.TECHNIC),
    mk(/friends/i, CANON.FRIENDS),
    mk(/disney/i, CANON.DISNEY),
    mk(/minecraft/i, CANON.MINECRAFT),
    mk(/jurassic/i, CANON.JURASSIC_WORLD),
    mk(/speed champions/i, CANON.SPEED_CHAMPIONS),
    mk(/(creator expert|creator 3in1|creator)/i, CANON.CREATOR),
    mk(/ideas/i, CANON.IDEAS),
    mk(/\blotr\b|lord of the rings/i, CANON.LOTR),
    mk(/\bunknown\b/i, CANON.UNKNOWN),
  ];
}

// $addFields expression that derives a canonical _theme
export function mongoAddFieldsTheme() {
  return {
    $let: {
      vars: {
        t: {
          $toString: {
            $ifNull: ["$theme", { $ifNull: ["$themeName", { $ifNull: ["$theme.name", ""] }] }],
          },
        },
        n: { $toString: { $ifNull: ["$name", ""] } },
      },
      in: {
        $switch: {
          branches: branches({ $concat: ["$$t", " ", "$$n"] }),
          default: {
            $cond: [{ $eq: ["$$t", ""] }, CANON.UNKNOWN, "$$t"],
          },
        },
      },
    },
  };
}

// Derive _series if _theme is CMF
export function mongoAddFieldsSeries() {
  return {
    $let: {
      vars: {
        src: { $concat: [{ $toString: { $ifNull: ["$name", ""] } }, " ", { $toString: { $ifNull: ["$itemNo", ""] } }] },
      },
      in: {
        $cond: [
          { $eq: ["$_theme", CANON.COLLECTIBLE_MINIFIGS] },
          {
            $let: {
              vars: {
                r1: { $regexFind: { input: "$$src", regex: /(series|s)\s?(\d{1,2})/i } },
                r2: { $regexFind: { input: "$$src", regex: /\bcol0?(\d{1,2})/i } },
              },
              in: {
                $cond: [
                  { $ne: ["$$r1", null] },
                  { $concat: ["Series ", { $arrayElemAt: ["$$r1.captures", 1] }] },
                  {
                    $cond: [
                      { $ne: ["$$r2", null] },
                      { $concat: ["Series ", { $arrayElemAt: ["$$r2.captures", 0] }] },
                      "",
                    ],
                  },
                ],
              },
            },
          },
          "",
        ],
      },
    },
  };
}

// _collection equals canonical theme, except all CMF collapse to "Collectible Minifigures"
export function mongoAddFieldsCollection() {
  return {
    $cond: [{ $eq: ["$_theme", CANON.COLLECTIBLE_MINIFIGS] }, CANON.COLLECTIBLE_MINIFIGS, "$_theme"],
  };
}