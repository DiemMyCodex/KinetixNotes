<script lang="ts">
  import { Loader2, X } from '@lucide/svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { dialogA11y } from '../lib/dialogA11y';
  import { parsePointsTextarea } from '../services/supabaseHelpers';
  import type { Category, NewLessonInput } from '../types/lesson';
  import { CATEGORY_LIST } from '../utils/lessons';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmitLesson: (input: NewLessonInput) => Promise<{ error: string | null }>;
  }

  let { isOpen, onClose, onSubmitLesson }: Props = $props();

  let category = $state<Category>('Trí tuệ AI');
  let title = $state('');
  let summary = $state('');
  let pointsText = $state('');
  let quiz = $state('');
  let answer = $state('');
  let isSaving = $state(false);
  let errorMsg = $state<string | null>(null);

  const pointsCount = $derived(parsePointsTextarea(pointsText).length);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMsg = null;

    const parsedPoints = parsePointsTextarea(pointsText);
    if (!title.trim()) {
      errorMsg = 'Vui lòng nhập tiêu đề bài học.';
      return;
    }
    if (!summary.trim()) {
      errorMsg = 'Vui lòng nhập phần tóm tắt.';
      return;
    }
    if (parsedPoints.length === 0) {
      errorMsg = 'Vui lòng nhập ít nhất 1 ý chính.';
      return;
    }
    if (!quiz.trim() || !answer.trim()) {
      errorMsg = 'Vui lòng nhập đầy đủ câu hỏi ôn tập và đáp án.';
      return;
    }

    isSaving = true;
    const { error } = await onSubmitLesson({
      category,
      title: title.trim(),
      summary: summary.trim(),
      points: parsedPoints,
      quiz: quiz.trim(),
      answer: answer.trim(),
    });
    isSaving = false;

    if (error) {
      errorMsg = error;
      return;
    }

    title = '';
    summary = '';
    pointsText = '';
    quiz = '';
    answer = '';
    onClose();
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 180 }}
      role="presentation"
    onmousedown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
  >
    <div
      use:dialogA11y={{ active: isOpen, onClose }}
      in:fly={{ y: 12, duration: 220, easing: cubicOut }}
      out:fly={{ y: 8, duration: 220, easing: cubicOut }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-lesson-title"
      class="flex max-h-[90dvh] w-full max-w-[580px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
    >
      <div class="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] px-5 py-4">
        <div>
          <h2 id="add-lesson-title" class="font-serif text-xl font-semibold text-[var(--text-primary)]">
            Thêm bài học mới
          </h2>
          <p class="mt-1 text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
            Bài học được lưu vào bảng <code class="font-mono text-[10.5px]">lessons</code> trên
            Supabase và gắn với tài khoản quản trị.
          </p>
        </div>
        <button
          type="button"
          onclick={onClose}
          aria-label="Đóng hộp thoại"
          class="icon-btn h-8 w-8 shrink-0"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onsubmit={handleSubmit} novalidate class="flex min-h-0 flex-1 flex-col">
        <div class="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label
              for="new-lesson-category"
              class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              Tủ sách
            </label>
            <select
              id="new-lesson-category"
              bind:value={category}
              class="field min-h-[40px] text-[13px]"
            >
              {#each CATEGORY_LIST as cat (cat)}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div>
            <label
              for="new-lesson-title"
              class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              Tiêu đề
            </label>
            <input
              id="new-lesson-title"
              data-autofocus
              type="text"
              bind:value={title}
              placeholder="Ví dụ: Cơ chế Attention trong Transformer"
              class="field min-h-[40px] text-[13px]"
            />
          </div>

          <div>
            <label
              for="new-lesson-summary"
              class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              Tóm tắt ngắn
            </label>
            <textarea
              id="new-lesson-summary"
              rows={2}
              bind:value={summary}
              placeholder="Một đến hai câu tóm gọn ý tưởng trọng tâm..."
              class="field min-h-[64px] resize-y text-[13px]"></textarea>
          </div>

          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label
                for="new-lesson-points"
                class="text-[11.5px] font-semibold text-[var(--text-secondary)]"
              >
                Các ý chính (mỗi dòng một ý)
              </label>
              <span class="font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]">
                {pointsCount} ý
              </span>
            </div>
            <textarea
              id="new-lesson-points"
              rows={4}
              bind:value={pointsText}
              placeholder="Mỗi dòng một ý chính, giải thích rõ từ viết tắt..."
              class="field min-h-[104px] resize-y text-[13px]"></textarea>
          </div>

          <div>
            <label
              for="new-lesson-quiz"
              class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              Câu hỏi ôn tập
            </label>
            <input
              id="new-lesson-quiz"
              type="text"
              bind:value={quiz}
              placeholder="Câu hỏi gợi nhớ chủ động..."
              class="field min-h-[40px] text-[13px]"
            />
          </div>

          <div>
            <label
              for="new-lesson-answer"
              class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
            >
              Đáp án
            </label>
            <textarea
              id="new-lesson-answer"
              rows={2}
              bind:value={answer}
              placeholder="Câu trả lời ngắn gọn, súc tích..."
              class="field min-h-[64px] resize-y text-[13px]"></textarea>
          </div>

          {#if errorMsg}
            <div
              role="alert"
              class="rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--danger)]"
            >
              {errorMsg}
            </div>
          {/if}
        </div>

        <div
          class="flex items-center justify-end gap-2.5 border-t border-[var(--border-hairline)] bg-[var(--bg-subtle)]/60 px-5 py-3"
        >
          <button type="button" onclick={onClose} class="btn btn-secondary">Hủy</button>
          <button type="submit" disabled={isSaving} class="btn btn-primary min-w-[112px]">
            {#if isSaving}
              <Loader2 class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {/if}
            <span>{isSaving ? 'Đang lưu...' : 'Lưu bài học'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
