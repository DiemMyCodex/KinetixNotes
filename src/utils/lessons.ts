import type { Category, CategoryFilter, Lesson, MasteryFilter } from '../types/lesson';

export const CATEGORY_LIST: Category[] = [
  'Máy tính',
  'Trí tuệ AI',
  'Tâm lý & Sống',
  'Kinh tế',
];

export const CATEGORY_FILTERS: CategoryFilter[] = ['Tất cả', ...CATEGORY_LIST];

export interface FilterCriteria {
  category: CategoryFilter;
  query: string;
  masteryFilter: MasteryFilter;
  masteredIds: ReadonlySet<number>;
}

/**
 * Strips Vietnamese diacritics and lowercases text for forgiving instant search.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function filterLessons(
  lessons: readonly Lesson[],
  criteria: FilterCriteria
): Lesson[] {
  const { category, query, masteryFilter, masteredIds } = criteria;
  const normalizedQuery = normalizeForSearch(query);

  return lessons.filter((lesson) => {
    if (category !== 'Tất cả' && lesson.category !== category) {
      return false;
    }

    const isMastered = masteredIds.has(lesson.id);
    if (masteryFilter === 'mastered' && !isMastered) {
      return false;
    }
    if (masteryFilter === 'unmastered' && isMastered) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      lesson.title,
      lesson.summary,
      lesson.category,
      ...lesson.points,
      lesson.quiz,
      lesson.answer,
    ]
      .map(normalizeForSearch)
      .join(' ');

    return searchableText.includes(normalizedQuery);
  });
}

export function getCategoryCounts(
  lessons: readonly Lesson[]
): Record<CategoryFilter, number> {
  const counts: Record<CategoryFilter, number> = {
    'Tất cả': lessons.length,
    'Máy tính': 0,
    'Trí tuệ AI': 0,
    'Tâm lý & Sống': 0,
    'Kinh tế': 0,
  };

  for (const lesson of lessons) {
    if (lesson.category in counts) {
      counts[lesson.category] += 1;
    }
  }

  return counts;
}

export interface ProgressStats {
  masteredCount: number;
  totalCount: number;
  percentage: number;
}

export function getProgressStats(
  lessons: readonly Lesson[],
  masteredIds: ReadonlySet<number>
): ProgressStats {
  const totalCount = lessons.length;
  if (totalCount === 0) {
    return { masteredCount: 0, totalCount: 0, percentage: 0 };
  }

  let masteredCount = 0;
  for (const lesson of lessons) {
    if (masteredIds.has(lesson.id)) {
      masteredCount += 1;
    }
  }

  return {
    masteredCount,
    totalCount,
    percentage: Math.round((masteredCount / totalCount) * 100),
  };
}

export function getAdjacentLessons(
  visibleLessons: readonly Lesson[],
  currentLessonId: number | null
): { prev: Lesson | null; next: Lesson | null; currentIndex: number } {
  if (currentLessonId === null || visibleLessons.length === 0) {
    return { prev: null, next: null, currentIndex: -1 };
  }

  const index = visibleLessons.findIndex((item) => item.id === currentLessonId);
  if (index === -1) {
    return { prev: null, next: null, currentIndex: -1 };
  }

  return {
    prev: index > 0 ? visibleLessons[index - 1] : null,
    next: index < visibleLessons.length - 1 ? visibleLessons[index + 1] : null,
    currentIndex: index,
  };
}

export function getLessonNavigationDirection(
  visibleLessons: readonly Lesson[],
  fromLessonId: number | null,
  toLessonId: number | null
): 1 | -1 {
  if (fromLessonId === null || toLessonId === null || fromLessonId === toLessonId) {
    return 1;
  }

  const fromIndex = visibleLessons.findIndex((item) => item.id === fromLessonId);
  const toIndex = visibleLessons.findIndex((item) => item.id === toLessonId);

  if (fromIndex !== -1 && toIndex !== -1) {
    return toIndex < fromIndex ? -1 : 1;
  }

  return toLessonId < fromLessonId ? -1 : 1;
}

export function estimateReadMinutes(lesson: Lesson): number {
  const totalWords = [
    lesson.title,
    lesson.summary,
    ...lesson.points,
    lesson.quiz,
    lesson.answer,
  ]
    .join(' ')
    .trim()
    .split(/\s+/).length;

  return Math.max(1, Math.ceil(totalWords / 180));
}

export function formatShortDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface PointSplit {
  leadTerm: string | null;
  explanation: string | null;
  rest: string;
}

/**
 * Splits a bullet point shaped like "Term (Explanation) rest..."
 * so the leading phrase can be emphasized cleanly.
 */
export function splitPointLead(point: string): PointSplit {
  const match = point.match(/^([A-Za-z0-9À-ỹ&/+\-.\s]{2,42}?)\s*\(([^)]{2,120})\)\s*(.*)$/);
  if (!match) {
    return { leadTerm: null, explanation: null, rest: point };
  }

  return {
    leadTerm: match[1].trim(),
    explanation: match[2].trim(),
    rest: match[3].trim(),
  };
}

export interface TextSegment {
  text: string;
  isMono: boolean;
}

const TECHNICAL_TOKEN_REGEX =
  /(\b(?:CPU|RAM|GPU|LLM|RAG|ML|RL|OS|IP|DNS|TCP\/IP|TCP|HTTP\/HTTPS|HTTP|HTTPS|TLS|RDBMS|ACID|SQL|CDN|TTL|AES|RSA|ECC|SHA-256|RNN|CoT|ReAct|JSON|CPI|GDP|Q-K-V|L1|L2|L3|B-Tree|ReLU)\b|O\([^)]+\))/g;

export function tokenizeTechnicalTerms(text: string): TextSegment[] {
  if (!text) return [];
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TECHNICAL_TOKEN_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      segments.push({ text: text.slice(lastIndex, idx), isMono: false });
    }
    segments.push({ text: match[0], isMono: true });
    lastIndex = idx + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isMono: false });
  }

  return segments;
}
