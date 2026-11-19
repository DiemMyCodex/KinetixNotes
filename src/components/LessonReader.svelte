<script lang="ts">
  import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    ChevronDown,
    Clock3,
    Link2,
  } from '@lucide/svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';
  import { categoryTone } from '../lib/categoryMeta';
  import { lessonUrl } from '../lib/router';
  import type { Lesson } from '../types/lesson';
  import {
    estimateReadMinutes,
    formatShortDate,
    splitPointLead,
    tokenizeTechnicalTerms,
  } from '../utils/lessons';

  interface Props {
    lesson: Lesson | null;
    pageDirection: 1 | -1;
    totalVisible: number;
    currentIndex: number;
    prevLesson: Lesson | null;
    nextLesson: Lesson | null;
    onSelectLesson: (id: number) => void;
    isMastered: boolean;
    onToggleMastered: (id: number) => void;
    fontSizePx: number;
    onIncreaseFont: () => void;
    onDecreaseFont: () => void;
    canIncreaseFont: boolean;
    canDecreaseFont: boolean;
    onBackToListMobile: () => void;
    onResetFilters: () => void;
    readingProgress: number;
  }

  let {
    lesson,
    pageDirection = 1,
    totalVisible = 0,
    currentIndex = 0,
    prevLesson = null,
    nextLesson = null,
    onSelectLesson = () => {},
    isMastered = false,
    onToggleMastered = () => {},
    fontSizePx = 16,
    onIncreaseFont = () => {},
    onDecreaseFont = () => {},
    canIncreaseFont = false,
    canDecreaseFont = false,
    onBackToListMobile = () => {},
    onResetFilters = () => {},
    readingProgress = 0,
  }: Props = $props();

  let showAnswer = $state(false);
  let copied = $state(false);
  let touchStart = $state<{ x: number; y: number } | null>(null);

  $effect(() => {
    void lesson?.id;
    showAnswer = false;
    copied = false;
  });

  $effect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => {
      copied = false;
    }, 2000);
    return () => window.clearTimeout(timer);
  });

  const readMinutes = $derived(lesson ? estimateReadMinutes(lesson) : 0);
  const remainingMinutes = $derived(
    Math.max(0, Math.round(readMinutes * (1 - readingProgress)))
  );
  const readPercent = $derived(Math.round(Math.min(1, Math.max(0, readingProgress)) * 100));
  const formattedNumber = $derived(String(lesson?.id ?? 0).padStart(2, '0'));

  const handleShare = async () => {
    if (!lesson) return;
    const url = lessonUrl(lesson.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: lesson.title, text: lesson.summary, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      copied = false;
    }
  };

  const handleTouchStart = (event: TouchEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, [data-no-swipe]')) {
      touchStart = null;
      return;
    }
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStart;
    touchStart = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (window.getSelection()?.toString()) return;

    if (dx < 0 && nextLesson) {
      onSelectLesson(nextLesson.id);
    } else if (dx > 0 && prevLesson) {
      onSelectLesson(prevLesson.id);
    }
  };
</script>

{#snippet renderSegments(text: string, keyPrefix: string)}
  {#each tokenizeTechnicalTerms(text) as segment, index (`${keyPrefix}-${index}`)}
    {#if segment.isMono}
      <code class="rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[0.83em] font-medium text-[var(--text-primary)]">{segment.text}</code>
    {:else}
      <span>{segment.text}</span>
    {/if}
  {/each}
{/snippet}

{#if !lesson}
  <section
    in:fly={{ y: 8, duration: 240, easing: cubicOut }}
    class="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center"
  >
    <div class="max-w-md space-y-4">
      <BookOpen class="mx-auto h-7 w-7 text-[var(--text-muted)]" aria-hidden="true" />
      <h2 class="font-serif text-2xl font-medium text-[var(--text-primary)]">
        Chưa có bài học được chọn
      </h2>
      <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
        Chọn một bài trong danh sách hoặc đặt lại bộ lọc để bắt đầu đọc và ôn tập.
      </p>
      <button type="button" onclick={onResetFilters} class="btn btn-primary">
        Hiển thị tất cả bài học
      </button>
    </div>
  </section>
{:else}
  <section
    aria-label="Nội dung bài học"
    ontouchstart={handleTouchStart}
    ontouchend={handleTouchEnd}
    class="flex min-w-0 flex-col bg-[var(--bg-canvas)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] px-4 py-2.5 sm:px-8 lg:px-12">
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onclick={onBackToListMobile}
          class="btn btn-secondary min-h-[36px] px-2.5 lg:hidden"
        >
          <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" />
          <span>Tủ sách</span>
        </button>

        <div class="flex min-w-0 items-center gap-2 text-[11.5px] text-[var(--text-secondary)]">
          {#key formattedNumber}
            <span
              in:fly={{ y: 4, duration: 160, easing: cubicOut }}
              out:fly={{ y: -4, duration: 160, easing: cubicOut }}
              class="font-mono font-medium tabular-nums text-[var(--text-primary)]"
            >
              Bài {formattedNumber}
            </span>
          {/key}
          <span aria-hidden="true" class="text-[var(--border-strong)]">/</span>
          <span class="font-mono tabular-nums">{currentIndex + 1} trong {totalVisible}</span>
          <span aria-hidden="true" class="hidden text-[var(--border-strong)] sm:inline">·</span>
          <span class="hidden items-center gap-1 tabular-nums sm:inline-flex">
            <Clock3 class="h-3 w-3" aria-hidden="true" />
            {remainingMinutes > 0 ? `~${remainingMinutes} phút còn lại` : 'Đã đọc xong'}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <span
          class="mr-0.5 hidden rounded-full bg-[var(--accent-soft)] px-2 py-1 font-mono text-[10.5px] font-semibold tabular-nums text-[var(--accent)] sm:inline"
          title={`Đã đọc ${readPercent}% bài này`}
        >
          {readPercent}%
        </span>

        <button
          type="button"
          onclick={handleShare}
          class="icon-btn h-[34px] w-[34px]"
          aria-label="Sao chép liên kết bài học"
          title="Chia sẻ bài học"
        >
          {#if copied}
            <Check class="h-3.5 w-3.5 text-[var(--mastered)]" aria-hidden="true" />
          {:else}
            <Link2 class="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
          {/if}
        </button>

        <div
          role="group"
          aria-label="Điều chỉnh cỡ chữ"
          class="inline-flex items-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)]"
        >
          <button
            type="button"
            onclick={onDecreaseFont}
            disabled={!canDecreaseFont}
            aria-label="Giảm cỡ chữ"
            class="min-h-[34px] min-w-[34px] px-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:pointer-events-none disabled:opacity-35"
          >
            A−
          </button>
          <span class="border-x border-[var(--border-hairline)] px-1.5 font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]">
            {fontSizePx}
          </span>
          <button
            type="button"
            onclick={onIncreaseFont}
            disabled={!canIncreaseFont}
            aria-label="Tăng cỡ chữ"
            class="min-h-[34px] min-w-[34px] px-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:pointer-events-none disabled:opacity-35"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          onclick={() => onToggleMastered(lesson.id)}
          aria-pressed={isMastered}
          class={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            isMastered
              ? 'border-[var(--mastered)]/40 bg-[var(--mastered-soft)] text-[var(--mastered)]'
              : 'border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <span class={`inline-flex transition-transform duration-200 ${isMastered ? 'scale-110' : 'scale-100'}`}>
            <Check
              class={`h-3.5 w-3.5 ${isMastered ? 'stroke-[2.6]' : 'opacity-55'}`}
              aria-hidden="true"
            />
          </span>
          <span class="max-sm:hidden">{isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}</span>
          <span class="sr-only sm:hidden">{isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}</span>
        </button>
      </div>
    </div>

    <span aria-live="polite" class="sr-only">
      {copied ? 'Đã sao chép liên kết bài học' : ''}
    </span>

    <div class="relative overflow-x-hidden px-4 py-8 sm:px-8 sm:py-12 lg:px-14">
      {#key lesson.id}
        <article
          in:fly={{ x: pageDirection * 28, duration: 220, easing: cubicOut }}
          class="mx-auto w-full max-w-[65ch]"
        >
          <div class="mb-4 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--text-secondary)]">
            <span
              class={`${categoryTone(lesson.category)} inline-flex items-center gap-1.5 rounded-full bg-[var(--cat-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cat)]`}
            >
              <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-[var(--cat)]"></span>
              {lesson.category}
            </span>
            <span aria-hidden="true" class="text-[var(--border-strong)]">·</span>
            <span class="font-mono tabular-nums">{formatShortDate(lesson.createdAt)}</span>
            <span aria-hidden="true" class="text-[var(--border-strong)]">·</span>
            <span class="inline-flex items-center gap-1">
              <Clock3 class="h-3 w-3" aria-hidden="true" />
              {readMinutes} phút đọc
            </span>
            {#if isMastered}
              <span
                transition:fly={{ x: -4, duration: 180, easing: cubicOut }}
                class="inline-flex items-center gap-1 font-semibold text-[var(--mastered)]"
              >
                <span aria-hidden="true" class="text-[var(--border-strong)]">·</span>
                <Check class="h-3 w-3 stroke-[2.6]" aria-hidden="true" />
                <span>Hoàn thành</span>
              </span>
            {/if}
          </div>

          <h1
            class="font-serif font-semibold tracking-[-0.021em] text-[var(--text-primary)]"
            style="font-size: clamp(1.9rem, 2.4vw + 1rem, 2.7rem); line-height: 1.16;"
          >
            {lesson.title}
          </h1>

          <p
            class="prose-reading mt-5 font-serif text-[var(--text-secondary)] [text-wrap:pretty]"
            style="font-size: {(fontSizePx + 1.5) / 16}rem; line-height: 1.66;"
          >
            {lesson.summary}
          </p>

          <div class="mt-8 mb-9 flex items-center gap-3" aria-hidden="true">
            <span
              in:fade={{ duration: 350, easing: cubicOut }}
              class={`${categoryTone(lesson.category)} h-[1.5px] w-10 origin-left bg-[var(--cat)]`}
            ></span>
            <span class="h-px flex-1 bg-[var(--border-hairline)]"></span>
          </div>

          <div class="space-y-5">
            <h2 class="kicker">Điểm cốt lõi &amp; Giải nghĩa thuật ngữ</h2>

            <ol class="divide-y divide-[var(--border-hairline)]/70">
              {#each lesson.points as point, index (`${lesson.id}-pt-${index}`)}
                {@const { leadTerm, explanation, rest } = splitPointLead(point)}
                {@const pointIndex = String(index + 1).padStart(2, '0')}
                <li
                  in:fly={{
                    y: 8,
                    duration: 240,
                    delay: Math.min(index * 40, 200),
                    easing: cubicOut,
                  }}
                  class="flex items-start gap-3.5 py-4 first:pt-1 last:pb-1"
                >
                  <span
                    aria-hidden="true"
                    class="mt-1.5 w-5 shrink-0 select-none font-mono text-[11px] font-medium tabular-nums text-[var(--accent)]"
                  >
                    {pointIndex}
                  </span>
                  <p
                    class="prose-reading min-w-0 flex-1 font-serif text-[var(--text-primary)] [text-wrap:pretty]"
                    style="font-size: {fontSizePx / 16}rem; line-height: 1.72;"
                  >
                    {#if leadTerm}
                      <span class="lead-highlight font-semibold text-[var(--text-primary)]">{@render renderSegments(leadTerm, `${lesson.id}-${index}-lead`)}</span>{' '}
                      <span class="font-sans text-[0.87em] text-[var(--text-secondary)]">({explanation})</span>{' '}
                      {@render renderSegments(rest, `${lesson.id}-${index}-rest`)}
                    {:else}
                      {@render renderSegments(point, `${lesson.id}-${index}-full`)}
                    {/if}
                  </p>
                </li>
              {/each}
            </ol>
          </div>

          <div class="relative mt-11 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
            <span
              aria-hidden="true"
              class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/70 to-transparent"
            ></span>
            <div class="flex items-center justify-between gap-4">
              <span class="kicker text-[var(--accent)]">Ôn tập chủ động</span>
              <span class="font-mono text-[10.5px] text-[var(--text-muted)]">
                Kiểm tra trí nhớ
              </span>
            </div>

            <p
              class="mt-3.5 font-serif font-medium text-[var(--text-primary)] [text-wrap:pretty]"
              style="font-size: {(fontSizePx + 0.5) / 16}rem; line-height: 1.65;"
            >
              {lesson.quiz}
            </p>

            <div class="mt-5 flex flex-wrap items-center gap-2.5" data-no-swipe>
              <button
                type="button"
                aria-expanded={showAnswer}
                onclick={() => (showAnswer = !showAnswer)}
                class="btn btn-secondary min-h-[40px] px-4 active:scale-[0.97]"
              >
                <span>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                <span
                  class={`inline-flex transition-transform duration-200 ${showAnswer ? 'rotate-180' : ''}`}
                >
                  <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>

              {#if showAnswer && !isMastered}
                <button
                  type="button"
                  transition:fly={{ x: -6, duration: 180, easing: cubicOut }}
                  onclick={() => onToggleMastered(lesson.id)}
                  class="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--mastered)]/35 bg-[var(--mastered-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--mastered)] transition-colors hover:border-[var(--mastered)]/60 active:scale-[0.96]"
                >
                  <Check class="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đánh dấu đã thuộc</span>
                </button>
              {/if}
            </div>

            {#if showAnswer}
              <div transition:slide={{ duration: 260, easing: cubicOut }} class="overflow-hidden">
                <div
                  in:fade={{ duration: 200, delay: 50, easing: cubicOut }}
                  class="mt-5 space-y-2 border-t border-[var(--border-hairline)] pt-5"
                >
                  <span class="kicker">Đáp án tham khảo</span>
                  <p
                    class="prose-reading font-serif text-[var(--text-secondary)] [text-wrap:pretty]"
                    style="font-size: {fontSizePx / 16}rem; line-height: 1.72;"
                  >
                    {lesson.answer}
                  </p>
                </div>
              </div>
            {/if}
          </div>

          <nav
            aria-label="Điều hướng giữa các bài học"
            class="mt-12 grid grid-cols-1 gap-3.5 border-t border-[var(--border-hairline)] pt-8 sm:grid-cols-2"
          >
            <div>
              {#if prevLesson}
                <button
                  type="button"
                  onclick={() => onSelectLesson(prevLesson.id)}
                  class="group flex min-h-[76px] w-full flex-col items-start justify-center rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                    <ArrowLeft
                      class="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                      aria-hidden="true"
                    />
                    <span>Bài trước · {prevLesson.category}</span>
                  </span>
                  <span class="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                    {prevLesson.title}
                  </span>
                </button>
              {:else}
                <div class="flex min-h-[76px] items-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
                  Đang ở bài đầu tiên của danh sách
                </div>
              {/if}
            </div>

            <div>
              {#if nextLesson}
                <button
                  type="button"
                  onclick={() => onSelectLesson(nextLesson.id)}
                  class="group flex min-h-[76px] w-full flex-col items-end justify-center rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-right transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]/40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                    <span>Bài tiếp · {nextLesson.category}</span>
                    <ArrowRight
                      class="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                    {nextLesson.title}
                  </span>
                </button>
              {:else}
                <div class="flex min-h-[76px] items-center justify-end rounded-[var(--radius-md)] border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
                  Đã tới bài cuối cùng của danh sách
                </div>
              {/if}
            </div>
          </nav>
        </article>
      {/key}
    </div>
  </section>
{/if}
