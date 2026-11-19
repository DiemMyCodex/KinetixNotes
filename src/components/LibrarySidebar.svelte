<script lang="ts">
  import { Check, Plus, Search, SlidersHorizontal, X } from '@lucide/svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { categoryTone } from '../lib/categoryMeta';
  import type { CategoryFilter, Lesson, MasteryFilter } from '../types/lesson';
  import type { ProgressStats } from '../utils/lessons';

  interface Props {
    lessons: Lesson[];
    selectedLessonId: number | null;
    onSelectLesson?: (id: number) => void;
    searchQuery: string;
    onSearchChange?: (value: string) => void;
    searchInputEl?: HTMLInputElement | null;
    masteredIds: ReadonlySet<number>;
    progress: ProgressStats;
    masteryFilter: MasteryFilter;
    onSelectMasteryFilter?: (filter: MasteryFilter) => void;
    activeCategory: CategoryFilter;
    onResetFilters?: () => void;
    canAddLesson: boolean;
    onOpenAddLesson?: () => void;
  }

  let {
    lessons,
    selectedLessonId,
    onSelectLesson = () => {},
    searchQuery,
    onSearchChange = () => {},
    searchInputEl = $bindable<HTMLInputElement | null>(null),
    masteredIds,
    progress,
    masteryFilter,
    onSelectMasteryFilter = () => {},
    activeCategory,
    onResetFilters = () => {},
    canAddLesson,
    onOpenAddLesson = () => {},
  }: Props = $props();

  let listEl = $state<HTMLDivElement | null>(null);

  const hasFilters = $derived(
    activeCategory !== 'Tất cả' || masteryFilter !== 'all' || searchQuery.trim().length > 0
  );
  const remaining = $derived(Math.max(0, progress.totalCount - progress.masteredCount));
  const filters: { id: MasteryFilter; label: string; count: number }[] = $derived([
    { id: 'all', label: 'Tất cả', count: progress.totalCount },
    { id: 'unmastered', label: 'Chưa thuộc', count: remaining },
    { id: 'mastered', label: 'Đã thuộc', count: progress.masteredCount },
  ]);

  $effect(() => {
    if (selectedLessonId === null) return;
    const container = listEl;
    if (!container || container.scrollHeight <= container.clientHeight + 4) return;
    const row = container.querySelector<HTMLElement>(
      `[data-lesson-row="${selectedLessonId}"]`
    );
    row?.scrollIntoView({ block: 'nearest' });
  });
</script>

<aside
  aria-label="Mục lục tủ sách"
  class="flex flex-col border-[var(--border-hairline)] bg-[var(--bg-sidebar)] max-lg:border-b lg:sticky lg:top-[var(--shell-offset)] lg:h-[calc(100dvh_-_var(--shell-offset))] lg:border-r"
>
  <div class="space-y-3 border-b border-[var(--border-hairline)] p-4">
    <div class="surface flex items-center gap-3.5 p-3">
      <div
        role="img"
        aria-label={`Đã thuộc ${progress.percentage}% số bài`}
        class="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full"
        style="background: conic-gradient(var(--accent) {progress.percentage}%, var(--border-hairline) 0);"
      >
        <span
          class="absolute inset-[3px] grid place-items-center rounded-full bg-[var(--bg-card)] font-mono text-[11.5px] font-semibold tabular-nums text-[var(--text-primary)]"
        >
          {progress.percentage}%
        </span>
      </div>
      <div class="min-w-0 flex-1">
        <span class="kicker">Tiến độ ghi nhớ</span>
        <p class="mt-0.5 text-[13px] font-semibold text-[var(--text-primary)]">
          <span class="font-mono tabular-nums">{progress.masteredCount}</span>
          <span class="text-[var(--text-muted)]"> / {progress.totalCount} bài</span>
        </p>
        <p class="mt-0.5 text-[11px] text-[var(--text-muted)]">
          {remaining === 0
            ? 'Đã hoàn thành toàn bộ tủ sách'
            : `Còn ${remaining} bài chưa thuộc`}
        </p>
      </div>
    </div>

    <div class="relative">
      <label for="lesson-search" class="sr-only">
        Tìm kiếm bài học theo tiêu đề, thuật ngữ hoặc nội dung
      </label>
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
        aria-hidden="true"
      />
      <input
        bind:this={searchInputEl}
        id="lesson-search"
        type="search"
        value={searchQuery}
        oninput={(event) => onSearchChange(event.currentTarget.value)}
        placeholder="Tìm khái niệm, tiêu đề..."
        class="field min-h-[40px] py-2 pl-9 pr-10 text-[13px]"
      />
      {#if searchQuery}
        <button
          type="button"
          in:fade={{ duration: 140, delay: 140, easing: cubicOut }}
          out:fade={{ duration: 140, easing: cubicOut }}
          onclick={() => onSearchChange('')}
          aria-label="Xóa từ khóa tìm kiếm"
          class="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <X class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      {:else}
        <kbd
          in:fade={{ duration: 140, delay: 140, easing: cubicOut }}
          out:fade={{ duration: 140, easing: cubicOut }}
          aria-hidden="true"
          class="kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">/</kbd>
      {/if}
    </div>

    <div
      class="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] p-1 md:hidden"
    >
      {#each filters as item (item.id)}
        {@const active = masteryFilter === item.id}
        <button
          type="button"
          onclick={() => onSelectMasteryFilter(item.id)}
          aria-pressed={active}
          class={`relative flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded px-2 text-[11.5px] font-medium whitespace-nowrap transition-colors ${
            active
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {#if active}
            <span
              transition:fade={{ duration: 150, easing: cubicOut }}
              aria-hidden="true"
              class="absolute inset-0 rounded bg-[var(--bg-subtle)] ring-1 ring-inset ring-[var(--border-hairline)]"
            ></span>
          {/if}
          <span class="relative z-10">{item.label}</span>
          <span class="relative z-10 font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
            {item.count}
          </span>
        </button>
      {/each}
    </div>

    {#if canAddLesson}
      <button type="button" onclick={onOpenAddLesson} class="btn btn-secondary w-full">
        <Plus class="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
        <span>Thêm bài mới</span>
      </button>
    {/if}
  </div>

  <div
    class="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] px-4 py-2 text-[11px] text-[var(--text-muted)]"
  >
    <span class="inline-flex items-center gap-1.5">
      <SlidersHorizontal class="h-3 w-3" aria-hidden="true" />
      <span class="font-mono tabular-nums">{lessons.length}</span> bài hiển thị
    </span>
    {#if hasFilters}
      <button
        type="button"
        onclick={onResetFilters}
        class="rounded px-1.5 py-0.5 font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
      >
        Xóa lọc
      </button>
    {/if}
  </div>

  <div bind:this={listEl} class="scroll-thin flex-1 overflow-y-auto py-1">
    {#if lessons.length === 0}
      <div
        in:fly={{ y: 6, duration: 220, easing: cubicOut }}
        class="space-y-3 p-8 text-center"
      >
        <p class="font-serif text-base text-[var(--text-primary)]">
          Không tìm thấy bài học phù hợp
        </p>
        <p class="text-xs leading-relaxed text-[var(--text-secondary)]">
          Thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ kho tri thức.
        </p>
        <button type="button" onclick={onResetFilters} class="btn btn-secondary">
          Xem tất cả bài học
        </button>
      </div>
    {:else}
      {#each lessons as lesson (lesson.id)}
        {@const isSelected = lesson.id === selectedLessonId}
        {@const isMastered = masteredIds.has(lesson.id)}
        {@const formattedNum = String(lesson.id).padStart(2, '0')}
        <button
          type="button"
          data-lesson-row={lesson.id}
          onclick={() => onSelectLesson(lesson.id)}
          aria-current={isSelected ? 'true' : undefined}
          class={`group relative block w-full px-4 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-[var(--accent)] ${
            isSelected ? '' : 'hover:bg-[var(--bg-card)]/55'
          }`}
        >
          {#if isSelected}
            <span
              transition:fade={{ duration: 150, easing: cubicOut }}
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 bg-[var(--bg-card)] shadow-[inset_2px_0_0_0_var(--accent),inset_0_1px_0_0_var(--border-hairline),inset_0_-1px_0_0_var(--border-hairline)]"
            ></span>
          {/if}

          <div class="relative z-10 flex items-start gap-2.5">
            <span
              aria-hidden="true"
              class={`mt-[3px] w-[18px] shrink-0 font-mono text-[10.5px] tabular-nums transition-colors ${
                isSelected ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {formattedNum}
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  class="{categoryTone(lesson.category)} h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cat)]"
                ></span>
                <span
                  class="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]"
                >
                  {lesson.category}
                </span>
                {#if isSelected}
                  <span
                    class="shrink-0 rounded bg-[var(--accent-soft)] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-[var(--accent)]"
                  >
                    Đang đọc
                  </span>
                {/if}
              </span>
              <span
                class={`mt-0.5 block font-serif text-[14.5px] leading-snug transition-colors ${
                  isSelected
                    ? 'font-semibold text-[var(--text-primary)]'
                    : 'font-medium text-[var(--text-primary)]/85 group-hover:text-[var(--text-primary)]'
                }`}
              >
                {lesson.title}
              </span>
            </span>

            {#if isMastered}
              <span
                transition:fade={{ duration: 180, easing: cubicOut }}
                title="Đã thuộc"
                class="mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[var(--mastered-soft)] text-[var(--mastered)]"
              >
                <Check class="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                <span class="sr-only">Đã thuộc</span>
              </span>
            {/if}
          </div>
        </button>
      {/each}
    {/if}
  </div>
</aside>
