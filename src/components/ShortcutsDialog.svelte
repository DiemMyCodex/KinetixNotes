<script lang="ts">
  import { Command, X } from '@lucide/svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { dialogA11y } from '../lib/dialogA11y';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  interface Shortcut {
    keys: string[];
    label: string;
  }

  const SHORTCUTS: Shortcut[] = [
    { keys: ['⌘', 'K'], label: 'Mở bảng tìm kiếm & lệnh nhanh' },
    { keys: ['/'], label: 'Focus ô tìm kiếm trong tủ sách' },
    { keys: ['←', '→'], label: 'Chuyển bài trước / bài tiếp theo' },
    { keys: ['T'], label: 'Đổi giao diện sáng / tối' },
    { keys: ['R'], label: 'Ôn một bài ngẫu nhiên' },
    { keys: ['?'], label: 'Mở bảng phím tắt này' },
    { keys: ['Esc'], label: 'Đóng hộp thoại đang mở' },
  ];

  let { isOpen, onClose }: Props = $props();
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 160 }}
      role="presentation"
    onmousedown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
  >
    <div
      use:dialogA11y={{ active: isOpen, onClose }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      in:fly={{ y: 10, duration: 200, easing: cubicOut }}
      out:fly={{ y: 8, duration: 200, easing: cubicOut }}
      class="w-full max-w-[460px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
    >
      <div class="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] px-5 py-4">
        <div>
          <h2
            id="shortcuts-title"
            class="font-serif text-lg font-semibold text-[var(--text-primary)]"
          >
            Phím tắt
          </h2>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            Điều khiển tủ sách mà không cần rời bàn phím.
          </p>
        </div>
        <button
          type="button"
          onclick={onClose}
          data-autofocus
          aria-label="Đóng bảng phím tắt"
          class="icon-btn h-8 w-8 shrink-0"
        >
          <X size={16} class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <ul class="divide-y divide-[var(--border-hairline)] px-5">
        {#each SHORTCUTS as shortcut (shortcut.label)}
          <li class="flex items-center justify-between gap-4 py-2.5">
            <span class="text-[13px] text-[var(--text-secondary)]">
              {shortcut.label}
            </span>
            <span class="inline-flex shrink-0 items-center gap-1">
              {#each shortcut.keys as key (key)}
                <kbd class="kbd h-[22px] min-w-[22px]">
                  {#if key === '⌘'}
                    <Command size={12} class="h-3 w-3" />
                  {:else}
                    {key}
                  {/if}
                </kbd>
              {/each}
            </span>
          </li>
        {/each}
      </ul>

      <p class="border-t border-[var(--border-hairline)] px-5 py-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
        Trên thiết bị cảm ứng, vuốt ngang trong bài viết để chuyển bài. Trên macOS dùng ⌘,
        trên Windows/Linux dùng Ctrl.
      </p>
    </div>
  </div>
{/if}
