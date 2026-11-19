<script lang="ts">
  import { BookOpen, Library, Moon, Search, Shuffle, Sun } from '@lucide/svelte';
  import type { ThemeMode } from '../types/lesson';

  interface Props {
    pane: 'list' | 'reader';
    onSelectList: () => void;
    onSelectReader: () => void;
    onOpenPalette: () => void;
    onPickRandom: () => void;
    theme: ThemeMode;
    onToggleTheme: () => void;
  }

  let {
    pane,
    onSelectList = () => {},
    onSelectReader = () => {},
    onOpenPalette = () => {},
    onPickRandom = () => {},
    theme,
    onToggleTheme = () => {},
  }: Props = $props();

  const tabs = $derived([
    { id: 'list', label: 'Tủ sách', Icon: Library, active: pane === 'list', run: onSelectList },
    { id: 'reader', label: 'Đọc', Icon: BookOpen, active: pane === 'reader', run: onSelectReader },
    { id: 'search', label: 'Tìm', Icon: Search, active: false, run: onOpenPalette },
    { id: 'random', label: 'Ôn tập', Icon: Shuffle, active: false, run: onPickRandom },
    {
      id: 'theme',
      label: theme === 'dark' ? 'Sáng' : 'Tối',
      Icon: theme === 'dark' ? Sun : Moon,
      active: false,
      run: onToggleTheme,
    },
  ]);
</script>

<nav
  aria-label="Điều hướng nhanh trên di động"
  class="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-hairline)] bg-[var(--bg-glass)] pb-[var(--safe-bottom)] backdrop-blur-xl lg:hidden"
>
  <div class="mx-auto grid h-[var(--tabbar-h)] max-w-[560px] grid-cols-5 px-2">
    {#each tabs as tab (tab.id)}
      {@const Icon = tab.Icon}
      <button
        type="button"
        onclick={tab.run}
        aria-current={tab.active ? 'page' : undefined}
        class={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
          tab.active
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span
          aria-hidden="true"
          class={`absolute inset-x-3 inset-y-1.5 rounded-lg bg-[var(--accent-soft)] transition-opacity duration-200 ${tab.active ? 'opacity-100' : 'opacity-0'}`}
        ></span>
        <Icon class="relative z-10 h-[18px] w-[18px]" aria-hidden="true" />
        <span class="relative z-10">{tab.label}</span>
      </button>
    {/each}
  </div>
</nav>
