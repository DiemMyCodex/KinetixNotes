import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CategoryTabs } from './components/CategoryTabs';
import { LessonReader } from './components/LessonReader';
import { LibrarySidebar } from './components/LibrarySidebar';
import { MobileTabBar } from './components/MobileTabBar';
import { TopHeader } from './components/TopHeader';
import lessonsJson from './data/lessons.json';
import { lessonPath, parseRoute } from './lib/router';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { effectiveStreak, persistStreak, readStreak, registerVisit } from './lib/streak';
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

const AuthView = lazy(() =>
  import('./components/AuthView').then((module) => ({ default: module.AuthView }))
);
const AddLessonModal = lazy(() =>
  import('./components/AddLessonModal').then((module) => ({
    default: module.AddLessonModal,
  }))
);
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then((module) => ({
    default: module.CommandPalette,
  }))
);
const ShortcutsDialog = lazy(() =>
  import('./components/ShortcutsDialog').then((module) => ({
    default: module.ShortcutsDialog,
  }))
);

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
  return parseRoute(window.location.pathname).authRoute;
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

function readStoredLessonId(lessons: readonly Lesson[]): number | null {
  if (lessons.length === 0) return null;
  if (typeof window === 'undefined') return lessons[0].id;
  try {
    const raw = Number(localStorage.getItem(STORAGE_KEYS.lastLessonId));
    if (lessons.some((lesson) => lesson.id === raw)) {
      return raw;
    }
  } catch {
    // ignore
  }
  return lessons[0].id;
}

function readInitialLessonId(): number | null {
  if (typeof window === 'undefined') return readStoredLessonId(DEFAULT_LESSONS);
  const route = parseRoute(window.location.pathname);
  if (route.lessonId !== null && DEFAULT_LESSONS.some((lesson) => lesson.id === route.lessonId)) {
    return route.lessonId;
  }
  return readStoredLessonId(DEFAULT_LESSONS);
}

function readDeepLinkLessonId(): number | null {
  if (typeof window === 'undefined') return null;
  return parseRoute(window.location.pathname).lessonId;
}

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS);
  const [user, setUser] = useState<User | null>(null);
  const [authRoute, setAuthRoute] = useState<AuthRoute>(readInitialRoute);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [masteredIds, setMasteredIds] = useState<Set<number>>(readGuestMasteredIds);
  const [fontSizePx, setFontSizePx] = useState<number>(readInitialFontSize);
  const [category, setCategory] = useState<CategoryFilter>('Tất cả');
  const [masteryFilter, setMasteryFilter] = useState<MasteryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(readInitialLessonId);
  const [pendingDeepLinkId, setPendingDeepLinkId] = useState<number | null>(readDeepLinkLessonId);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [mobilePane, setMobilePane] = useState<'list' | 'reader'>(() =>
    readDeepLinkLessonId() !== null ? 'reader' : 'list'
  );
  const [readingProgress, setReadingProgress] = useState(0);
  const [streak, setStreak] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const next = registerVisit(readStreak());
    persistStreak(next);
    setStreak(effectiveStreak(next));
  }, []);

  useEffect(() => {
    const handleUpdate = () => setUpdateReady(true);
    window.addEventListener('kinetix:updated', handleUpdate);
    return () => window.removeEventListener('kinetix:updated', handleUpdate);
  }, []);

  const navigateRoute = useCallback((nextRoute: AuthRoute) => {
    setAuthRoute(nextRoute);
    if (typeof window !== 'undefined') {
      const targetPath =
        nextRoute === 'login' ? '/login' : nextRoute === 'register' ? '/register' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const pushLessonPath = useCallback((id: number) => {
    if (typeof window === 'undefined') return;
    const target = lessonPath(id);
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
  }, []);

  // Sync browser back/forward navigation with the in-app route
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname);
      setAuthRoute(route.authRoute);
      if (route.lessonId !== null) {
        setPendingDeepLinkId(route.lessonId);
        setMobilePane('reader');
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
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

  // Load lessons from Supabase (fallback to bundled catalog when offline/empty)
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

  // Resolve a deep-linked lesson once the full catalog is available
  useEffect(() => {
    if (pendingDeepLinkId === null) return;
    const match = lessons.find((lesson) => lesson.id === pendingDeepLinkId);
    if (!match) return;
    setPageDirection(1);
    setSelectedLessonId(match.id);
    setMobilePane('reader');
    setPendingDeepLinkId(null);
  }, [pendingDeepLinkId, lessons]);

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

  // Sync theme to document root and browser chrome
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0c0d0f' : '#faf9f6');
  }, [theme]);

  // Listen for OS color scheme changes when the user hasn't explicitly saved a theme
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handleChange = (event: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.theme);
        if (!stored) {
          setTheme(event.matches ? 'dark' : 'light');
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
      localStorage.setItem(STORAGE_KEYS.mastered, JSON.stringify(Array.from(masteredIds)));
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
    return filteredLessons.find((l) => l.id === selectedLessonId) ?? filteredLessons[0];
  }, [filteredLessons, selectedLessonId]);

  const { prev, next, currentIndex } = useMemo(
    () => getAdjacentLessons(filteredLessons, activeLesson?.id ?? null),
    [filteredLessons, activeLesson?.id]
  );

  // Returning to the reader pane should start from the top of the article
  useEffect(() => {
    if (mobilePane === 'reader' && !isDesktop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [mobilePane, isDesktop]);

  // Track vertical reading scroll progress
  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
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

  // Keep the document title in sync with the active lesson
  useEffect(() => {
    if (authRoute === 'login') {
      document.title = 'Đăng nhập — KinetixNotes';
    } else if (authRoute === 'register') {
      document.title = 'Đăng ký — KinetixNotes';
    } else if (activeLesson) {
      document.title = `${activeLesson.title} — KinetixNotes`;
    } else {
      document.title = 'KinetixNotes — Tủ sách & Lưu trữ Tri thức';
    }
  }, [authRoute, activeLesson]);

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
      setPageDirection(getLessonNavigationDirection(filteredLessons, selectedLessonId, id));
      setSelectedLessonId(id);
      setMobilePane('reader');
      pushLessonPath(id);
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [filteredLessons, selectedLessonId, pushLessonPath]
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
        const { error } = await syncLessonProgressInSupabase(user.id, id, nextIsMastered);
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

      const updated = mergeCatalogLessons(lessons, [lesson]);
      const newlyAdded = updated[updated.length - 1];
      setLessons(updated);
      if (newlyAdded) {
        setSelectedLessonId(newlyAdded.id);
        pushLessonPath(newlyAdded.id);
      }
      setCategory('Tất cả');
      setMasteryFilter('all');
      setSearchQuery('');
      setMobilePane('reader');
      return { error: null };
    },
    [lessons, user, pushLessonPath]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSyncNotice(null);
    setMobilePane('list');
  }, []);

  const handleResetFilters = useCallback(() => {
    setCategory('Tất cả');
    setMasteryFilter('all');
    setSearchQuery('');
  }, []);

  const handlePickRandomLesson = useCallback(() => {
    const pool = lessons.filter((lesson) => !masteredIds.has(lesson.id));
    const candidates = pool.length > 0 ? pool : lessons;
    if (candidates.length === 0) return;

    const differentCandidates = candidates.filter((lesson) => lesson.id !== activeLesson?.id);
    const finalPool = differentCandidates.length > 0 ? differentCandidates : candidates;
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];

    setCategory('Tất cả');
    setMasteryFilter('all');
    setSearchQuery('');
    setPageDirection(getLessonNavigationDirection(lessons, activeLesson?.id ?? null, picked.id));
    setSelectedLessonId(picked.id);
    setMobilePane('reader');
    pushLessonPath(picked.id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [lessons, masteredIds, activeLesson?.id, pushLessonPath]);

  const openPalette = useCallback(() => setIsPaletteOpen(true), []);

  const focusSearch = useCallback(() => {
    setIsPaletteOpen(false);
    setIsShortcutsOpen(false);
    setMobilePane('list');
    window.setTimeout(() => searchInputRef.current?.focus(), 40);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (isAddModalOpen) return;
        setIsShortcutsOpen(false);
        setIsPaletteOpen((open) => !open);
        return;
      }

      if (authRoute !== 'reader') return;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const anyDialogOpen = isPaletteOpen || isShortcutsOpen || isAddModalOpen;
      if (anyDialogOpen) return;

      if (event.key === 'ArrowLeft' && prev) {
        event.preventDefault();
        handleSelectLesson(prev.id);
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        handleSelectLesson(next.id);
      } else if (event.key === '?') {
        event.preventDefault();
        setIsShortcutsOpen(true);
      } else if (event.key.toLowerCase() === 't') {
        handleToggleTheme();
      } else if (event.key.toLowerCase() === 'r') {
        handlePickRandomLesson();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    authRoute,
    prev,
    next,
    handleSelectLesson,
    isPaletteOpen,
    isShortcutsOpen,
    isAddModalOpen,
    handleToggleTheme,
    handlePickRandomLesson,
    focusSearch,
  ]);

  const fontIndex = FONT_SIZES.indexOf(fontSizePx as (typeof FONT_SIZES)[number]);
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
      return idx >= 0 && idx < FONT_SIZES.length - 1 ? FONT_SIZES[idx + 1] : current;
    });
  }, []);

  const isAuthScreen = authRoute === 'login' || authRoute === 'register';
  const headerProgress =
    !isAuthScreen && (isDesktop || mobilePane === 'reader') ? readingProgress : 0;

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-contrast)]"
      >
        Bỏ qua tới nội dung chính
      </a>

      <div
        id="top"
        className="relative z-[1] flex min-h-[100dvh] flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]"
      >
        <header className="sticky top-0 z-40 pt-[var(--safe-top)]">
          <TopHeader
            theme={theme}
            onToggleTheme={handleToggleTheme}
            masteryFilter={masteryFilter}
            onSelectMasteryFilter={(filter) => {
              setMasteryFilter(filter);
              setMobilePane('list');
            }}
            onPickRandomLesson={handlePickRandomLesson}
            readingProgress={headerProgress}
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
            onOpenPalette={openPalette}
            streak={streak}
          />

          <AnimatePresence initial={false}>
            {!isAuthScreen && (
              <motion.div
                key="desktop-category-tabs"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="hidden overflow-hidden lg:block"
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
                <Suspense fallback={<div className="min-h-[60vh]" />}>
                  <AuthView
                    mode={authRoute === 'register' ? 'register' : 'login'}
                    onSwitchMode={(nextMode) => navigateRoute(nextMode)}
                    onBackToReader={() => navigateRoute('reader')}
                    onAuthSuccess={() => navigateRoute('reader')}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="page-reader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-1 flex-col max-lg:pb-[calc(var(--tabbar-h)_+_var(--safe-bottom))]"
              >
                <div className="sticky top-[calc(var(--header-h)_+_var(--safe-top))] z-30 lg:hidden">
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
                      <div className="mx-auto flex max-w-[var(--shell-max)] items-center justify-between gap-4 px-4 py-2 text-xs text-[var(--text-secondary)] sm:px-6 lg:px-8">
                        <span>{syncNotice}</span>
                        <button
                          type="button"
                          onClick={() => setSyncNotice(null)}
                          className="shrink-0 font-medium text-[var(--accent)] hover:underline"
                        >
                          Đóng
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <main
                  id="main"
                  className="mx-auto grid w-full max-w-[var(--shell-max)] flex-1 grid-cols-1 lg:grid-cols-[352px_minmax(0,1fr)]"
                >
                  <div
                    className={
                      mobilePane === 'list' ? 'block mobile-pane-enter' : 'hidden lg:block'
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
                      activeCategory={category}
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
                      mobilePane === 'reader' ? 'block mobile-pane-enter' : 'hidden lg:block'
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
                      isMastered={activeLesson ? masteredIds.has(activeLesson.id) : false}
                      onToggleMastered={handleToggleMastered}
                      fontSizePx={fontSizePx}
                      onIncreaseFont={handleIncreaseFont}
                      onDecreaseFont={handleDecreaseFont}
                      canIncreaseFont={canIncreaseFont}
                      canDecreaseFont={canDecreaseFont}
                      onBackToListMobile={() => setMobilePane('list')}
                      onResetFilters={handleResetFilters}
                      readingProgress={readingProgress}
                    />
                  </div>
                </main>

                <MobileTabBar
                  pane={mobilePane}
                  onSelectList={() => setMobilePane('list')}
                  onSelectReader={() => setMobilePane('reader')}
                  onOpenPalette={openPalette}
                  onPickRandom={handlePickRandomLesson}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {updateReady && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed inset-x-3 bottom-[calc(var(--tabbar-h)_+_var(--safe-bottom)_+_12px)] z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--shadow-pop)] lg:inset-x-auto lg:right-6 lg:bottom-6"
            >
              <p className="min-w-0 flex-1 text-xs text-[var(--text-secondary)]">
                Đã có bản cập nhật mới của KinetixNotes.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn btn-primary min-h-[34px] px-3 text-[12px]"
              >
                Tải lại
              </button>
              <button
                type="button"
                onClick={() => setUpdateReady(false)}
                aria-label="Ẩn thông báo cập nhật"
                className="icon-btn h-8 w-8 text-base leading-none"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-4 sm:px-6 lg:px-8 max-lg:pb-[calc(var(--tabbar-h)_+_var(--safe-bottom))]">
          <div className="mx-auto flex max-w-[var(--shell-max)] flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <span className="font-serif text-[13px] font-semibold text-[var(--text-secondary)]">
                KinetixNotes
              </span>
              <span aria-hidden="true">·</span>
              <span>Lưu trữ tri thức &amp; Ôn tập chủ động</span>
            </span>
            <span className="inline-flex items-center gap-3">
              {!isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1.5 text-[var(--warning)]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                  Chế độ cục bộ
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(true)}
                className="rounded font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
              >
                Phím tắt (?)
              </button>
            </span>
          </div>
        </footer>

        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            lessons={lessons}
            onSelectLesson={(id) => {
              handleSelectLesson(id);
              setIsPaletteOpen(false);
            }}
            onPickRandom={handlePickRandomLesson}
            onResetFilters={() => {
              handleResetFilters();
              setMobilePane('list');
            }}
            onToggleTheme={handleToggleTheme}
            theme={theme}
            userEmail={user?.email ?? null}
            onOpenAuth={() => {
              setIsPaletteOpen(false);
              navigateRoute('login');
            }}
            onSignOut={handleSignOut}
            canAddLesson={isLessonAdmin}
            onOpenAddLesson={() => {
              setIsPaletteOpen(false);
              if (isLessonAdmin) setIsAddModalOpen(true);
            }}
            onOpenShortcuts={() => {
              setIsPaletteOpen(false);
              setIsShortcutsOpen(true);
            }}
          />

          <ShortcutsDialog
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />

          <AddLessonModal
            isOpen={isAddModalOpen && isLessonAdmin}
            onClose={() => setIsAddModalOpen(false)}
            onSubmitLesson={handleCreateLesson}
          />
        </Suspense>
      </div>
    </MotionConfig>
  );
}
