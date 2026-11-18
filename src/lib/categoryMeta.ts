import { Brain, Cpu, LayoutGrid, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';
import type { CategoryFilter } from '../types/lesson';

export interface CategoryMeta {
  label: CategoryFilter;
  short: string;
  Icon: LucideIcon;
  tone: string;
}

export const CATEGORY_META: Record<CategoryFilter, CategoryMeta> = {
  'Tất cả': { label: 'Tất cả', short: 'Tất cả', Icon: LayoutGrid, tone: 'cat-all' },
  'Máy tính': { label: 'Máy tính', short: 'Máy tính', Icon: Cpu, tone: 'cat-computer' },
  'Trí tuệ AI': { label: 'Trí tuệ AI', short: 'AI', Icon: Sparkles, tone: 'cat-ai' },
  'Tâm lý & Sống': { label: 'Tâm lý & Sống', short: 'Tâm lý', Icon: Brain, tone: 'cat-mind' },
  'Kinh tế': { label: 'Kinh tế', short: 'Kinh tế', Icon: TrendingUp, tone: 'cat-economy' },
};

export function categoryTone(category: CategoryFilter | string | null | undefined): string {
  if (category && category in CATEGORY_META) {
    return CATEGORY_META[category as CategoryFilter].tone;
  }
  return 'cat-all';
}
