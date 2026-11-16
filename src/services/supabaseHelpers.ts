import type { Category, Lesson } from '../types/lesson';
import { CATEGORY_LIST, normalizeForSearch } from '../utils/lessons';

const VALID_CATEGORIES = new Set<string>(CATEGORY_LIST);

export interface RemoteLessonRow {
  id?: number | string;
  user_id?: string | null;
  category?: unknown;
  title?: unknown;
  summary?: unknown;
  points?: unknown;
  quiz?: unknown;
  answer?: unknown;
  created_at?: unknown;
  createdAt?: unknown;
}

export function normalizeCategoryValue(raw: unknown): Category {
  if (typeof raw === 'string' && VALID_CATEGORIES.has(raw.trim())) {
    return raw.trim() as Category;
  }
  return 'Máy tính';
}

export function normalizePointsList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function normalizeRemoteLesson(row: RemoteLessonRow): Lesson | null {
  const numericId = Number(row.id);
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  const summary = typeof row.summary === 'string' ? row.summary.trim() : '';
  const quiz = typeof row.quiz === 'string' ? row.quiz.trim() : '';
  const answer = typeof row.answer === 'string' ? row.answer.trim() : '';
  const points = normalizePointsList(row.points);

  if (!Number.isFinite(numericId) || numericId <= 0 || !title || !summary) {
    return null;
  }

  const createdRaw = row.created_at ?? row.createdAt;
  const createdAt =
    typeof createdRaw === 'string' && createdRaw.trim()
      ? createdRaw.trim()
      : new Date().toISOString();

  return {
    id: numericId,
    category: normalizeCategoryValue(row.category),
    title,
    summary,
    points: points.length > 0 ? points : [summary],
    quiz: quiz || 'Ý chính quan trọng nhất của bài này là gì?',
    answer: answer || summary,
    createdAt,
    user_id: typeof row.user_id === 'string' ? row.user_id : null,
  };
}

/**
 * Keeps default seeded lessons when the Supabase `lessons` table is empty,
 * and seamlessly merges user-added Supabase lessons without dropping defaults.
 */
export function mergeCatalogLessons(
  defaultLessons: readonly Lesson[],
  remoteLessons: readonly Lesson[]
): Lesson[] {
  if (remoteLessons.length === 0) {
    return [...defaultLessons];
  }

  // If Supabase already stores a full catalog (>= default size), use it directly.
  if (remoteLessons.length >= defaultLessons.length) {
    return [...remoteLessons].sort((a, b) => a.id - b.id);
  }

  const merged = [...defaultLessons];
  const existingTitles = new Map<string, number>();
  merged.forEach((lesson, index) => {
    existingTitles.set(normalizeForSearch(lesson.title), index);
  });

  let nextSafeId = merged.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  for (const remote of remoteLessons) {
    const titleKey = normalizeForSearch(remote.title);
    const matchingIndex = existingTitles.get(titleKey);
    if (matchingIndex !== undefined) {
      merged[matchingIndex] = remote;
    } else {
      const idTaken = merged.some((item) => item.id === remote.id);
      const safeLesson: Lesson = idTaken
        ? { ...remote, id: nextSafeId++ }
        : remote;
      merged.push(safeLesson);
      existingTitles.set(titleKey, merged.length - 1);
      if (safeLesson.id >= nextSafeId) {
        nextSafeId = safeLesson.id + 1;
      }
    }
  }

  return merged;
}

export function formatSupabaseAuthError(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tài khoản chưa xác nhận email. Vui lòng mở hộp thư và nhấn liên kết xác nhận.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Email này đã được đăng ký tài khoản. Hãy chuyển sang tab Đăng nhập.';
  }
  if (msg.includes('password should be at least')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  if (msg.includes('unable to validate email address') || msg.includes('invalid email')) {
    return 'Địa chỉ email chưa đúng định dạng.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network')) {
    return 'Không thể kết nối tới máy chủ Supabase. Vui lòng kiểm tra mạng.';
  }

  return rawMessage || 'Đã xảy ra lỗi xác thực. Vui lòng thử lại.';
}

export function parsePointsTextarea(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);
}

export const ADMIN_AUTHOR_EMAIL = 'diemmycodex@gmail.com';

export function canUserManageLessons(email: string | null | undefined): boolean {
  if (typeof email !== 'string') return false;
  return email.trim().toLowerCase() === ADMIN_AUTHOR_EMAIL;
}
