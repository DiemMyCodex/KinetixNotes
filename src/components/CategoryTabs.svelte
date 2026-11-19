<script lang="ts">
  import type { CategoryFilter } from '../types/lesson';
  import { CATEGORY_META } from '../lib/categoryMeta';
  import { CATEGORY_FILTERS } from '../utils/lessons';

  interface Props {
    activeCategory: CategoryFilter;
    onSelectCategory: (category: CategoryFilter) => void;
    counts: Record<CategoryFilter, number>;
  }

  let { activeCategory, onSelectCategory = () => {}, counts }: Props = $props();
</script>

<div
  role="tablist"
  aria-label="Lọc theo tủ sách"
  class="border-b border-[var(--border-hairline)] bg-[var(--bg-glass)] backdrop-blur-xl"
>
  <div class="fade-x mx-auto flex h-[var(--tabs-h)] max-w-[var(--shell-max)] items-center gap-1 overflow-x-auto px-4 scroll-thin sm:px-6 lg:px-8">
    {#each CATEGORY_FILTERS as category (category)}
      {@const meta = CATEGORY_META[category]}
      {@const Icon = meta.Icon}
      {@const isActive = activeCategory === category}
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        onclick={() => onSelectCategory(category)}
        title={`${category} · ${counts[category]} bài`}
        class={`${meta.tone} relative inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          isActive
            ? 'text-[var(--cat)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span
          aria-hidden="true"
          class={`absolute inset-0 rounded-full bg-[var(--cat-soft)] ring-1 ring-inset ring-[var(--cat)]/25 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        ></span>
        <Icon
          class={`relative z-10 h-3.5 w-3.5 transition-colors ${isActive ? 'text-[var(--cat)]' : 'text-[var(--text-muted)]'}`}
          aria-hidden="true"
        />
        <span class="relative z-10">{meta.label}</span>
        <span
          class={`relative z-10 font-mono text-[10.5px] tabular-nums ${
            isActive ? 'text-[var(--cat)]/85' : 'text-[var(--text-muted)]'
          }`}
        >
          {counts[category]}
        </span>
      </button>
    {/each}
  </div>
</div>
