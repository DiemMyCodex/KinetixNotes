import { BookOpen, Library, Moon, Search, Shuffle, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../types/lesson';

interface MobileTabBarProps {
  pane: 'list' | 'reader';
  onSelectList: () => void;
  onSelectReader: () => void;
  onOpenPalette: () => void;
  onPickRandom: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function MobileTabBar({
  pane,
  onSelectList,
  onSelectReader,
  onOpenPalette,
  onPickRandom,
  theme,
  onToggleTheme,
}: MobileTabBarProps) {
  const tabs = [
    { id: 'list', label: 'Tủ sách', Icon: Library, active: pane === 'list', run: onSelectList },
    { id: 'reader', label: 'Đọc', Icon: BookOpen, active: pane === 'reader', run: onSelectReader },
    { id: 'search', label: 'Tìm', Icon: Search, active: false, run: onOpenPalette },
    { id: 'random', label: 'Ôn tập', Icon: Shuffle, active: false, run: onPickRandom },
    {
      id: 'theme',
      label: theme === 'dark' ? 'Sáng' : 'Tối',
      Icon: theme === 'dark' ? Sun : Moon,
      active: false,
      run: onToggleTheme,
    },
  ];

  return (
    <nav
      aria-label="Điều hướng nhanh trên di động"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-hairline)] bg-[var(--bg-glass)] pb-[var(--safe-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-[var(--tabbar-h)] max-w-[560px] grid-cols-5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.run}
              aria-current={tab.active ? 'page' : undefined}
              className={`relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                tab.active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.active && (
                <motion.span
                  layoutId="mobileTabActive"
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                  aria-hidden="true"
                  className="absolute inset-x-3 inset-y-1.5 rounded-lg bg-[var(--accent-soft)]"
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px]" aria-hidden="true" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
