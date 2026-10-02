import { Apple, Beef, Candy, CupSoda, Egg, Fish, Leaf, Milk, Sandwich, ShoppingBasket, Utensils, Wheat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// The glyph names the API accepts for a category icon (catalog.schema.ts categoryIcons), each
// mapped to a bundled icon — a fixed list, so the storefront never has to fetch an icon at runtime.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'cup-soda': CupSoda,
  beef: Beef,
  milk: Milk,
  apple: Apple,
  candy: Candy,
  fish: Fish,
  wheat: Wheat,
  egg: Egg,
  sandwich: Sandwich,
  'shopping-basket': ShoppingBasket,
  leaf: Leaf,
  utensils: Utensils,
};

export function categoryIcon(name: string | null | undefined): LucideIcon | undefined {
  return name ? CATEGORY_ICONS[name] : undefined;
}
