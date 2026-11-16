import { LogOut, Moon, Sun } from 'lucide-react';
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
}: TopHeaderProps) {
  const navItems: { id: MasteryFilter; label: string }[] = [
    { id: 'all', label: `Tất cả (${totalCount})` },
    { id: 'unmastered', label: `Chưa thuộc (${Math.max(0, totalCount - masteredCount)})` },
    { id: 'mastered', label: `Đã thuộc (${masteredCount})` },
  ];

  return (
    <div className="bg-[var(--bg-canvas)]/95 backdrop-blur-sm border-b border-[var(--border-hairline)]">
      {/* Hairline reading scroll progress bar */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-transparent overflow-hidden"
      >
        <div
          className="h-full bg-[var(--accent)] origin-left transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${isAuthScreen ? 0 : Math.min(1, Math.max(0, readingProgress))})`,
          }}
        />
      </div>

      <div className="mx-auto flex h-[54px] max-w-[1380px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick();
          }}
          className="font-serif text-xl font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          KinetixNotes
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        {!isAuthScreen ? (
          <nav
            aria-label="Phạm vi bài học"
            className="hidden md:flex items-center gap-6 text-[13px] font-medium"
          >
            {navItems.map((item) => {
              const isActive = masteryFilter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMasteryFilter(item.id)}
                  className={`relative py-1.5 tabular-nums whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="headerScopeUnderline"
                      transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[1px] h-[1.5px] bg-[var(--accent)]"
                    />
                  )}
                </button>
              );
            })}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onPickRandomLesson}
              className="py-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              Ôn ngẫu nhiên
            </motion.button>
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Zone 3: Auth state + Theme Switcher */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {userEmail ? (
            <>
              <span
                title={userEmail}
                className="max-w-[100px] sm:max-w-[190px] truncate text-xs font-medium text-[var(--text-secondary)]"
              >
                {userEmail}
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={onSignOut}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <LogOut className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden="true" />
                <span>Đăng xuất</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={onOpenAuth}
              className="inline-flex min-h-[38px] items-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Đăng nhập / Đăng ký
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Chuyển sang giao diện sáng'
                : 'Chuyển sang giao diện tối'
            }
            title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)] shrink-0 transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
                  <Sun className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
