// Theme chips shown under the hero search bar on the home page.
// A theme matches guides whose bio or city mentions one of its keywords
// (see the `theme` filter in /api/guides). Shared between the client
// (chip labels) and the search API (keyword lookup).
export const THEME_TAGS = [
  {
    label: 'Heritage & ruins',
    keywords: ['heritage', 'ruins', 'history', 'citadel', 'umayyad', 'roman', 'nabataean', 'phoenician', 'castle', 'mosque', 'theatre'],
  },
  {
    label: 'Food & souks',
    keywords: ['food', 'souk', 'mezze', 'cooking', 'culinary', 'seafood', 'kunafa', 'market', 'spice'],
  },
  {
    label: 'Mountains & cedars',
    keywords: ['cedar', 'mountain', 'wadi', 'castle of saladin', 'countryside'],
  },
  {
    label: 'Desert & Bedouin',
    keywords: ['desert', 'bedouin', 'wadi rum', 'petra'],
  },
] as const;
