// Theme palette for wishlists — mirrors the folder colours from the
// landing illustration so the product feels continuous with the marketing site.

export type ThemeColorId =
  | 'sky'
  | 'ink'
  | 'coral'
  | 'violet'
  | 'rose'
  | 'green'
  | 'amber';

export type ThemeColor = {
  id: ThemeColorId;
  /** solid background used to theme the create screen and wishlist cards */
  bg: string;
  /** ring shown around the swatch in the picker */
  ring: string;
};

export const THEME_COLORS: ThemeColor[] = [
  { id: 'sky', bg: '#5BC0EB', ring: '#5BC0EB' },
  { id: 'ink', bg: '#1B1B1B', ring: '#1B1B1B' },
  { id: 'coral', bg: '#F0555C', ring: '#F0555C' },
  { id: 'violet', bg: '#7B5BF5', ring: '#7B5BF5' },
  { id: 'rose', bg: '#F5476A', ring: '#F5476A' },
  { id: 'green', bg: '#35C88A', ring: '#35C88A' },
  { id: 'amber', bg: '#F4B43C', ring: '#F4B43C' },
];

export const DEFAULT_THEME: ThemeColorId = 'coral';

export function getThemeColor(id: ThemeColorId): ThemeColor {
  return THEME_COLORS.find((c) => c.id === id) ?? THEME_COLORS[0];
}
