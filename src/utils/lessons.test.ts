import test from 'node:test';
import assert from 'node:assert/strict';
import lessonsData from '../data/lessons.json';
import type { Lesson } from '../types/lesson';
import {
  filterLessons,
  getAdjacentLessons,
  getCategoryCounts,
  getLessonNavigationDirection,
  getProgressStats,
  normalizeForSearch,
  splitPointLead,
  tokenizeTechnicalTerms,
} from './lessons';

const lessons = lessonsData as Lesson[];

test('seeded lessons data contains exactly 24 lessons with expected category breakdown', () => {
  assert.equal(lessons.length, 24);
  const counts = getCategoryCounts(lessons);
  assert.equal(counts['Tất cả'], 24);
  assert.equal(counts['Máy tính'], 7);
  assert.equal(counts['Trí tuệ AI'], 7);
  assert.equal(counts['Tâm lý & Sống'], 9);
  assert.equal(counts['Kinh tế'], 1);
});

test('normalizeForSearch handles Vietnamese diacritics and đ/Đ cleanly', () => {
  assert.equal(normalizeForSearch('Trí tuệ Nhân tạo'), 'tri tue nhan tao');
  assert.equal(normalizeForSearch('Định kiến xác nhận'), 'dinh kien xac nhan');
});

test('filterLessons filters by category, mastery state, and diacritic-insensitive search', () => {
  const mastered = new Set<number>([1, 8]);

  const aiOnly = filterLessons(lessons, {
    category: 'Trí tuệ AI',
    query: '',
    masteryFilter: 'all',
    masteredIds: mastered,
  });
  assert.equal(aiOnly.length, 7);

  const searchWithoutAccents = filterLessons(lessons, {
    category: 'Tất cả',
    query: 'lam phat',
    masteryFilter: 'all',
    masteredIds: mastered,
  });
  assert.equal(searchWithoutAccents.length, 1);
  assert.equal(searchWithoutAccents[0].category, 'Kinh tế');

  const masteredOnly = filterLessons(lessons, {
    category: 'Tất cả',
    query: '',
    masteryFilter: 'mastered',
    masteredIds: mastered,
  });
  assert.deepEqual(
    masteredOnly.map((l) => l.id),
    [1, 8]
  );

  const unmasteredInAi = filterLessons(lessons, {
    category: 'Trí tuệ AI',
    query: '',
    masteryFilter: 'unmastered',
    masteredIds: mastered,
  });
  assert.equal(unmasteredInAi.length, 6);
});

test('getProgressStats computes mastered count and rounded percentage', () => {
  const statsEmpty = getProgressStats(lessons, new Set());
  assert.deepEqual(statsEmpty, { masteredCount: 0, totalCount: 24, percentage: 0 });

  const statsHalf = getProgressStats(
    lessons,
    new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  );
  assert.deepEqual(statsHalf, { masteredCount: 12, totalCount: 24, percentage: 50 });
});

test('getAdjacentLessons finds prev and next within filtered list', () => {
  const slice = lessons.slice(0, 3);
  const first = getAdjacentLessons(slice, slice[0].id);
  assert.equal(first.prev, null);
  assert.equal(first.next?.id, slice[1].id);
  assert.equal(first.currentIndex, 0);

  const middle = getAdjacentLessons(slice, slice[1].id);
  assert.equal(middle.prev?.id, slice[0].id);
  assert.equal(middle.next?.id, slice[2].id);

  const last = getAdjacentLessons(slice, slice[2].id);
  assert.equal(last.prev?.id, slice[1].id);
  assert.equal(last.next, null);
});

test('splitPointLead extracts technical term and Vietnamese gloss cleanly', () => {
  const parsed = splitPointLead(
    'CPU (Central Processing Unit — Bộ xử lý trung tâm) là bộ não tính toán.'
  );
  assert.equal(parsed.leadTerm, 'CPU');
  assert.equal(parsed.explanation, 'Central Processing Unit — Bộ xử lý trung tâm');
  assert.equal(parsed.rest, 'là bộ não tính toán.');
});

test('tokenizeTechnicalTerms isolates technical acronyms and Big-O notation', () => {
  const segs = tokenizeTechnicalTerms('Dùng GPU cho LLM đạt O(log n).');
  const monoTokens = segs.filter((s) => s.isMono).map((s) => s.text);
  assert.deepEqual(monoTokens, ['GPU', 'LLM', 'O(log n)']);
});

test('getLessonNavigationDirection determines forward vs backward page turn', () => {
  const slice = lessons.slice(0, 5);
  assert.equal(getLessonNavigationDirection(slice, slice[0].id, slice[2].id), 1);
  assert.equal(getLessonNavigationDirection(slice, slice[3].id, slice[1].id), -1);
  assert.equal(getLessonNavigationDirection(slice, null, slice[0].id), 1);
  assert.equal(getLessonNavigationDirection(slice, 10, 4), -1);
});
