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
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { categoryTone } from '../lib/categoryMeta';
import { useDialogA11y } from '../lib/useDialogA11y';
import type { Lesson, ThemeMode } from '../types/lesson';
import { normalizeForSearch } from '../utils/lessons';

interface CommandPaletteProps {
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

export function CommandPalette({
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
}: CommandPaletteProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useDialogA11y(panelRef, isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const sections = useMemo<PaletteSection[]>(() => {
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
  }, [
    query,
    lessons,
    theme,
    userEmail,
    canAddLesson,
    onSelectLesson,
    onPickRandom,
    onToggleTheme,
    onResetFilters,
    onOpenShortcuts,
    onOpenAddLesson,
    onOpenAuth,
    onSignOut,
  ]);

  const flatItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections]
  );

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, flatItems.length - 1)));
  }, [flatItems.length]);

  useEffect(() => {
    if (!isOpen) return;
    const node = panelRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % Math.max(1, flatItems.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + flatItems.length) % Math.max(1, flatItems.length)
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(flatItems[activeIndex]);
    }
  };

  let cursor = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 p-4 pt-[10vh] backdrop-blur-[3px] sm:pt-[14vh]"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Bảng tìm kiếm và lệnh nhanh"
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--border-hairline)] px-3.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              <input
                data-autofocus
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tìm bài học hoặc chạy một lệnh..."
                aria-label="Tìm bài học hoặc lệnh"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={
                  flatItems[activeIndex] ? `palette-item-${activeIndex}` : undefined
                }
                aria-autocomplete="list"
                className="h-12 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <kbd className="kbd shrink-0">Esc</kbd>
            </div>

            <div
              id="palette-results"
              role="listbox"
              aria-label="Kết quả"
              className="scroll-thin max-h-[min(58vh,430px)] overflow-y-auto p-2"
            >
              {flatItems.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-[var(--text-secondary)]">
                  Không có kết quả cho “{query}”.
                </p>
              ) : (
                sections.map((section) =>
                  section.items.length === 0 ? null : (
                    <div key={section.title} className="mb-1.5">
                      <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--text-muted)]">
                        {section.title}
                      </p>
                      {section.items.map((item) => {
                        cursor += 1;
                        const index = cursor;
                        const isActive = index === activeIndex;
                        const Icon = item.Icon;
                        return (
                          <button
                            key={item.key}
                            id={`palette-item-${index}`}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            data-palette-index={index}
                            onMouseMove={() => setActiveIndex(index)}
                            onClick={() => runItem(item)}
                            className={`relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                              isActive
                                ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                            }`}
                          >
                            {Icon ? (
                              <Icon
                                className={`h-4 w-4 shrink-0 ${
                                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                                }`}
                                aria-hidden="true"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className={`${item.tone ?? 'cat-all'} h-2 w-2 shrink-0 rounded-full bg-[var(--cat)]`}
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                              {item.label}
                            </span>
                            <span className="shrink-0 text-[10.5px] text-[var(--text-muted)]">
                              {item.hint}
                            </span>
                            {isActive && (
                              <ArrowUpRight className="h-3 w-3 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                )
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-hairline)] px-3.5 py-2 text-[10.5px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd>
                <span>di chuyển</span>
                <kbd className="kbd">↵</kbd>
                <span>chọn</span>
              </span>
              <span className="font-mono tabular-nums">{flatItems.length} mục</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
