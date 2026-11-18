import { Check, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type RefObject } from 'react';
import { categoryTone } from '../lib/categoryMeta';
import type { CategoryFilter, Lesson, MasteryFilter } from '../types/lesson';
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
  activeCategory: CategoryFilter;
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
  activeCategory,
  onResetFilters,
  canAddLesson,
  onOpenAddLesson,
}: LibrarySidebarProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const hasFilters =
    activeCategory !== 'Tất cả' || masteryFilter !== 'all' || searchQuery.trim().length > 0;
  const remaining = Math.max(0, progress.totalCount - progress.masteredCount);

  useEffect(() => {
    if (selectedLessonId === null) return;
    const container = listRef.current;
    if (!container || container.scrollHeight <= container.clientHeight + 4) return;
    const row = container.querySelector<HTMLElement>(
      `[data-lesson-row="${selectedLessonId}"]`
    );
    row?.scrollIntoView({ block: 'nearest' });
  }, [selectedLessonId]);

  const filters: { id: MasteryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: progress.totalCount },
    { id: 'unmastered', label: 'Chưa thuộc', count: remaining },
    { id: 'mastered', label: 'Đã thuộc', count: progress.masteredCount },
  ];

  return (
    <aside
      aria-label="Mục lục tủ sách"
      className="flex flex-col border-[var(--border-hairline)] bg-[var(--bg-sidebar)] max-lg:border-b lg:sticky lg:top-[var(--shell-offset)] lg:h-[calc(100dvh_-_var(--shell-offset))] lg:border-r"
    >
      <div className="space-y-3 border-b border-[var(--border-hairline)] p-4">
        <div className="surface flex items-center gap-3.5 p-3">
          <div
            role="img"
            aria-label={`Đã thuộc ${progress.percentage}% số bài`}
            className="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--accent) ${progress.percentage}%, var(--border-hairline) 0)`,
            }}
          >
            <span className="absolute inset-[3px] grid place-items-center rounded-full bg-[var(--bg-card)] font-mono text-[11.5px] font-semibold tabular-nums text-[var(--text-primary)]">
              {progress.percentage}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="kicker">Tiến độ ghi nhớ</span>
            <p className="mt-0.5 text-[13px] font-semibold text-[var(--text-primary)]">
              <span className="font-mono tabular-nums">{progress.masteredCount}</span>
              <span className="text-[var(--text-muted)]"> / {progress.totalCount} bài</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {remaining === 0 ? 'Đã hoàn thành toàn bộ tủ sách' : `Còn ${remaining} bài chưa thuộc`}
            </p>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="lesson-search" className="sr-only">
            Tìm kiếm bài học theo tiêu đề, thuật ngữ hoặc nội dung
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
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm khái niệm, tiêu đề..."
            className="field min-h-[40px] py-2 pl-9 pr-10 text-[13px]"
          />
          <AnimatePresence mode="wait" initial={false}>
            {searchQuery ? (
              <motion.button
                key="clear"
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.14 }}
                onClick={() => onSearchChange('')}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            ) : (
              <kbd
                key="hint"
                aria-hidden="true"
                className="kbd pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                /
              </kbd>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] p-1 md:hidden">
          {filters.map((item) => {
            const active = masteryFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMasteryFilter(item.id)}
                aria-pressed={active}
                className={`relative flex min-h-[34px] flex-1 items-center justify-center gap-1 rounded px-2 text-[11.5px] font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobileMasteryPill"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    aria-hidden="true"
                    className="absolute inset-0 rounded bg-[var(--bg-subtle)] ring-1 ring-inset ring-[var(--border-hairline)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                <span className="relative z-10 font-mono text-[10px] tabular-nums text-[var(--text-muted)]">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {canAddLesson && (
          <button type="button" onClick={onOpenAddLesson} className="btn btn-secondary w-full">
            <Plus className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>Thêm bài mới</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-hairline)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
          <span className="font-mono tabular-nums">{lessons.length}</span> bài hiển thị
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded px-1.5 py-0.5 font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
          >
            Xóa lọc
          </button>
        )}
      </div>

      <div ref={listRef} className="scroll-thin flex-1 overflow-y-auto py-1">
        {lessons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3 p-8 text-center"
          >
            <p className="font-serif text-base text-[var(--text-primary)]">
              Không tìm thấy bài học phù hợp
            </p>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ kho tri thức.
            </p>
            <button type="button" onClick={onResetFilters} className="btn btn-secondary">
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
                data-lesson-row={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`group relative block w-full px-4 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:outline-[var(--accent)] ${
                  isSelected ? '' : 'hover:bg-[var(--bg-card)]/55'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="sidebarActiveHighlight"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[var(--bg-card)] shadow-[inset_2px_0_0_0_var(--accent),inset_0_1px_0_0_var(--border-hairline),inset_0_-1px_0_0_var(--border-hairline)]"
                  />
                )}

                <div className="relative z-10 flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-[3px] w-[18px] shrink-0 font-mono text-[10.5px] tabular-nums transition-colors ${
                      isSelected ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {formattedNum}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`${categoryTone(lesson.category)} h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cat)]`}
                      />
                      <span className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--text-muted)]">
                        {lesson.category}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 rounded bg-[var(--accent-soft)] px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                          Đang đọc
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-0.5 block font-serif text-[14.5px] leading-snug transition-colors ${
                        isSelected
                          ? 'font-semibold text-[var(--text-primary)]'
                          : 'font-medium text-[var(--text-primary)]/85 group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {lesson.title}
                    </span>
                  </span>

                  <AnimatePresence>
                    {isMastered && (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                        title="Đã thuộc"
                        className="mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[var(--mastered-soft)] text-[var(--mastered)]"
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
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
