import { Command, Flame, LogIn, LogOut, Moon, Search, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { MasteryFilter, ThemeMode } from '../types/lesson';

interface TopHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  masteryFilter: MasteryFilter;
  onSelectMasteryFilter: (filter: MasteryFilter) => void;
  onPickRandomLesson: () => void;
  readingProgress: number;
  masteredCount: number;
  totalCount: number;
  onLogoClick: () => void;
  userEmail: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isAuthScreen: boolean;
  onOpenPalette: () => void;
  streak: number;
}

export function TopHeader({
  theme,
  onToggleTheme,
  masteryFilter,
  onSelectMasteryFilter,
  onPickRandomLesson,
  readingProgress,
  masteredCount,
  totalCount,
  onLogoClick,
  userEmail,
  onOpenAuth,
  onSignOut,
  isAuthScreen,
  onOpenPalette,
  streak,
}: TopHeaderProps) {
  const navItems: { id: MasteryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: totalCount },
    { id: 'unmastered', label: 'Chưa thuộc', count: Math.max(0, totalCount - masteredCount) },
    { id: 'mastered', label: 'Đã thuộc', count: masteredCount },
  ];

  return (
    <div className="relative border-b border-[var(--border-hairline)] bg-[var(--bg-glass)] backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[var(--shell-max)] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onLogoClick();
          }}
          aria-label="KinetixNotes — về tủ sách"
          className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-[8px] bg-[var(--text-primary)] font-serif text-[15px] font-semibold leading-none text-[var(--bg-canvas)] transition-transform duration-200 group-hover:-rotate-3"
          >
            K
          </span>
          <span className="font-serif text-[19px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] whitespace-nowrap max-[359px]:hidden">
            KinetixNotes
          </span>
        </a>

        {!isAuthScreen ? (
          <nav
            aria-label="Phạm vi bài học"
            className="ml-2 hidden items-center gap-1 md:flex"
          >
            {navItems.map((item) => {
              const isActive = masteryFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMasteryFilter(item.id)}
                  aria-pressed={isActive}
                  className={`relative inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="headerScopePill"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-md bg-[var(--bg-subtle)] shadow-[inset_0_0_0_1px_var(--border-hairline)]"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                  <span className="relative z-10 font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]">
                    {item.count}
                  </span>
                </button>
              );
            })}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onPickRandomLesson}
              className="ml-1 inline-flex min-h-[32px] items-center rounded-md px-2.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Ôn ngẫu nhiên
            </motion.button>
          </nav>
        ) : (
          <span className="hidden md:block" />
        )}

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Mở bảng tìm kiếm và lệnh nhanh"
            className="inline-flex h-[38px] items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-xs font-medium lg:inline">Tìm &amp; lệnh</span>
            <span className="hidden items-center gap-0.5 lg:inline-flex" aria-hidden="true">
              <kbd className="kbd">
                <Command className="h-2.5 w-2.5" />
              </kbd>
              <kbd className="kbd">K</kbd>
            </span>
          </button>

          {streak > 0 && (
            <span
              className="hidden h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-xs font-semibold text-[var(--text-secondary)] sm:inline-flex"
              title={`Chuỗi ${streak} ngày đọc liên tiếp`}
            >
              <Flame className="h-3.5 w-3.5 text-[var(--cat-mind)]" aria-hidden="true" />
              <span className="font-mono tabular-nums">{streak}</span>
              <span className="sr-only">ngày đọc liên tiếp</span>
            </span>
          )}

          {isAuthScreen ? null : userEmail ? (
            <>
              <button
                type="button"
                onClick={onSignOut}
                title={`Đăng xuất ${userEmail}`}
                className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
                aria-label={`Đăng xuất khỏi ${userEmail}`}
              >
                <LogOut className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
                <span className="hidden text-xs font-medium sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
            >
              <LogIn className="h-3.5 w-3.5 text-[var(--text-secondary)] sm:hidden" aria-hidden="true" />
              <span className="max-sm:sr-only">Đăng nhập</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={theme === 'dark' ? 'Giao diện sáng (T)' : 'Giao diện tối (T)'}
            className="icon-btn"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -35, scale: 0.72 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 35, scale: 0.72 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-[var(--cat-mind)]" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
        <div
          className="h-full origin-left bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-[var(--cat-ai)] transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${isAuthScreen ? 0 : Math.min(1, Math.max(0, readingProgress))})`,
          }}
        />
      </div>
    </div>
  );
}
