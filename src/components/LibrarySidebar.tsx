import { Check, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { RefObject } from 'react';
import type { Lesson, MasteryFilter } from '../types/lesson';
import type { ProgressStats } from '../utils/lessons';

interface LibrarySidebarProps {
  lessons: Lesson[];
  selectedLessonId: number | null;
  onSelectLesson: (id: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  masteredIds: ReadonlySet<number>;
  progress: ProgressStats;
  masteryFilter: MasteryFilter;
  onSelectMasteryFilter: (filter: MasteryFilter) => void;
  onResetFilters: () => void;
  canAddLesson: boolean;
  onOpenAddLesson: () => void;
}

export function LibrarySidebar({
  lessons,
  selectedLessonId,
  onSelectLesson,
  searchQuery,
  onSearchChange,
  searchInputRef,
  masteredIds,
  progress,
  masteryFilter,
  onSelectMasteryFilter,
  onResetFilters,
  canAddLesson,
  onOpenAddLesson,
}: LibrarySidebarProps) {
  return (
    <aside
      aria-label="Mục lục tủ sách"
      className="flex flex-col border-b lg:border-b-0 lg:border-r border-[var(--border-hairline)] bg-[var(--bg-subtle)]/55 lg:h-[calc(100vh-108px)] lg:sticky lg:top-[108px]"
    >
      {/* Search + Progress Header */}
      <div className="border-b border-[var(--border-hairline)] p-4 space-y-3.5">
        <div className="relative">
          <label htmlFor="lesson-search" className="sr-only">
            Tìm kiếm bài học theo tiêu đề hoặc từ khóa
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            id="lesson-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm khái niệm, tiêu đề..."
            className="w-full min-h-[40px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] py-2 pl-9 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/12 focus:outline-none"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.14 }}
                onClick={() => onSearchChange('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile-only mastery filter row */}
        <div className="flex md:hidden items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] p-1">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'unmastered', label: 'Chưa thuộc' },
              { id: 'mastered', label: 'Đã thuộc' },
            ] as const
          ).map((item) => {
            const active = masteryFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMasteryFilter(item.id)}
                className={`relative flex-1 min-h-[34px] rounded px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobileMasteryPill"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded bg-[var(--bg-subtle)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mastery Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--text-secondary)]">
              Tiến độ ghi nhớ
            </span>
            <span className="font-mono tabular-nums text-[var(--text-primary)] font-medium">
              {progress.masteredCount} / {progress.totalCount} bài ({progress.percentage}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Tiến độ các bài đã thuộc"
            aria-valuenow={progress.masteredCount}
            aria-valuemin={0}
            aria-valuemax={progress.totalCount}
            className="h-1.5 w-full overflow-hidden rounded-sm bg-[var(--border-hairline)]"
          >
            <motion.div
              className="h-full bg-[var(--accent)]"
              initial={false}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {canAddLesson && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onOpenAddLesson}
            className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Plus className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>Thêm bài mới</span>
          </motion.button>
        )}
      </div>

      {/* Scrollable Lesson Index */}
      <div className="editorial-scroll flex-1 overflow-y-auto divide-y divide-[var(--border-hairline)]">
        {lessons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="p-8 text-center space-y-3"
          >
            <p className="font-serif text-base text-[var(--text-primary)]">
              Không tìm thấy bài học phù hợp
            </p>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Thử đổi từ khóa khác hoặc đặt lại bộ lọc danh mục để xem toàn bộ kho tri thức.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex min-h-[38px] items-center justify-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            >
              Xem tất cả bài học
            </button>
          </motion.div>
        ) : (
          lessons.map((lesson) => {
            const isSelected = lesson.id === selectedLessonId;
            const isMastered = masteredIds.has(lesson.id);
            const formattedNum = String(lesson.id).padStart(2, '0');

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`group relative w-full text-left px-4 py-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--accent)] ${
                  isSelected ? '' : 'hover:bg-[var(--bg-card)]/60'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="sidebarActiveHighlight"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[var(--bg-card)] shadow-[inset_2px_0_0_0_var(--accent),inset_0_0_0_1px_var(--border-hairline)]"
                  />
                )}

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Clean unboxed metadata kicker */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                      <span
                        className={`font-mono tabular-nums transition-colors ${
                          isSelected ? 'text-[var(--accent)] font-semibold' : ''
                        }`}
                      >
                        {formattedNum}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{lesson.category}</span>
                      {isSelected && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[var(--accent)]">
                            Đang đọc
                          </span>
                        </>
                      )}
                    </div>

                    <h2
                      className={`font-serif text-[15px] leading-snug transition-colors ${
                        isSelected
                          ? 'font-semibold text-[var(--text-primary)]'
                          : 'font-medium text-[var(--text-primary)]/85 group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {lesson.title}
                    </h2>
                  </div>

                  <AnimatePresence>
                    {isMastered && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                        title="Đã thuộc"
                        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--mastered-soft)] text-[var(--mastered)]"
                      >
                        <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                        <span className="sr-only">Đã thuộc</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
