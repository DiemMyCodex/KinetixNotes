import test from 'node:test';
import assert from 'node:assert/strict';
import lessonsData from '../data/lessons.json';
import type { Lesson } from '../types/lesson';
import {
  canUserManageLessons,
  formatSupabaseAuthError,
  mergeCatalogLessons,
  normalizeRemoteLesson,
  parsePointsTextarea,
} from './supabaseHelpers';

const defaultLessons = lessonsData as Lesson[];

test('normalizeRemoteLesson parses snake_case Supabase row cleanly', () => {
  const normalized = normalizeRemoteLesson({
    id: 25,
    user_id: 'user-123',
    category: 'Trí tuệ AI',
    title: 'Mixture of Experts',
    summary: 'Kiến trúc kích hoạt từng chuyên gia theo ngữ cảnh.',
    points: ['MoE (Mixture of Experts — Hỗn hợp chuyên gia) giảm chi phí suy luận.'],
    quiz: 'Lợi ích chính của MoE là gì?',
    answer: 'Chỉ kích hoạt một phần nhỏ tham số cho mỗi token.',
    created_at: '2026-11-16T05:00:00.000Z',
  });

  assert.ok(normalized);
  assert.equal(normalized.id, 25);
  assert.equal(normalized.category, 'Trí tuệ AI');
  assert.equal(normalized.user_id, 'user-123');
  assert.equal(normalized.createdAt, '2026-11-16T05:00:00.000Z');
});

test('mergeCatalogLessons keeps the full default catalog when Supabase table is empty', () => {
  const merged = mergeCatalogLessons(defaultLessons, []);
  assert.equal(merged.length, defaultLessons.length);
  assert.equal(merged[0].id, 1);
});

test('mergeCatalogLessons preserves defaults and avoids ID collision when table has only custom user lessons', () => {
  const customLesson: Lesson = {
    id: 1,
    category: 'Kinh tế',
    title: 'Lãi suất thực và Lãi suất danh nghĩa',
    summary: 'Phân biệt lãi suất ghi trên hợp đồng và sức mua thực tế.',
    points: ['Real Interest Rate (Lãi suất thực) xấp xỉ lãi suất danh nghĩa trừ lạm phát.'],
    quiz: 'Khi nào lãi suất thực âm?',
    answer: 'Khi tỷ lệ lạm phát cao hơn lãi suất danh nghĩa.',
    createdAt: '2026-11-16T06:00:00.000Z',
    user_id: 'u-1',
  };

  const nextSafeId = Math.max(...defaultLessons.map((lesson) => lesson.id)) + 1;
  const merged = mergeCatalogLessons(defaultLessons, [customLesson]);
  assert.equal(merged.length, defaultLessons.length + 1);
  assert.equal(merged[0].title, defaultLessons[0].title);
  assert.equal(merged[defaultLessons.length].id, nextSafeId);
  assert.equal(merged[defaultLessons.length].title, customLesson.title);
});

test('formatSupabaseAuthError translates auth messages to clear Vietnamese inline copy', () => {
  assert.match(formatSupabaseAuthError('Invalid login credentials'), /không chính xác/);
  assert.match(formatSupabaseAuthError('User already registered'), /đã được đăng ký/);
  assert.match(formatSupabaseAuthError('Email not confirmed'), /chưa xác nhận email/);
});

test('parsePointsTextarea strips leading bullet markers and empty lines', () => {
  const parsed = parsePointsTextarea('- Ý thứ nhất\n1. Ý thứ hai\n\n* Ý thứ ba');
  assert.deepEqual(parsed, ['Ý thứ nhất', 'Ý thứ hai', 'Ý thứ ba']);
});

test('canUserManageLessons only allows diemmycodex@gmail.com', () => {
  assert.equal(canUserManageLessons('diemmycodex@gmail.com'), true);
  assert.equal(canUserManageLessons('  DiemMyCodex@Gmail.com '), true);
  assert.equal(canUserManageLessons('other@gmail.com'), false);
  assert.equal(canUserManageLessons(null), false);
  assert.equal(canUserManageLessons(undefined), false);
  assert.equal(canUserManageLessons(''), false);
});
