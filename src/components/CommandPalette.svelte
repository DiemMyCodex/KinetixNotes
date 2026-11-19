<script lang="ts">
  import {
    ArrowUpRight,
    Keyboard,
    LogIn,
    LogOut,
    Moon,
    Plus,
    RotateCcw,
    Search,
    Shuffle,
    Sun,
    type LucideIcon,
  } from '@lucide/svelte';
  import { untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { categoryTone } from '../lib/categoryMeta';
  import { dialogA11y } from '../lib/dialogA11y';
  import type { Lesson, ThemeMode } from '../types/lesson';
  import { normalizeForSearch } from '../utils/lessons';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    lessons: Lesson[];
    onSelectLesson: (id: number) => void;
    onPickRandom: () => void;
    onResetFilters: () => void;
    onToggleTheme: () => void;
    theme: ThemeMode;
    userEmail: string | null;
    onOpenAuth: () => void;
    onSignOut: () => void;
    canAddLesson: boolean;
    onOpenAddLesson: () => void;
    onOpenShortcuts: () => void;
  }

  interface PaletteItem {
    key: string;
    label: string;
    hint: string;
    Icon?: LucideIcon;
    tone?: string;
    run: () => void;
  }

  interface PaletteSection {
    title: string;
    items: PaletteItem[];
  }

  let {
    isOpen,
    onClose,
    lessons,
    onSelectLesson,
    onPickRandom,
    onResetFilters,
    onToggleTheme,
    theme,
    userEmail,
    onOpenAuth,
    onSignOut,
    canAddLesson,
    onOpenAddLesson,
    onOpenShortcuts,
  }: Props = $props();

  let panelRef = $state<HTMLDivElement | null>(null);
  let query = $state('');
  let activeIndex = $state(0);

  $effect(() => {
    if (isOpen) {
      query = '';
      activeIndex = 0;
    }
  });

  const sections: PaletteSection[] = $derived.by(() => {
    const normalized = normalizeForSearch(query);

    const lessonMatches = (normalized
      ? lessons.filter((lesson) => {
          const haystack = normalizeForSearch(
            `${lesson.title} ${lesson.summary} ${lesson.category} ${lesson.points.join(' ')}`
          );
          return haystack.includes(normalized);
        })
      : lessons
    )
      .slice(0, normalized ? 8 : 5)
      .map<PaletteItem>((lesson) => ({
        key: `lesson-${lesson.id}`,
        label: lesson.title,
        hint: lesson.category,
        tone: categoryTone(lesson.category),
        run: () => onSelectLesson(lesson.id),
      }));

    const actions: PaletteItem[] = [
      {
        key: 'random',
        label: 'Ôn bài ngẫu nhiên',
        hint: 'R',
        Icon: Shuffle,
        run: onPickRandom,
      },
      {
        key: 'theme',
        label: theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối',
        hint: 'T',
        Icon: theme === 'dark' ? Sun : Moon,
        run: onToggleTheme,
      },
      {
        key: 'reset',
        label: 'Xóa bộ lọc, xem tất cả bài',
        hint: 'Tất cả',
        Icon: RotateCcw,
        run: onResetFilters,
      },
      {
        key: 'shortcuts',
        label: 'Xem danh sách phím tắt',
        hint: '?',
        Icon: Keyboard,
        run: onOpenShortcuts,
      },
    ];

    if (canAddLesson) {
      actions.splice(2, 0, {
        key: 'add',
        label: 'Thêm bài học mới',
        hint: 'Quản trị',
        Icon: Plus,
        run: onOpenAddLesson,
      });
    }

    actions.push(
      userEmail
        ? {
            key: 'signout',
            label: 'Đăng xuất khỏi tài khoản',
            hint: userEmail,
            Icon: LogOut,
            run: onSignOut,
          }
        : {
            key: 'signin',
            label: 'Đăng nhập để đồng bộ tiến độ',
            hint: 'Supabase',
            Icon: LogIn,
            run: onOpenAuth,
          }
    );

    const actionMatches = normalized
      ? actions.filter((action) => normalizeForSearch(action.label).includes(normalized))
      : actions;

    const result: PaletteSection[] = [];
    if (lessonMatches.length > 0) {
      result.push({ title: normalized ? 'Bài học phù hợp' : 'Bài học', items: lessonMatches });
    }
    result.push({ title: 'Hành động', items: actionMatches });
    return result;
  });

  const flatItems = $derived(sections.flatMap((section) => section.items));

  // Global index for each option, mirroring React's render-time cursor.
  const indexedSections = $derived.by(() => {
    let cursor = 0;
    return sections
      .filter((section) => section.items.length > 0)
      .map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({ item, index: cursor++ })),
      }));
  });

  $effect(() => {
    const maxIndex = Math.max(0, flatItems.length - 1);
    const current = untrack(() => activeIndex);
    if (current > maxIndex) {
      activeIndex = maxIndex;
    }
  });

  $effect(() => {
    if (!isOpen) return;
    const node = panelRef?.querySelector<HTMLElement>(`[data-palette-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  });

  function runItem(item: PaletteItem | undefined) {
    if (!item) return;
    onClose();
    item.run();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % Math.max(1, flatItems.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + flatItems.length) % Math.max(1, flatItems.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(flatItems[activeIndex]);
    }
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 160 }}
      role="presentation"
    onmousedown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
    class="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 p-4 pt-[10vh] backdrop-blur-[3px] sm:pt-[14vh]"
  >
    <div
      bind:this={panelRef}
      use:dialogA11y={{ active: isOpen, onClose }}
      role="dialog"
      aria-modal="true"
      aria-label="Bảng tìm kiếm và lệnh nhanh"
      in:fly={{ y: -10, duration: 200, easing: cubicOut }}
      out:fly={{ y: -8, duration: 200, easing: cubicOut }}
      class="w-full max-w-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
    >
      <div class="flex items-center gap-2.5 border-b border-[var(--border-hairline)] px-3.5">
        <Search
          size={16}
          class="h-4 w-4 shrink-0 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          data-autofocus
          type="text"
          value={query}
          oninput={(event) => {
            query = event.currentTarget.value;
            activeIndex = 0;
          }}
          onkeydown={handleKeyDown}
          placeholder="Tìm bài học hoặc chạy một lệnh..."
          aria-label="Tìm bài học hoặc lệnh"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={flatItems[activeIndex] ? `palette-item-${activeIndex}` : undefined}
          aria-autocomplete="list"
          class="h-12 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
        <kbd class="kbd shrink-0">Esc</kbd>
      </div>

      <div
        id="palette-results"
        role="listbox"
        aria-label="Kết quả"
        class="scroll-thin max-h-[min(58vh,430px)] overflow-y-auto p-2"
      >
        {#if flatItems.length === 0}
          <p class="px-3 py-8 text-center text-xs text-[var(--text-secondary)]">
            Không có kết quả cho “{query}”.
          </p>
        {:else}
          {#each indexedSections as section (section.title)}
            <div class="mb-1.5">
              <p class="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                {section.title}
              </p>
              {#each section.items as entry (entry.item.key)}
                {@const item = entry.item}
                {@const index = entry.index}
                {@const isActive = index === activeIndex}
                {@const Icon = item.Icon}
                <button
                  id={`palette-item-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-palette-index={index}
                  onmousemove={() => (activeIndex = index)}
                  onclick={() => runItem(item)}
                  class={`relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {#if Icon}
                    <Icon
                      size={16}
                      class={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                      }`}
                      aria-hidden="true"
                    />
                  {:else}
                    <span
                      aria-hidden="true"
                      class={`${item.tone ?? 'cat-all'} h-2 w-2 shrink-0 rounded-full bg-[var(--cat)]`}
                    ></span>
                  {/if}
                  <span class="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {item.label}
                  </span>
                  <span class="shrink-0 text-[10.5px] text-[var(--text-muted)]">
                    {item.hint}
                  </span>
                  {#if isActive}
                    <ArrowUpRight
                      size={12}
                      class="h-3 w-3 shrink-0 text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <div class="flex items-center justify-between border-t border-[var(--border-hairline)] px-3.5 py-2 text-[10.5px] text-[var(--text-muted)]">
        <span class="inline-flex items-center gap-1.5">
          <kbd class="kbd">↑</kbd>
          <kbd class="kbd">↓</kbd>
          <span>di chuyển</span>
          <kbd class="kbd">↵</kbd>
          <span>chọn</span>
        </span>
        <span class="font-mono tabular-nums">{flatItems.length} mục</span>
      </div>
    </div>
  </div>
{/if}
