import { motion } from 'motion/react';
import type { CategoryFilter } from '../types/lesson';
import { CATEGORY_META } from '../lib/categoryMeta';
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
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-glass)] backdrop-blur-xl"
    >
      <div className="fade-x mx-auto flex h-[var(--tabs-h)] max-w-[var(--shell-max)] items-center gap-1 overflow-x-auto px-4 scroll-thin sm:px-6 lg:px-8">
        {CATEGORY_FILTERS.map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.Icon;
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(category)}
              title={`${category} · ${counts[category]} bài`}
              className={`${meta.tone} relative inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                isActive
                  ? 'text-[var(--cat)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeCategoryPill"
                  transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-[var(--cat-soft)] ring-1 ring-inset ring-[var(--cat)]/25"
                />
              )}
              <Icon
                className={`relative z-10 h-3.5 w-3.5 transition-colors ${
                  isActive ? 'text-[var(--cat)]' : 'text-[var(--text-muted)]'
                }`}
                aria-hidden="true"
              />
              <span className="relative z-10">{meta.label}</span>
              <span
                className={`relative z-10 font-mono text-[10.5px] tabular-nums ${
                  isActive ? 'text-[var(--cat)]/85' : 'text-[var(--text-muted)]'
                }`}
              >
                {counts[category]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
