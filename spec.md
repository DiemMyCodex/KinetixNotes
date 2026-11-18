# KinetixNotes UI v2 — Spec (2026-11-18)

## Goal
Refresh the reading experience end-to-end: sharper editorial design system, faster navigation
(command palette + shortcuts + deep links), mobile/PWA-grade ergonomics, and a batch of
accessibility/production bug fixes. No backend or data-model changes.

## Non-goals
- No Supabase schema/RLS changes, no auth flow changes.
- No CMS/editorial tooling beyond the existing admin "Thêm bài mới" modal.

## Locked decisions
1. **Visual language = editorial v2**, not a new brand: warm paper, ink type, single blue accent,
   but with category hues, layered surfaces, a real type/space scale, softer shadows.
2. **One accent per meaning**: category color (dot/label), mastered green, danger red, accent blue.
3. **Runtime deps unchanged** (React 19, motion, lucide, supabase). New icons/features are
   code-split; no state library.

## Delivery
### 1. Design system (`src/index.css`)
- Tokens: surfaces, text (WCAG AA), accent, semantic, category hues, radii, shadows, layout
  (`--header-h`, `--tabs-h`, `--tabbar-h`, `--safe-bottom`), easing.
- Primitives: `.surface`, `.btn/-primary/-secondary/-ghost`, `.icon-btn`, `.field`, `.chip`,
  `.kicker`, `.scroll-thin`, `.fade-x`, focus-visible ring, paper grain, reduced-motion.
- Dark mode parity for every token.

### 2. Shell
- `TopHeader`: glass sticky bar, gradient reading-progress hairline, wordmark mark, mastery nav,
  palette trigger with `⌘K` hint, streak chip, theme + auth actions.
- `CategoryTabs`: icons, counts, category hue, scroll fade mask, active pill.
- `MobileTabBar` (new, `<lg`): Tủ sách · Ôn ngẫu nhiên · Tìm · Giao diện, safe-area aware.
- `CommandPalette` (new): `⌘K`/`Ctrl K`, fuzzy search over lessons + actions, arrow/enter/esc.
- `ShortcutsDialog` (new): `?` opens; lists every shortcut.

### 3. Reader
- Utility strip: breadcrumb, `% đã đọc`, `~N phút còn lại`, font stepper, share, mastered toggle.
- Article: category-hued kicker, balanced title, time-left, quiz card with accent edge.
- Swipe left/right on touch to move between lessons; bottom cards keep arrow-key parity.
- Deep link `/bai/:id` (pushState + popstate), share copies canonical URL.

### 4. Sidebar
- Progress ring + counts, search with `/` hint, mobile mastery segmented control.
- List rows keep mono index, add category dot, fix heading-inside-button markup, scroll selected
  into view, empty state.

### 5. Modals / a11y
- Shared `useDialogA11y`: Escape to close, focus trap, body scroll lock, focus restore.
- Password visibility toggle; `aria-live` feedback for copy/auth errors.
- Skip link, `<main id="main">`, labelled regions, `aria-valuetext` progress.
- Fix side effect inside `setLessons` updater (new lesson id computed outside).

### 6. PWA
- `manifest.webmanifest`, 192/512/maskable/apple icons, `theme-color` light+dark, apple meta.
- Offline service worker (prod only): precache shell, network-first navigation, cache-first hashed
  assets, cache version cleanup, update notice hook.
- OG/Twitter image + description refresh.

### 7. Perf
- Lazy-load `AuthView`, `AddLessonModal`, `CommandPalette`, `ShortcutsDialog`; vendor chunk split.
- Target: initial JS < 220 kB gzip (from ~204 kB gzip / 691 kB raw), no layout shift.

## Acceptance checks
```bash
npx tsc --noEmit
npm test
npm run build
npx vite preview --port 4173 & curl -sI localhost:4173/ ; curl -s localhost:4173/manifest.webmanifest
```
- 375 px: no horizontal scroll, tab bar clears safe area, all taps ≥ 40 px.
- Keyboard only: `/`, `⌘K`, `?`, `T`, `R`, `←/→`, `Esc` all work; focus visible everywhere.
- Light + dark manual pass on header/sidebar/reader/auth/palette/modal.
- No console errors; SW registered only in production.
