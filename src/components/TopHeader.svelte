<script lang="ts">
  import { Command, Flame, LogIn, LogOut, Moon, Search, Sun } from '@lucide/svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import type { MasteryFilter, ThemeMode } from '../types/lesson';

  interface Props {
    theme: ThemeMode;
    onToggleTheme?: () => void;
    masteryFilter: MasteryFilter;
    onSelectMasteryFilter?: (filter: MasteryFilter) => void;
    onPickRandomLesson?: () => void;
    readingProgress: number;
    masteredCount: number;
    totalCount: number;
    onLogoClick?: () => void;
    userEmail: string | null;
    onOpenAuth?: () => void;
    onSignOut?: () => void;
    isAuthScreen: boolean;
    onOpenPalette?: () => void;
    streak: number;
  }

  let {
    theme,
    onToggleTheme = () => {},
    masteryFilter,
    onSelectMasteryFilter = () => {},
    onPickRandomLesson = () => {},
    readingProgress,
    masteredCount,
    totalCount,
    onLogoClick = () => {},
    userEmail,
    onOpenAuth = () => {},
    onSignOut = () => {},
    isAuthScreen,
    onOpenPalette = () => {},
    streak,
  }: Props = $props();

  const navItems: { id: MasteryFilter; label: string; count: number }[] = $derived([
    { id: 'all', label: 'Tất cả', count: totalCount },
    { id: 'unmastered', label: 'Chưa thuộc', count: Math.max(0, totalCount - masteredCount) },
    { id: 'mastered', label: 'Đã thuộc', count: masteredCount },
  ]);
</script>

<div class="relative border-b border-[var(--border-hairline)] bg-[var(--bg-glass)] backdrop-blur-xl">
  <div
    class="mx-auto flex h-[var(--header-h)] max-w-[var(--shell-max)] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8"
  >
    <a
      href="/"
      onclick={(event) => {
        event.preventDefault();
        onLogoClick();
      }}
      aria-label="KinetixNotes — về tủ sách"
      class="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      <span
        aria-hidden="true"
        class="grid h-7 w-7 place-items-center rounded-[8px] bg-[var(--text-primary)] font-serif text-[15px] font-semibold leading-none text-[var(--bg-canvas)] transition-transform duration-200 group-hover:-rotate-3"
      >
        K
      </span>
      <span
        class="font-serif text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] whitespace-nowrap max-[359px]:hidden"
      >
        KinetixNotes
      </span>
    </a>

    {#if !isAuthScreen}
      <nav aria-label="Phạm vi bài học" class="ml-2 hidden items-center gap-1 md:flex">
        {#each navItems as item (item.id)}
          {@const isActive = masteryFilter === item.id}
          <button
            type="button"
            onclick={() => onSelectMasteryFilter(item.id)}
            aria-pressed={isActive}
            class={`relative inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              isActive
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
          >
            {#if isActive}
              <span
                transition:fade={{ duration: 150, easing: cubicOut }}
                aria-hidden="true"
                class="absolute inset-0 rounded-md bg-[var(--bg-subtle)] shadow-[inset_0_0_0_1px_var(--border-hairline)]"
              ></span>
            {/if}
            <span class="relative z-10">{item.label}</span>
            <span
              class="relative z-10 font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]"
            >
              {item.count}
            </span>
          </button>
        {/each}
        <button
          type="button"
          onclick={onPickRandomLesson}
          class="ml-1 inline-flex min-h-[32px] items-center rounded-md px-2.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:scale-[0.96]"
        >
          Ôn ngẫu nhiên
        </button>
      </nav>
    {:else}
      <span class="hidden md:block"></span>
    {/if}

    <div class="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onclick={onOpenPalette}
        aria-label="Mở bảng tìm kiếm và lệnh nhanh"
        class="inline-flex h-[38px] items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <Search class="h-4 w-4" aria-hidden="true" />
        <span class="hidden text-xs font-medium lg:inline">Tìm &amp; lệnh</span>
        <span class="hidden items-center gap-0.5 lg:inline-flex" aria-hidden="true">
          <kbd class="kbd">
            <Command class="h-2.5 w-2.5" />
          </kbd>
          <kbd class="kbd">K</kbd>
        </span>
      </button>

      {#if streak > 0}
        <span
          class="hidden h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] sm:inline-flex"
          title="Chuỗi {streak} ngày đọc liên tiếp"
        >
          <Flame class="h-3.5 w-3.5 text-[var(--cat-mind)]" aria-hidden="true" />
          <span class="font-mono tabular-nums">{streak}</span>
          <span class="sr-only">ngày đọc liên tiếp</span>
        </span>
      {/if}

      {#if !isAuthScreen && userEmail}
        <button
          type="button"
          onclick={onSignOut}
          title="Đăng xuất {userEmail}"
          class="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
          aria-label="Đăng xuất khỏi {userEmail}"
        >
          <LogOut class="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
          <span class="hidden text-xs font-medium sm:inline">Đăng xuất</span>
        </button>
      {:else if !isAuthScreen}
        <button
          type="button"
          onclick={onOpenAuth}
          class="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
        >
          <LogIn
            class="h-3.5 w-3.5 text-[var(--text-secondary)] sm:hidden"
            aria-hidden="true"
          />
          <span class="max-sm:sr-only">Đăng nhập</span>
        </button>
      {/if}

      <button
        type="button"
        onclick={onToggleTheme}
        aria-label={theme === 'dark'
          ? 'Chuyển sang giao diện sáng'
          : 'Chuyển sang giao diện tối'}
        title={theme === 'dark' ? 'Giao diện sáng (T)' : 'Giao diện tối (T)'}
        class="icon-btn"
      >
        {#if theme === 'dark'}
          <span
            class="inline-flex"
            in:fade={{ duration: 160, delay: 160, easing: cubicOut }}
            out:fade={{ duration: 160, easing: cubicOut }}
          >
            <Sun class="h-4 w-4 text-[var(--cat-mind)]" aria-hidden="true" />
          </span>
        {:else}
          <span
            class="inline-flex"
            in:fade={{ duration: 160, delay: 160, easing: cubicOut }}
            out:fade={{ duration: 160, easing: cubicOut }}
          >
            <Moon class="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
          </span>
        {/if}
      </button>
    </div>
  </div>

  <div aria-hidden="true" class="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
    <div
      class="h-full origin-left bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--cat-ai)] transition-transform duration-150 ease-out"
      style="transform: scaleX({isAuthScreen
        ? 0
        : Math.min(1, Math.max(0, readingProgress))});"
    ></div>
  </div>
</div>
