import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Link2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { categoryTone } from '../lib/categoryMeta';
import { lessonUrl } from '../lib/router';
import type { Lesson } from '../types/lesson';
import {
  estimateReadMinutes,
  formatShortDate,
  splitPointLead,
  tokenizeTechnicalTerms,
} from '../utils/lessons';

interface LessonReaderProps {
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

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * 28,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.22,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * -20,
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1] as const,
    },
  }),
};

export function LessonReader({
  lesson,
  pageDirection,
  totalVisible,
  currentIndex,
  prevLesson,
  nextLesson,
  onSelectLesson,
  isMastered,
  onToggleMastered,
  fontSizePx,
  onIncreaseFont,
  onDecreaseFont,
  canIncreaseFont,
  canDecreaseFont,
  onBackToListMobile,
  onResetFilters,
  readingProgress,
}: LessonReaderProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setShowAnswer(false);
    setCopied(false);
  }, [lesson?.id]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!lesson) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div className="max-w-md space-y-4">
          <BookOpen className="mx-auto h-7 w-7 text-[var(--text-muted)]" aria-hidden="true" />
          <h2 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
            Chưa có bài học được chọn
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Chọn một bài trong danh sách hoặc đặt lại bộ lọc để bắt đầu đọc và ôn tập.
          </p>
          <button type="button" onClick={onResetFilters} className="btn btn-primary">
            Hiển thị tất cả bài học
          </button>
        </div>
      </motion.section>
    );
  }

  const readMinutes = estimateReadMinutes(lesson);
  const remainingMinutes = Math.max(0, Math.round(readMinutes * (1 - readingProgress)));
  const readPercent = Math.round(Math.min(1, Math.max(0, readingProgress)) * 100);
  const formattedNumber = String(lesson.id).padStart(2, '0');

  const handleShare = async () => {
    const url = lessonUrl(lesson.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: lesson.title, text: lesson.summary, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, select, [data-no-swipe]')) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
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

  const renderSegments = (text: string, keyPrefix: string) =>
    tokenizeTechnicalTerms(text).map((segment, index) =>
      segment.isMono ? (
        <code
          key={`${keyPrefix}-${index}`}
          className="rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[0.83em] font-medium text-[var(--text-primary)]"
        >
          {segment.text}
        </code>
      ) : (
        <span key={`${keyPrefix}-${index}`}>{segment.text}</span>
      )
    );

  return (
    <section
      aria-label="Nội dung bài học"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex min-w-0 flex-col bg-[var(--bg-canvas)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] px-4 py-2.5 sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBackToListMobile}
            className="btn btn-secondary min-h-[36px] px-2.5 lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tủ sách</span>
          </button>

          <div className="flex min-w-0 items-center gap-2 text-[11.5px] text-[var(--text-secondary)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={formattedNumber}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="font-mono font-medium tabular-nums text-[var(--text-primary)]"
              >
                Bài {formattedNumber}
              </motion.span>
            </AnimatePresence>
            <span aria-hidden="true" className="text-[var(--border-strong)]">
              /
            </span>
            <span className="font-mono tabular-nums">
              {currentIndex + 1} trong {totalVisible}
            </span>
            <span aria-hidden="true" className="hidden text-[var(--border-strong)] sm:inline">
              ·
            </span>
            <span className="hidden items-center gap-1 tabular-nums sm:inline-flex">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {remainingMinutes > 0 ? `~${remainingMinutes} phút còn lại` : 'Đã đọc xong'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="mr-0.5 hidden rounded-full bg-[var(--accent-soft)] px-2 py-1 font-mono text-[10.5px] font-semibold tabular-nums text-[var(--accent)] sm:inline"
            title={`Đã đọc ${readPercent}% bài này`}
          >
            {readPercent}%
          </span>

          <button
            type="button"
            onClick={handleShare}
            className="icon-btn h-[34px] w-[34px]"
            aria-label="Sao chép liên kết bài học"
            title="Chia sẻ bài học"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--mastered)]" aria-hidden="true" />
            ) : (
              <Link2 className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
            )}
          </button>

          <div
            role="group"
            aria-label="Điều chỉnh cỡ chữ"
            className="inline-flex items-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)]"
          >
            <button
              type="button"
              onClick={onDecreaseFont}
              disabled={!canDecreaseFont}
              aria-label="Giảm cỡ chữ"
              className="min-h-[34px] min-w-[34px] px-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:pointer-events-none disabled:opacity-35"
            >
              A−
            </button>
            <span className="border-x border-[var(--border-hairline)] px-1.5 font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]">
              {fontSizePx}
            </span>
            <button
              type="button"
              onClick={onIncreaseFont}
              disabled={!canIncreaseFont}
              aria-label="Tăng cỡ chữ"
              className="min-h-[34px] min-w-[34px] px-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:pointer-events-none disabled:opacity-35"
            >
              A+
            </button>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onToggleMastered(lesson.id)}
            aria-pressed={isMastered}
            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              isMastered
                ? 'border-[var(--mastered)]/40 bg-[var(--mastered-soft)] text-[var(--mastered)]'
                : 'border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <motion.span
              initial={false}
              animate={{ scale: isMastered ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.25 }}
              className="inline-flex"
            >
              <Check
                className={`h-3.5 w-3.5 ${isMastered ? 'stroke-[2.6]' : 'opacity-55'}`}
                aria-hidden="true"
              />
            </motion.span>
            <span className="max-sm:hidden">
              {isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
            </span>
            <span className="sr-only sm:hidden">
              {isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
            </span>
          </motion.button>
        </div>
      </div>

      <span aria-live="polite" className="sr-only">
        {copied ? 'Đã sao chép liên kết bài học' : ''}
      </span>

      <div className="relative overflow-x-hidden px-4 py-8 sm:px-8 sm:py-12 lg:px-14">
        <AnimatePresence mode="wait" custom={pageDirection} initial={false}>
          <motion.article
            key={lesson.id}
            custom={pageDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="mx-auto w-full max-w-[65ch]"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--text-secondary)]">
              <span
                className={`${categoryTone(lesson.category)} inline-flex items-center gap-1.5 rounded-full bg-[var(--cat-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cat)]`}
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--cat)]" />
                {lesson.category}
              </span>
              <span aria-hidden="true" className="text-[var(--border-strong)]">
                ·
              </span>
              <span className="font-mono tabular-nums">{formatShortDate(lesson.createdAt)}</span>
              <span aria-hidden="true" className="text-[var(--border-strong)]">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" aria-hidden="true" />
                {readMinutes} phút đọc
              </span>
              <AnimatePresence>
                {isMastered && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--mastered)]"
                  >
                    <span aria-hidden="true" className="text-[var(--border-strong)]">
                      ·
                    </span>
                    <Check className="h-3 w-3 stroke-[2.6]" aria-hidden="true" />
                    <span>Hoàn thành</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <h1
              className="font-serif font-semibold tracking-[-0.021em] text-[var(--text-primary)]"
              style={{
                fontSize: 'clamp(1.9rem, 2.4vw + 1rem, 2.7rem)',
                lineHeight: 1.16,
              }}
            >
              {lesson.title}
            </h1>

            <p
              className="prose-reading mt-5 font-serif text-[var(--text-secondary)] [text-wrap:pretty]"
              style={{
                fontSize: `${(fontSizePx + 1.5) / 16}rem`,
                lineHeight: 1.66,
              }}
            >
              {lesson.summary}
            </p>

            <div className="mt-8 mb-9 flex items-center gap-3" aria-hidden="true">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.35, delay: 0.08, ease: EASE_OUT_EXPO }}
                className={`${categoryTone(lesson.category)} h-[1.5px] w-10 origin-left bg-[var(--cat)]`}
              />
              <span className="h-px flex-1 bg-[var(--border-hairline)]" />
            </div>

            <div className="space-y-5">
              <h2 className="kicker">Điểm cốt lõi &amp; Giải nghĩa thuật ngữ</h2>

              <ol className="divide-y divide-[var(--border-hairline)]/70">
                {lesson.points.map((point, index) => {
                  const { leadTerm, explanation, rest } = splitPointLead(point);
                  const pointIndex = String(index + 1).padStart(2, '0');

                  return (
                    <motion.li
                      key={`${lesson.id}-pt-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        delay: Math.min(index * 0.04, 0.2),
                        ease: EASE_OUT_EXPO,
                      }}
                      className="flex items-start gap-3.5 py-4 first:pt-1 last:pb-1"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 w-5 shrink-0 select-none font-mono text-[11px] font-medium tabular-nums text-[var(--accent)]"
                      >
                        {pointIndex}
                      </span>
                      <p
                        className="prose-reading min-w-0 flex-1 font-serif text-[var(--text-primary)] [text-wrap:pretty]"
                        style={{
                          fontSize: `${fontSizePx / 16}rem`,
                          lineHeight: 1.72,
                        }}
                      >
                        {leadTerm ? (
                          <>
                            <span className="lead-highlight font-semibold text-[var(--text-primary)]">
                              {renderSegments(leadTerm, `${lesson.id}-${index}-lead`)}
                            </span>{' '}
                            <span className="font-sans text-[0.87em] text-[var(--text-secondary)]">
                              ({explanation})
                            </span>{' '}
                            {renderSegments(rest, `${lesson.id}-${index}-rest`)}
                          </>
                        ) : (
                          renderSegments(point, `${lesson.id}-${index}-full`)
                        )}
                      </p>
                    </motion.li>
                  );
                })}
              </ol>
            </div>

            <div className="relative mt-11 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-7">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[var(--accent)]/70 to-transparent"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="kicker text-[var(--accent)]">Ôn tập chủ động</span>
                <span className="font-mono text-[10.5px] text-[var(--text-muted)]">
                  Kiểm tra trí nhớ
                </span>
              </div>

              <p
                className="mt-3.5 font-serif font-medium text-[var(--text-primary)] [text-wrap:pretty]"
                style={{
                  fontSize: `${(fontSizePx + 0.5) / 16}rem`,
                  lineHeight: 1.65,
                }}
              >
                {lesson.quiz}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5" data-no-swipe>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  aria-expanded={showAnswer}
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="btn btn-secondary min-h-[40px] px-4"
                >
                  <span>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}</span>
                  <motion.span
                    animate={{ rotate: showAnswer ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                    className="inline-flex"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {showAnswer && !isMastered && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.94, x: -6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.94, x: -6 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                      onClick={() => onToggleMastered(lesson.id)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--mastered)]/35 bg-[var(--mastered-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--mastered)] transition-colors hover:border-[var(--mastered)]/60"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Đánh dấu đã thuộc</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {showAnswer && (
                  <motion.div
                    key="quiz-answer-panel"
                    initial={{ height: 0, opacity: 0, y: -4 }}
                    animate={{
                      height: 'auto',
                      opacity: 1,
                      y: 0,
                      transition: {
                        height: { duration: 0.26, ease: EASE_OUT_EXPO },
                        opacity: { duration: 0.2, delay: 0.05 },
                        y: { duration: 0.24, ease: EASE_OUT_EXPO },
                      },
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      y: -4,
                      transition: {
                        height: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                        opacity: { duration: 0.14 },
                      },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 space-y-2 border-t border-[var(--border-hairline)] pt-5">
                      <span className="kicker">Đáp án tham khảo</span>
                      <p
                        className="prose-reading font-serif text-[var(--text-secondary)] [text-wrap:pretty]"
                        style={{
                          fontSize: `${fontSizePx / 16}rem`,
                          lineHeight: 1.72,
                        }}
                      >
                        {lesson.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <nav
              aria-label="Điều hướng giữa các bài học"
              className="mt-12 grid grid-cols-1 gap-3.5 border-t border-[var(--border-hairline)] pt-8 sm:grid-cols-2"
            >
              <div>
                {prevLesson ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                    onClick={() => onSelectLesson(prevLesson.id)}
                    className="group flex min-h-[76px] w-full flex-col items-start justify-center rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-left transition-colors hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                      <ArrowLeft
                        className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
                        aria-hidden="true"
                      />
                      <span>Bài trước · {prevLesson.category}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                      {prevLesson.title}
                    </span>
                  </motion.button>
                ) : (
                  <div className="flex min-h-[76px] items-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
                    Đang ở bài đầu tiên của danh sách
                  </div>
                )}
              </div>

              <div>
                {nextLesson ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                    onClick={() => onSelectLesson(nextLesson.id)}
                    className="group flex min-h-[76px] w-full flex-col items-end justify-center rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-right transition-colors hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                      <span>Bài tiếp · {nextLesson.category}</span>
                      <ArrowRight
                        className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                      {nextLesson.title}
                    </span>
                  </motion.button>
                ) : (
                  <div className="flex min-h-[76px] items-center justify-end rounded-[var(--radius-md)] border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
                    Đã tới bài cuối cùng của danh sách
                  </div>
                )}
              </div>
            </nav>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
