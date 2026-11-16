import { motion } from 'motion/react';
import type { CategoryFilter } from '../types/lesson';
import { CATEGORY_FILTERS } from '../utils/lessons';

interface CategoryTabsProps {
  activeCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  counts: Record<CategoryFilter, number>;
}

export function CategoryTabs({
  activeCategory,
  onSelectCategory,
  counts,
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Lọc theo tủ sách"
      className="editorial-scroll flex h-[51px] items-center gap-1 overflow-x-auto border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-[1380px] items-center gap-1.5 pr-4 sm:pr-0">
        {CATEGORY_FILTERS.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              role="tab"
              type="button"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(cat)}
              className={`relative inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                isSelected
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isSelected && (
                <motion.span
                  layoutId="activeCategoryPill"
                  transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md border border-[var(--border-strong)]/70 bg-[var(--bg-card)] shadow-[0_1px_2px_rgba(20,20,19,0.05)]"
                />
              )}
              <span className="relative z-10">{cat}</span>
              <span
                className={`relative z-10 font-mono text-[11px] tabular-nums ${
                  isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {counts[cat]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
