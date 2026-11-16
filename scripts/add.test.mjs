import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCategory,
  parseCliArgs,
  validateAndBuildLesson,
} from './add-lib.mjs';

test('normalizeCategory resolves Vietnamese names and English aliases', () => {
  assert.equal(normalizeCategory('ai'), 'Trí tuệ AI');
  assert.equal(normalizeCategory('Trí tuệ AI'), 'Trí tuệ AI');
  assert.equal(normalizeCategory('cs'), 'Máy tính');
  assert.equal(normalizeCategory('psychology'), 'Tâm lý & Sống');
  assert.equal(normalizeCategory('economics'), 'Kinh tế');
  assert.throws(() => normalizeCategory('unknown'), /không hợp lệ/);
});

test('parseCliArgs parses JSON payload, --file, and --push flag', () => {
  const parsed = parseCliArgs(['{"title":"Test"}', '--push']);
  assert.equal(parsed.jsonInput, '{"title":"Test"}');
  assert.equal(parsed.shouldPush, true);
  assert.equal(parsed.filePath, null);

  const fromFile = parseCliArgs(['--file', 'note.json']);
  assert.equal(fromFile.filePath, 'note.json');
  assert.equal(fromFile.shouldPush, false);
});

test('validateAndBuildLesson auto-increments id and sets ISO createdAt', () => {
  const fixedNow = new Date('2026-11-16T12:00:00.000Z');
  const existing = [{ id: 24, category: 'Kinh tế', title: 'Old' }];
  const built = validateAndBuildLesson(
    {
      category: 'ai',
      title: 'Attention Head',
      summary: 'Nhiều đầu chú ý song song.',
      points: ['MHA (Multi-Head Attention — Chú ý đa đầu) giúp mô hình nắm bắt nhiều ngữ cảnh cùng lúc.'],
      quiz: 'Vì sao cần nhiều đầu chú ý?',
      answer: 'Để theo dõi đồng thời quan hệ ngữ pháp, ngữ nghĩa và tham chiếu đại từ.',
    },
    existing,
    fixedNow
  );

  assert.equal(built.id, 25);
  assert.equal(built.category, 'Trí tuệ AI');
  assert.equal(built.createdAt, '2026-11-16T12:00:00.000Z');
});

test('validateAndBuildLesson rejects missing required fields', () => {
  assert.throws(
    () =>
      validateAndBuildLesson(
        {
          category: 'ai',
          title: 'Missing quiz',
          summary: 'Summary',
          points: ['Point 1'],
          quiz: '',
          answer: 'Answer',
        },
        []
      ),
    /quiz/
  );
});
