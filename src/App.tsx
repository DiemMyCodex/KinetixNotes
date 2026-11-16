import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddLessonModal } from './components/AddLessonModal';
import { AuthView } from './components/AuthView';
import { CategoryTabs } from './components/CategoryTabs';
import { LessonReader } from './components/LessonReader';
import { LibrarySidebar } from './components/LibrarySidebar';
import { TopHeader } from './components/TopHeader';
import lessonsJson from './data/lessons.json';
import { supabase } from './lib/supabase';
import {
  canUserManageLessons,
  mergeCatalogLessons,
} from './services/supabaseHelpers';
import {
  createLessonInSupabase,
  fetchLessonsFromSupabase,
  fetchUserProgressFromSupabase,
  syncLessonProgressInSupabase,
} from './services/supabaseSync';
import type {
  AuthRoute,
  CategoryFilter,
  Lesson,
  MasteryFilter,
  NewLessonInput,
  ThemeMode,
} from './types/lesson';
import {
  filterLessons,
  getAdjacentLessons,
  getCategoryCounts,
  getLessonNavigationDirection,
  getProgressStats,
} from './utils/lessons';

const STORAGE_KEYS = {
  mastered: 'kinetix-mastered-ids',
  fontSize: 'kinetix-font-size',
  theme: 'kinetix-theme',
  lastLessonId: 'kinetix-last-lesson-id',
} as const;

const FONT_SIZES = [15, 16, 17, 18, 19, 21] as const;
const DEFAULT_FONT_SIZE = 17;
const DEFAULT_LESSONS = lessonsJson as Lesson[];

function readInitialRoute(): AuthRoute {
  if (typeof window === 'undefined') return 'reader';
  const path = window.location.pathname.toLowerCase();
  if (path === '/login') return 'login';
  if (path === '/register') return 'register';
  return 'reader';
}

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore storage errors
  }
  return 'light';
}

function readGuestMasteredIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mastered);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((n): n is number => typeof n === 'number'));
    }
  } catch {
    // ignore malformed storage
  }
  return new Set();
}

function readInitialFontSize(): number {
  if (typeof window === 'undefined') return DEFAULT_FONT_SIZE;
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEYS.fontSize));
    if ((FONT_SIZES as readonly number[]).includes(raw)) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_FONT_SIZE;
}

function readInitialLessonId(lessons: readonly Lesson[]): number | null {
  if (lessons.length === 0) return null;
  if (typeof window === 'undefined') return lessons[0].id;
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEYS.lastLessonId));
    if (lessons.some((l) => l.id === raw)) {
      return raw;
    }
  } catch {
    // ignore
  }
  return lessons[0].id;
}

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS);
  const [user, setUser] = useState<User | null>(null);
  const [authRoute, setAuthRoute] = useState<AuthRoute>(readInitialRoute);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(readGuestMasteredIds);
  const [fontSizePx, setFontSizePx] = useState<number>(readInitialFontSize);
  const [category, setCategory] = useState<CategoryFilter>('Tất cả');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(() =>
    readInitialLessonId(DEFAULT_LESSONS)
  );
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [mobilePane, setMobilePane] = useState<'list' | 'reader'>('list');
  const [readingProgress, setReadingProgress] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const navigateRoute = useCallback((nextRoute: AuthRoute) => {
    setAuthRoute(nextRoute);
    if (typeof window !== 'undefined') {
      const targetPath =
        nextRoute === 'login'
          ? '/login'
          : nextRoute === 'register'
            ? '/register'
            : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Sync browser back/forward navigation with authRoute
  useEffect(() => {
    const handlePopState = () => {
      setAuthRoute(readInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize Supabase auth session & subscribe to auth state changes
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load lessons from Supabase (fallback to 24 default lessons when table is empty)
  useEffect(() => {
    let active = true;
    fetchLessonsFromSupabase(DEFAULT_LESSONS).then((result) => {
      if (!active) return;
      setLessons(result.lessons);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Load mastered progress from Supabase when signed in, or localStorage in guest mode
  useEffect(() => {
    let active = true;
    if (!user) {
      setMasteredIds(readGuestMasteredIds());
      setSyncNotice(null);
      return;
    }

    fetchUserProgressFromSupabase(user.id).then((res) => {
      if (!active) return;
      if (res.missingTable) {
        setMasteredIds(readGuestMasteredIds());
      } else if (res.error) {
        setSyncNotice(res.error);
      } else {
        setMasteredIds(res.masteredIds);
        setSyncNotice(null);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  // Sync theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  // Listen for OS color scheme changes when user hasn't explicitly saved a theme
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.theme);
        if (!stored) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch {
        // ignore
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Persist guest mastered IDs in localStorage when unauthenticated
  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.mastered,
        JSON.stringify(Array.from(masteredIds))
      );
    } catch {
      // ignore
    }
  }, [masteredIds, user]);

  // Persist font size
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.fontSize, String(fontSizePx));
    } catch {
      // ignore
    }
  }, [fontSizePx]);

  // Persist selected lesson ID
  useEffect(() => {
    if (selectedLessonId === null) return;
    try {
      localStorage.setItem(STORAGE_KEYS.lastLessonId, String(selectedLessonId));
    } catch {
      // ignore
    }
  }, [selectedLessonId]);

  const categoryCounts = useMemo(() => getCategoryCounts(lessons), [lessons]);
  const progressStats = useMemo(
    () => getProgressStats(lessons, masteredIds),
    [lessons, masteredIds]
  );

  const filteredLessons = useMemo(
    () =>
      filterLessons(lessons, {
        category,
        query: searchQuery,
        masteryFilter,
        masteredIds,
      }),
    [lessons, category, searchQuery, masteryFilter, masteredIds]
  );

  // Keep selected lesson valid within filtered list
  useEffect(() => {
    if (filteredLessons.length === 0) {
      return;
    }
    const stillVisible = filteredLessons.some((l) => l.id === selectedLessonId);
    if (!stillVisible) {
      setPageDirection(1);
      setSelectedLessonId(filteredLessons[0].id);
    }
  }, [filteredLessons, selectedLessonId]);

  const activeLesson = useMemo(() => {
    if (filteredLessons.length === 0) return null;
    return (
      filteredLessons.find((l) => l.id === selectedLessonId) ??
      filteredLessons[0]
    );
  }, [filteredLessons, selectedLessonId]);

  const { prev, next, currentIndex } = useMemo(
    () => getAdjacentLessons(filteredLessons, activeLesson?.id ?? null),
    [filteredLessons, activeLesson?.id]
  );

  // Track vertical reading scroll progress
  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 20) {
        setReadingProgress(activeLesson ? 1 : 0);
        return;
      }
      setReadingProgress(Math.min(1, Math.max(0, scrollTop / docHeight)));
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, [activeLesson?.id, fontSizePx, authRoute]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme: ThemeMode = prevTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
      } catch {
        // ignore
      }
      return nextTheme;
    });
  }, []);

  const handleSelectLesson = useCallback(
    (id: number) => {
      setPageDirection(
        getLessonNavigationDirection(filteredLessons, selectedLessonId, id)
      );
      setSelectedLessonId(id);
      setMobilePane('reader');
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [filteredLessons, selectedLessonId]
  );

  const handleToggleMastered = useCallback(
    async (id: number) => {
      const currentlyMastered = masteredIds.has(id);
      const nextIsMastered = !currentlyMastered;

      setMasteredIds((prevSet) => {
        const nextSet = new Set(prevSet);
        if (nextIsMastered) {
          nextSet.add(id);
        } else {
          nextSet.delete(id);
        }
        return nextSet;
      });

      if (user) {
        const { error } = await syncLessonProgressInSupabase(
          user.id,
          id,
          nextIsMastered
        );
        if (error) {
          setSyncNotice(error);
        } else {
          setSyncNotice(null);
        }
      }
    },
    [masteredIds, user]
  );

  const isLessonAdmin = canUserManageLessons(user?.email);

  useEffect(() => {
    if (!isLessonAdmin && isAddModalOpen) {
      setIsAddModalOpen(false);
    }
  }, [isLessonAdmin, isAddModalOpen]);

  const handleCreateLesson = useCallback(
    async (input: NewLessonInput): Promise<{ error: string | null }> => {
      if (!user || !canUserManageLessons(user.email)) {
        return {
          error: 'Chỉ tài khoản quản trị mới có quyền thêm bài học mới.',
        };
      }

      const { lesson, error } = await createLessonInSupabase(input, user.id);
      if (error || !lesson) {
        return { error: error ?? 'Không thể thêm bài học.' };
      }

      setLessons((prevLessons) => {
        const updated = mergeCatalogLessons(prevLessons, [lesson]);
        const newlyAdded = updated[updated.length - 1];
        if (newlyAdded) {
          setSelectedLessonId(newlyAdded.id);
        }
        return updated;
      });
      setCategory('Tất cả');
      setMasteryFilter('all');
      setSearchQuery('');
      setMobilePane('reader');
      return { error: null };
    },
    [user]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSyncNotice(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setCategory('Tất cả');
    setMasteryFilter('all');
    setSearchQuery('');
  }, []);

  const handlePickRandomLesson = useCallback(() => {
    const pool = lessons.filter((l) => !masteredIds.has(l.id));
    const candidates = pool.length > 0 ? pool : lessons;
    if (candidates.length === 0) return;

    const differentCandidates = candidates.filter((l) => l.id !== activeLesson?.id);
    const finalPool = differentCandidates.length > 0 ? differentCandidates : candidates;
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];

    setCategory('Tất cả');
    setMasteryFilter('all');
    setSearchQuery('');
    setPageDirection(
      getLessonNavigationDirection(lessons, activeLesson?.id ?? null, picked.id)
    );
    setSelectedLessonId(picked.id);
    setMobilePane('reader');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [lessons, masteredIds, activeLesson?.id]);

  // Keyboard shortcuts: "/" focuses search, ArrowLeft/ArrowRight moves between articles
  useEffect(() => {
    if (authRoute !== 'reader' || isAddModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        setMobilePane('list');
        searchInputRef.current?.focus();
        return;
      }

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === 'ArrowLeft' && prev) {
        event.preventDefault();
        handleSelectLesson(prev.id);
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        handleSelectLesson(next.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authRoute, isAddModalOpen, prev, next, handleSelectLesson]);

  const fontIndex = FONT_SIZES.indexOf(
    fontSizePx as (typeof FONT_SIZES)[number]
  );
  const canDecreaseFont = fontIndex > 0;
  const canIncreaseFont = fontIndex >= 0 && fontIndex < FONT_SIZES.length - 1;

  const handleDecreaseFont = useCallback(() => {
    setFontSizePx((current) => {
      const idx = FONT_SIZES.indexOf(current as (typeof FONT_SIZES)[number]);
      return idx > 0 ? FONT_SIZES[idx - 1] : current;
    });
  }, []);

  const handleIncreaseFont = useCallback(() => {
    setFontSizePx((current) => {
      const idx = FONT_SIZES.indexOf(current as (typeof FONT_SIZES)[number]);
      return idx >= 0 && idx < FONT_SIZES.length - 1
        ? FONT_SIZES[idx + 1]
        : current;
    });
  }, []);

  const isAuthScreen = authRoute === 'login' || authRoute === 'register';

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]"
      >
        <header className="sticky top-0 z-30">
          <TopHeader
            theme={theme}
            onToggleTheme={handleToggleTheme}
            masteryFilter={masteryFilter}
            onSelectMasteryFilter={(f) => {
              setMasteryFilter(f);
              setMobilePane('list');
            }}
            onPickRandomLesson={handlePickRandomLesson}
            readingProgress={readingProgress}
            masteredCount={progressStats.masteredCount}
            totalCount={progressStats.totalCount}
            onLogoClick={() => {
              navigateRoute('reader');
              handleResetFilters();
              setMobilePane('list');
            }}
            userEmail={user?.email ?? null}
            onOpenAuth={() => navigateRoute('login')}
            onSignOut={handleSignOut}
            isAuthScreen={isAuthScreen}
          />

          <AnimatePresence initial={false}>
            {!isAuthScreen && (
              <motion.div
                key="desktop-category-tabs"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:block overflow-hidden"
              >
                <CategoryTabs
                  activeCategory={category}
                  onSelectCategory={(cat) => {
                    setCategory(cat);
                    setMobilePane('list');
                  }}
                  counts={categoryCounts}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="relative flex flex-1 flex-col">
          <AnimatePresence mode="wait" initial={false}>
            {isAuthScreen ? (
              <motion.div
                key="page-auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col"
              >
                <AuthView
                  mode={authRoute === 'register' ? 'register' : 'login'}
                  onSwitchMode={(nextMode) => navigateRoute(nextMode)}
                  onBackToReader={() => navigateRoute('reader')}
                  onAuthSuccess={() => navigateRoute('reader')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="page-reader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col"
              >
              <div className="lg:hidden">
                <CategoryTabs
                  activeCategory={category}
                  onSelectCategory={(cat) => {
                    setCategory(cat);
                    setMobilePane('list');
                  }}
                  counts={categoryCounts}
                />
              </div>

              <AnimatePresence>
                {syncNotice && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    role="status"
                    className="overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]"
                  >
                    <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-2 text-xs text-[var(--text-secondary)]">
                      <span>{syncNotice}</span>
                      <button
                        type="button"
                        onClick={() => setSyncNotice(null)}
                        className="font-medium text-[var(--accent)] hover:underline shrink-0"
                      >
                        Đóng
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <main className="mx-auto w-full max-w-[1380px] flex-1 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div
                  className={
                    mobilePane === 'list'
                      ? 'block max-lg:mobile-pane-enter'
                      : 'hidden lg:block'
                  }
                >
                  <LibrarySidebar
                    lessons={filteredLessons}
                    selectedLessonId={activeLesson?.id ?? null}
                    onSelectLesson={handleSelectLesson}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchInputRef={searchInputRef}
                    masteredIds={masteredIds}
                    progress={progressStats}
                    masteryFilter={masteryFilter}
                    onSelectMasteryFilter={setMasteryFilter}
                    onResetFilters={handleResetFilters}
                    canAddLesson={isLessonAdmin}
                    onOpenAddLesson={() => {
                      if (isLessonAdmin) {
                        setIsAddModalOpen(true);
                      }
                    }}
                  />
                </div>

                <div
                  className={
                    mobilePane === 'reader'
                      ? 'block max-lg:mobile-pane-enter'
                      : 'hidden lg:block'
                  }
                >
                  <LessonReader
                    lesson={activeLesson}
                    pageDirection={pageDirection}
                    totalVisible={filteredLessons.length}
                    currentIndex={currentIndex}
                    prevLesson={prev}
                    nextLesson={next}
                    onSelectLesson={handleSelectLesson}
                    isMastered={
                      activeLesson ? masteredIds.has(activeLesson.id) : false
                    }
                    onToggleMastered={handleToggleMastered}
                    fontSizePx={fontSizePx}
                    onIncreaseFont={handleIncreaseFont}
                    onDecreaseFont={handleDecreaseFont}
                    canIncreaseFont={canIncreaseFont}
                    canDecreaseFont={canDecreaseFont}
                    onBackToListMobile={() => setMobilePane('list')}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              </main>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AddLessonModal
          isOpen={isAddModalOpen && isLessonAdmin}
          onClose={() => setIsAddModalOpen(false)}
          onSubmitLesson={handleCreateLesson}
        />

        <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 sm:px-6 lg:px-8 py-4">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
            <span className="font-serif">KinetixNotes</span>
            <span>Lưu trữ tri thức &amp; Ôn tập chủ động</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
