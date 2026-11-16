import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
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
}: LessonReaderProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  // Reset quiz answer state when switching to a different lesson
  useEffect(() => {
    setShowAnswer(false);
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
        className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div className="max-w-md space-y-4">
          <BookOpen
            className="mx-auto h-7 w-7 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <h2 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
            Chưa có bài học được chọn
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Chọn một bài trong danh sách bên cạnh hoặc đặt lại bộ lọc để bắt đầu đọc và ôn tập.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Hiển thị tất cả bài học
          </button>
        </div>
      </motion.section>
    );
  }

  const readMinutes = estimateReadMinutes(lesson);
  const formattedNumber = String(lesson.id).padStart(2, '0');

  return (
    <section
      aria-label="Nội dung bài học"
      className="flex flex-col min-w-0 bg-[var(--bg-canvas)]"
    >
      {/* Reader Utility Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] px-4 sm:px-8 lg:px-12 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onBackToListMobile}
            className="inline-flex lg:hidden min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tủ sách</span>
          </motion.button>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] truncate">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={formattedNumber}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
                className="font-mono tabular-nums text-[var(--text-primary)] font-medium"
              >
                Bài {formattedNumber}
              </motion.span>
            </AnimatePresence>
            <span aria-hidden="true">/</span>
            <span className="font-mono tabular-nums">
              {currentIndex + 1} trong {totalVisible}
            </span>
          </div>
        </div>

        {/* Font size & Mastered controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Điều chỉnh cỡ chữ"
            className="inline-flex items-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)]"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onDecreaseFont}
              disabled={!canDecreaseFont}
              aria-label="Giảm cỡ chữ"
              className="min-h-[36px] min-w-[38px] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-35 disabled:pointer-events-none"
            >
              A-
            </motion.button>
            <span className="border-x border-[var(--border-hairline)] px-2 font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">
              {fontSizePx}px
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onIncreaseFont}
              disabled={!canIncreaseFont}
              aria-label="Tăng cỡ chữ"
              className="min-h-[36px] min-w-[38px] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-35 disabled:pointer-events-none"
            >
              A+
            </motion.button>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleMastered(lesson.id)}
            aria-pressed={isMastered}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
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
                className={`h-3.5 w-3.5 ${isMastered ? 'stroke-[2.5]' : 'opacity-60'}`}
                aria-hidden="true"
              />
            </motion.span>
            <span>{isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}</span>
          </motion.button>
        </div>
      </div>

      {/* Main 65ch Reading Column with Directional Page Transition */}
      <div className="relative overflow-x-hidden px-4 sm:px-8 lg:px-14 py-9 sm:py-13">
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
            {/* Unboxed Metadata Kicker */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] mb-4">
              <span className="font-semibold text-[var(--accent)]">
                {lesson.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatShortDate(lesson.createdAt)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{readMinutes} phút đọc</span>
              <AnimatePresence>
                {isMastered && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-2"
                  >
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--mastered)]">
                      <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      <span>Hoàn thành</span>
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Editorial Title */}
            <h1
              className="font-serif font-semibold tracking-[-0.02em] text-[var(--text-primary)] [text-wrap:balance]"
              style={{
                fontSize: 'clamp(1.85rem, 2.5vw + 1rem, 2.6rem)',
                lineHeight: 1.18,
              }}
            >
              {lesson.title}
            </h1>

            {/* Lead Summary */}
            <p
              className="prose-reading mt-5 font-serif text-[var(--text-secondary)] [text-wrap:pretty]"
              style={{
                fontSize: `${(fontSizePx + 1.5) / 16}rem`,
                lineHeight: 1.66,
              }}
            >
              {lesson.summary}
            </p>

            {/* Editorial Divider */}
            <div className="mt-8 mb-9 flex items-center gap-3" aria-hidden="true">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.35, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="h-[1.5px] w-10 origin-left bg-[var(--accent)]/65"
              />
              <span className="h-px flex-1 bg-[var(--border-hairline)]" />
            </div>

            {/* Key Points Section */}
            <div className="space-y-6">
              <h2 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)]">
                Điểm cốt lõi &amp; Giải nghĩa thuật ngữ
              </h2>

              <ol className="divide-y divide-[var(--border-hairline)]/70">
                {lesson.points.map((point, idx) => {
                  const { leadTerm, explanation, rest } = splitPointLead(point);
                  const pointIndex = String(idx + 1).padStart(2, '0');
                  const renderSegments = (text: string, keyPrefix: string) =>
                    tokenizeTechnicalTerms(text).map((seg, segIdx) =>
                      seg.isMono ? (
                        <code
                          key={`${keyPrefix}-${segIdx}`}
                          className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[0.83em] font-medium text-[var(--text-primary)] border border-[var(--border-hairline)]"
                        >
                          {seg.text}
                        </code>
                      ) : (
                        <span key={`${keyPrefix}-${segIdx}`}>{seg.text}</span>
                      )
                    );

                  return (
                    <motion.li
                      key={`${lesson.id}-pt-${idx}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        delay: Math.min(idx * 0.04, 0.2),
                        ease: EASE_OUT_EXPO,
                      }}
                      className="flex items-start gap-4 py-4 first:pt-1 last:pb-1"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 w-6 font-mono text-xs tabular-nums text-[var(--text-muted)] shrink-0 select-none"
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
                            <span className="font-semibold text-[var(--text-primary)]">
                              {renderSegments(leadTerm, `${lesson.id}-${idx}-lead`)}
                            </span>{' '}
                            <span className="font-sans text-[0.89em] text-[var(--text-secondary)]">
                              ({explanation})
                            </span>{' '}
                            {renderSegments(rest, `${lesson.id}-${idx}-rest`)}
                          </>
                        ) : (
                          renderSegments(point, `${lesson.id}-${idx}-full`)
                        )}
                      </p>
                    </motion.li>
                  );
                })}
              </ol>
            </div>

            {/* Active Recall Quiz Block */}
            <div className="mt-11 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--accent)]">
                  Ôn tập chủ động
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
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

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  aria-expanded={showAnswer}
                  onClick={() => setShowAnswer((prev) => !prev)}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--mastered)]/35 bg-[var(--mastered-soft)] px-3.5 py-2 text-xs font-medium text-[var(--mastered)] transition-colors hover:border-[var(--mastered)]/60"
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
                    <div className="mt-5 border-t border-[var(--border-hairline)] pt-5 space-y-2">
                      <span className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                        Đáp án tham khảo
                      </span>
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

            {/* Bottom Article Navigation (Prev / Next) */}
            <nav
              aria-label="Điều hướng giữa các bài học"
              className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-[var(--border-hairline)] pt-8"
            >
              <div>
                {prevLesson ? (
                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                    onClick={() => onSelectLesson(prevLesson.id)}
                    className="group flex w-full min-h-[76px] flex-col items-start justify-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                      <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                      <span>Bài trước · {prevLesson.category}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                      {prevLesson.title}
                    </span>
                  </motion.button>
                ) : (
                  <div className="flex min-h-[76px] items-center rounded-md border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
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
                    className="group flex w-full min-h-[76px] flex-col items-end justify-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-3.5 text-right transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)]">
                      <span>Bài tiếp · {nextLesson.category}</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    <span className="mt-1.5 line-clamp-1 font-serif text-[15px] font-medium text-[var(--text-primary)]">
                      {nextLesson.title}
                    </span>
                  </motion.button>
                ) : (
                  <div className="flex min-h-[76px] items-center justify-end rounded-md border border-dashed border-[var(--border-hairline)] px-4 py-3.5 text-xs text-[var(--text-muted)]">
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
