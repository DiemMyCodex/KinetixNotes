<script lang="ts">
  import type { User } from '@supabase/supabase-js';
  import { cubicOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';
  import CategoryTabs from './components/CategoryTabs.svelte';
  import LessonReader from './components/LessonReader.svelte';
  import LibrarySidebar from './components/LibrarySidebar.svelte';
  import MobileTabBar from './components/MobileTabBar.svelte';
  import TopHeader from './components/TopHeader.svelte';
  import lessonsJson from './data/lessons.json';
  import { lessonPath, parseRoute } from './lib/router';
  import { isSupabaseConfigured, supabase } from './lib/supabase';
  import { effectiveStreak, persistStreak, readStreak, registerVisit } from './lib/streak';
  import { canUserManageLessons, mergeCatalogLessons } from './services/supabaseHelpers';
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
    return parseRoute(window.location.pathname).authRoute;
  }

  function readInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.theme);
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
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
      if ((FONT_SIZES as readonly number[]).includes(raw)) return raw;
    } catch {
      // ignore
    }
    return DEFAULT_FONT_SIZE;
  }

  function readStoredLessonId(lessons: readonly Lesson[]): number | null {
    if (lessons.length === 0) return null;
    if (typeof window === 'undefined') return lessons[0].id;
    try {
      const raw = Number(localStorage.getItem(STORAGE_KEYS.lastLessonId));
      if (lessons.some((lesson) => lesson.id === raw)) return raw;
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

  let lessons = $state<Lesson[]>([...DEFAULT_LESSONS]);
  let user = $state<User | null>(null);
  let authRoute = $state<AuthRoute>(readInitialRoute());
  let isAddModalOpen = $state(false);
  let isPaletteOpen = $state(false);
  let isShortcutsOpen = $state(false);
  let updateReady = $state(false);
  let syncNotice = $state<string | null>(null);

  let theme = $state<ThemeMode>(readInitialTheme());
  let masteredIds = $state<Set<number>>(readGuestMasteredIds());
  let fontSizePx = $state<number>(readInitialFontSize());
  let category = $state<CategoryFilter>('Tất cả');
  let masteryFilter = $state<MasteryFilter>('all');
  let searchQuery = $state('');
  let selectedLessonId = $state<number | null>(readInitialLessonId());
  let pendingDeepLinkId = $state<number | null>(readDeepLinkLessonId());
  let pageDirection = $state<1 | -1>(1);
  let mobilePane = $state<'list' | 'reader'>(readDeepLinkLessonId() !== null ? 'reader' : 'list');
  let readingProgress = $state(0);
  let streak = $state(0);
  let isDesktop = $state(true);
  let searchInputEl = $state<HTMLInputElement | null>(null);

  let authViewLoaded = $state(false);
  let paletteLoaded = $state(false);
  let shortcutsLoaded = $state(false);
  let addModalLoaded = $state(false);

  let categoryCounts = $derived(getCategoryCounts(lessons));
  let progressStats = $derived(getProgressStats(lessons, masteredIds));
  let filteredLessons = $derived(
    filterLessons(lessons, {
      category,
      query: searchQuery,
      masteryFilter,
      masteredIds,
    })
  );
  let activeLesson = $derived(
    filteredLessons.length === 0
      ? null
      : (filteredLessons.find((lesson) => lesson.id === selectedLessonId) ?? filteredLessons[0])
  );
  let adjacency = $derived(getAdjacentLessons(filteredLessons, activeLesson?.id ?? null));
  let prev = $derived(adjacency.prev);
  let next = $derived(adjacency.next);
  let currentIndex = $derived(adjacency.currentIndex);
  let isLessonAdmin = $derived(canUserManageLessons(user?.email));
  let isAuthScreen = $derived(authRoute === 'login' || authRoute === 'register');
  let headerProgress = $derived(
    !isAuthScreen && (isDesktop || mobilePane === 'reader') ? readingProgress : 0
  );
  let fontIndex = $derived(FONT_SIZES.indexOf(fontSizePx as (typeof FONT_SIZES)[number]));
  let canDecreaseFont = $derived(fontIndex > 0);
  let canIncreaseFont = $derived(fontIndex >= 0 && fontIndex < FONT_SIZES.length - 1);

  $effect(() => {
    const nextStreak = registerVisit(readStreak());
    persistStreak(nextStreak);
    streak = effectiveStreak(nextStreak);
  });

  $effect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    isDesktop = query.matches;
    const handleChange = (event: MediaQueryListEvent) => (isDesktop = event.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  });

  $effect(() => {
    const handleUpdate = () => (updateReady = true);
    window.addEventListener('kinetix:updated', handleUpdate);
    return () => window.removeEventListener('kinetix:updated', handleUpdate);
  });

  function navigateRoute(nextRoute: AuthRoute) {
    authRoute = nextRoute;
    const targetPath =
      nextRoute === 'login' ? '/login' : nextRoute === 'register' ? '/register' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pushLessonPath(id: number) {
    const target = lessonPath(id);
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
  }

  $effect(() => {
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname);
      authRoute = route.authRoute;
      if (route.lessonId !== null) {
        pendingDeepLinkId = route.lessonId;
        mobilePane = 'reader';
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });

  $effect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) user = data.session?.user ?? null;
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) user = session?.user ?? null;
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  });

  $effect(() => {
    const currentUserId = user?.id;
    let active = true;
    fetchLessonsFromSupabase(DEFAULT_LESSONS).then((result) => {
      if (active) lessons = result.lessons;
    });
    return () => {
      active = false;
    };
  });

  $effect(() => {
    if (pendingDeepLinkId === null) return;
    const match = lessons.find((lesson) => lesson.id === pendingDeepLinkId);
    if (!match) return;
    pageDirection = 1;
    selectedLessonId = match.id;
    mobilePane = 'reader';
    pendingDeepLinkId = null;
  });

  $effect(() => {
    const currentUser = user;
    if (!currentUser) {
      masteredIds = readGuestMasteredIds();
      syncNotice = null;
      return;
    }
    let active = true;
    fetchUserProgressFromSupabase(currentUser.id).then((res) => {
      if (!active) return;
      if (res.missingTable) {
        masteredIds = readGuestMasteredIds();
      } else if (res.error) {
        syncNotice = res.error;
      } else {
        masteredIds = res.masteredIds;
        syncNotice = null;
      }
    });
    return () => {
      active = false;
    };
  });

  $effect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0c0d0f' : '#faf9f6');
  });

  $effect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handleChange = (event: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem(STORAGE_KEYS.theme)) {
          theme = event.matches ? 'dark' : 'light';
        }
      } catch {
        // ignore
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  });

  $effect(() => {
    if (user) return;
    try {
      localStorage.setItem(STORAGE_KEYS.mastered, JSON.stringify(Array.from(masteredIds)));
    } catch {
      // ignore
    }
  });

  $effect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.fontSize, String(fontSizePx));
    } catch {
      // ignore
    }
  });

  $effect(() => {
    if (selectedLessonId === null) return;
    try {
      localStorage.setItem(STORAGE_KEYS.lastLessonId, String(selectedLessonId));
    } catch {
      // ignore
    }
  });

  $effect(() => {
    if (filteredLessons.length === 0) return;
    const stillVisible = filteredLessons.some((lesson) => lesson.id === selectedLessonId);
    if (!stillVisible) {
      pageDirection = 1;
      selectedLessonId = filteredLessons[0].id;
    }
  });

  $effect(() => {
    if (mobilePane === 'reader' && !isDesktop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  });

  $effect(() => {
    const activeId = activeLesson?.id;
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 20) {
        readingProgress = activeId ? 1 : 0;
        return;
      }
      readingProgress = Math.min(1, Math.max(0, scrollTop / docHeight));
    };
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  });

  $effect(() => {
    if (authRoute === 'login') {
      document.title = 'Đăng nhập — KinetixNotes';
    } else if (authRoute === 'register') {
      document.title = 'Đăng ký — KinetixNotes';
    } else if (activeLesson) {
      document.title = `${activeLesson.title} — KinetixNotes`;
    } else {
      document.title = 'KinetixNotes — Tủ sách & Lưu trữ Tri thức';
    }
  });

  $effect(() => {
    if (isAuthScreen) authViewLoaded = true;
  });
  $effect(() => {
    if (isPaletteOpen) paletteLoaded = true;
  });
  $effect(() => {
    if (isShortcutsOpen) shortcutsLoaded = true;
  });
  $effect(() => {
    if (isAddModalOpen) addModalLoaded = true;
  });
  $effect(() => {
    if (!isLessonAdmin && isAddModalOpen) isAddModalOpen = false;
  });

  function handleToggleTheme() {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    theme = nextTheme;
    try {
      localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    } catch {
      // ignore
    }
  }

  function handleSelectLesson(id: number) {
    pageDirection = getLessonNavigationDirection(filteredLessons, selectedLessonId, id);
    selectedLessonId = id;
    mobilePane = 'reader';
    pushLessonPath(id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function handleToggleMastered(id: number) {
    const nextIsMastered = !masteredIds.has(id);
    const nextSet = new Set(masteredIds);
    if (nextIsMastered) nextSet.add(id);
    else nextSet.delete(id);
    masteredIds = nextSet;

    if (user) {
      const { error } = await syncLessonProgressInSupabase(user.id, id, nextIsMastered);
      syncNotice = error ?? null;
    }
  }

  async function handleCreateLesson(input: import('./types/lesson').NewLessonInput) {
    if (!user || !canUserManageLessons(user.email)) {
      return { error: 'Chỉ tài khoản quản trị mới có quyền thêm bài học mới.' };
    }
    const { lesson, error } = await createLessonInSupabase(input, user.id);
    if (error || !lesson) return { error: error ?? 'Không thể thêm bài học.' };

    const updated = mergeCatalogLessons(lessons, [lesson]);
    const newlyAdded = updated[updated.length - 1];
    lessons = updated;
    if (newlyAdded) {
      selectedLessonId = newlyAdded.id;
      pushLessonPath(newlyAdded.id);
    }
    category = 'Tất cả';
    masteryFilter = 'all';
    searchQuery = '';
    mobilePane = 'reader';
    return { error: null };
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    user = null;
    syncNotice = null;
    mobilePane = 'list';
  }

  function handleResetFilters() {
    category = 'Tất cả';
    masteryFilter = 'all';
    searchQuery = '';
  }

  function handlePickRandomLesson() {
    const pool = lessons.filter((lesson) => !masteredIds.has(lesson.id));
    const candidates = pool.length > 0 ? pool : lessons;
    if (candidates.length === 0) return;
    const different = candidates.filter((lesson) => lesson.id !== activeLesson?.id);
    const finalPool = different.length > 0 ? different : candidates;
    const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
    category = 'Tất cả';
    masteryFilter = 'all';
    searchQuery = '';
    pageDirection = getLessonNavigationDirection(lessons, activeLesson?.id ?? null, picked.id);
    selectedLessonId = picked.id;
    mobilePane = 'reader';
    pushLessonPath(picked.id);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function openPalette() {
    isPaletteOpen = true;
  }

  function focusSearch() {
    isPaletteOpen = false;
    isShortcutsOpen = false;
    mobilePane = 'list';
    window.setTimeout(() => searchInputEl?.focus(), 40);
  }

  $effect(() => {
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
        isShortcutsOpen = false;
        isPaletteOpen = !isPaletteOpen;
        return;
      }

      if (authRoute !== 'reader') return;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isPaletteOpen || isShortcutsOpen || isAddModalOpen) return;

      if (event.key === 'ArrowLeft' && prev) {
        event.preventDefault();
        handleSelectLesson(prev.id);
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        handleSelectLesson(next.id);
      } else if (event.key === '?') {
        event.preventDefault();
        isShortcutsOpen = true;
      } else if (event.key.toLowerCase() === 't') {
        handleToggleTheme();
      } else if (event.key.toLowerCase() === 'r') {
        handlePickRandomLesson();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function handleDecreaseFont() {
    const idx = FONT_SIZES.indexOf(fontSizePx as (typeof FONT_SIZES)[number]);
    if (idx > 0) fontSizePx = FONT_SIZES[idx - 1];
  }

  function handleIncreaseFont() {
    const idx = FONT_SIZES.indexOf(fontSizePx as (typeof FONT_SIZES)[number]);
    if (idx >= 0 && idx < FONT_SIZES.length - 1) fontSizePx = FONT_SIZES[idx + 1];
  }
</script>

<a
  href="#main"
  class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-contrast)]"
>
  Bỏ qua tới nội dung chính
</a>

<div
  id="top"
  class="relative z-[1] flex min-h-[100dvh] flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]"
>
  <header class="sticky top-0 z-40 pt-[var(--safe-top)]">
    <TopHeader
      {theme}
      onToggleTheme={handleToggleTheme}
      {masteryFilter}
      onSelectMasteryFilter={(filter) => {
        masteryFilter = filter;
        mobilePane = 'list';
      }}
      onPickRandomLesson={handlePickRandomLesson}
      readingProgress={headerProgress}
      masteredCount={progressStats.masteredCount}
      totalCount={progressStats.totalCount}
      onLogoClick={() => {
        navigateRoute('reader');
        handleResetFilters();
        mobilePane = 'list';
      }}
      userEmail={user?.email ?? null}
      onOpenAuth={() => navigateRoute('login')}
      onSignOut={handleSignOut}
      {isAuthScreen}
      onOpenPalette={openPalette}
      {streak}
    />

    {#if !isAuthScreen}
      <div transition:slide={{ duration: 200, easing: cubicOut }} class="hidden overflow-hidden lg:block">
        <CategoryTabs
          activeCategory={category}
          onSelectCategory={(cat) => {
            category = cat;
            mobilePane = 'list';
          }}
          counts={categoryCounts}
        />
      </div>
    {/if}
  </header>

  <div class="relative flex flex-1 flex-col">
    {#if isAuthScreen}
      <div in:fly={{ duration: 180, y: 10, easing: cubicOut }} out:fly={{ duration: 120, y: -6 }} class="flex flex-1 flex-col">
        {#if authViewLoaded}
          {#await import('./components/AuthView.svelte') then { default: AuthView }}
            <AuthView
              mode={authRoute === 'register' ? 'register' : 'login'}
              onSwitchMode={(nextMode) => navigateRoute(nextMode)}
              onBackToReader={() => navigateRoute('reader')}
              onAuthSuccess={() => navigateRoute('reader')}
            />
          {/await}
        {/if}
      </div>
    {:else}
      <div
        in:fly={{ duration: 180, y: 10, easing: cubicOut }}
        out:fly={{ duration: 120, y: -6 }}
        class="flex flex-1 flex-col max-lg:pb-[calc(var(--tabbar-h)_+_var(--safe-bottom))]"
      >
        <div class="sticky top-[calc(var(--header-h)_+_var(--safe-top))] z-30 lg:hidden">
          <CategoryTabs
            activeCategory={category}
            onSelectCategory={(cat) => {
              category = cat;
              mobilePane = 'list';
            }}
            counts={categoryCounts}
          />
        </div>

        {#if syncNotice}
          <div
            transition:slide={{ duration: 200 }}
            role="status"
            class="overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]"
          >
            <div class="mx-auto flex max-w-[var(--shell-max)] items-center justify-between gap-4 px-4 py-2 text-xs text-[var(--text-secondary)] sm:px-6 lg:px-8">
              <span>{syncNotice}</span>
              <button
                type="button"
                onclick={() => (syncNotice = null)}
                class="shrink-0 font-medium text-[var(--accent)] hover:underline"
              >
                Đóng
              </button>
            </div>
          </div>
        {/if}

        <main
          id="main"
          class="mx-auto grid w-full max-w-[var(--shell-max)] flex-1 grid-cols-1 lg:grid-cols-[352px_minmax(0,1fr)]"
        >
          <div class={mobilePane === 'list' ? 'block mobile-pane-enter' : 'hidden lg:block'}>
            <LibrarySidebar
              lessons={filteredLessons}
              selectedLessonId={activeLesson?.id ?? null}
              onSelectLesson={handleSelectLesson}
              bind:searchInputEl
              searchQuery={searchQuery}
              onSearchChange={(value) => (searchQuery = value)}
              masteredIds={masteredIds}
              progress={progressStats}
              {masteryFilter}
              onSelectMasteryFilter={(filter) => (masteryFilter = filter)}
              activeCategory={category}
              onResetFilters={handleResetFilters}
              canAddLesson={isLessonAdmin}
              onOpenAddLesson={() => {
                if (isLessonAdmin) isAddModalOpen = true;
              }}
            />
          </div>

          <div class={mobilePane === 'reader' ? 'block mobile-pane-enter' : 'hidden lg:block'}>
            <LessonReader
              lesson={activeLesson}
              {pageDirection}
              totalVisible={filteredLessons.length}
              {currentIndex}
              prevLesson={prev}
              nextLesson={next}
              onSelectLesson={handleSelectLesson}
              isMastered={activeLesson ? masteredIds.has(activeLesson.id) : false}
              onToggleMastered={handleToggleMastered}
              fontSizePx={fontSizePx}
              onIncreaseFont={handleIncreaseFont}
              onDecreaseFont={handleDecreaseFont}
              {canIncreaseFont}
              {canDecreaseFont}
              onBackToListMobile={() => (mobilePane = 'list')}
              onResetFilters={handleResetFilters}
              readingProgress={readingProgress}
            />
          </div>
        </main>

        <MobileTabBar
          pane={mobilePane}
          onSelectList={() => (mobilePane = 'list')}
          onSelectReader={() => (mobilePane = 'reader')}
          onOpenPalette={openPalette}
          onPickRandom={handlePickRandomLesson}
          {theme}
          onToggleTheme={handleToggleTheme}
        />
      </div>
    {/if}
  </div>

  {#if updateReady}
    <div
      transition:fly={{ duration: 180, y: 16, easing: cubicOut }}
      role="status"
      aria-live="polite"
      class="fixed inset-x-3 bottom-[calc(var(--tabbar-h)_+_var(--safe-bottom)_+_12px)] z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3.5 py-3 shadow-[var(--shadow-pop)] lg:inset-x-auto lg:right-6 lg:bottom-6"
    >
      <p class="min-w-0 flex-1 text-xs text-[var(--text-secondary)]">
        Đã có bản cập nhật mới của KinetixNotes.
      </p>
      <button
        type="button"
        onclick={() => window.location.reload()}
        class="btn btn-primary min-h-[34px] px-3 text-[12px]"
      >
        Tải lại
      </button>
      <button
        type="button"
        onclick={() => (updateReady = false)}
        aria-label="Ẩn thông báo cập nhật"
        class="icon-btn h-8 w-8 text-base leading-none"
      >
        ×
      </button>
    </div>
  {/if}

  <footer class="border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-4 sm:px-6 lg:px-8 max-lg:pb-[calc(var(--tabbar-h)_+_var(--safe-bottom))]">
    <div class="mx-auto flex max-w-[var(--shell-max)] flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
      <span class="inline-flex items-center gap-2">
        <span class="font-serif text-[13px] font-semibold text-[var(--text-secondary)]">
          KinetixNotes
        </span>
        <span aria-hidden="true">·</span>
        <span>Lưu trữ tri thức &amp; Ôn tập chủ động</span>
      </span>
      <span class="inline-flex items-center gap-3">
        {#if !isSupabaseConfigured}
          <span class="inline-flex items-center gap-1.5 text-[var(--warning)]">
            <span aria-hidden="true" class="h-1.5 w-1.5 rounded-full bg-[var(--warning)]"></span>
            Chế độ cục bộ
          </span>
        {/if}
        <button
          type="button"
          onclick={() => (isShortcutsOpen = true)}
          class="rounded font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
        >
          Phím tắt (?)
        </button>
      </span>
    </div>
  </footer>

  {#if paletteLoaded}
    {#await import('./components/CommandPalette.svelte') then { default: CommandPalette }}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => (isPaletteOpen = false)}
        lessons={lessons}
        onSelectLesson={(id) => {
          handleSelectLesson(id);
          isPaletteOpen = false;
        }}
        onPickRandom={handlePickRandomLesson}
        onResetFilters={() => {
          handleResetFilters();
          mobilePane = 'list';
        }}
        onToggleTheme={handleToggleTheme}
        theme={theme}
        userEmail={user?.email ?? null}
        onOpenAuth={() => {
          isPaletteOpen = false;
          navigateRoute('login');
        }}
        onSignOut={handleSignOut}
        canAddLesson={isLessonAdmin}
        onOpenAddLesson={() => {
          isPaletteOpen = false;
          if (isLessonAdmin) isAddModalOpen = true;
        }}
        onOpenShortcuts={() => {
          isPaletteOpen = false;
          isShortcutsOpen = true;
        }}
      />
    {/await}
  {/if}

  {#if shortcutsLoaded}
    {#await import('./components/ShortcutsDialog.svelte') then { default: ShortcutsDialog }}
      <ShortcutsDialog isOpen={isShortcutsOpen} onClose={() => (isShortcutsOpen = false)} />
    {/await}
  {/if}

  {#if addModalLoaded}
    {#await import('./components/AddLessonModal.svelte') then { default: AddLessonModal }}
      <AddLessonModal
        isOpen={isAddModalOpen && isLessonAdmin}
        onClose={() => (isAddModalOpen = false)}
        onSubmitLesson={handleCreateLesson}
      />
    {/await}
  {/if}
</div>
