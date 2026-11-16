export const CATEGORY_ALIASES = {
  'máy tính': 'Máy tính',
  'may tinh': 'Máy tính',
  maytinh: 'Máy tính',
  computer: 'Máy tính',
  cs: 'Máy tính',
  tech: 'Máy tính',
  'trí tuệ ai': 'Trí tuệ AI',
  'tri tue ai': 'Trí tuệ AI',
  ai: 'Trí tuệ AI',
  'tâm lý & sống': 'Tâm lý & Sống',
  'tam ly & song': 'Tâm lý & Sống',
  'tam ly': 'Tâm lý & Sống',
  tamly: 'Tâm lý & Sống',
  psychology: 'Tâm lý & Sống',
  life: 'Tâm lý & Sống',
  'kinh tế': 'Kinh tế',
  'kinh te': 'Kinh tế',
  kinhte: 'Kinh tế',
  economy: 'Kinh tế',
  economics: 'Kinh tế',
};

export function normalizeCategory(rawCategory) {
  if (typeof rawCategory !== 'string' || !rawCategory.trim()) {
    throw new Error('Thiếu trường "category" hợp lệ.');
  }
  const key = rawCategory.trim().toLowerCase();
  const mapped = CATEGORY_ALIASES[key];
  if (!mapped) {
    throw new Error(
      `Danh mục "${rawCategory}" không hợp lệ. Các danh mục hỗ trợ: Máy tính, Trí tuệ AI (ai), Tâm lý & Sống (psychology/life), Kinh tế (economics).`
    );
  }
  return mapped;
}

export function parseCliArgs(argv) {
  let jsonInput = null;
  let filePath = null;
  let shouldPush = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--push') {
      shouldPush = true;
    } else if (arg === '--file' || arg === '-f') {
      filePath = argv[i + 1] ?? null;
      i += 1;
    } else if (!arg.startsWith('-') && jsonInput === null) {
      jsonInput = arg;
    }
  }

  return { jsonInput, filePath, shouldPush };
}

export function validateAndBuildLesson(rawPayload, existingLessons, now = new Date()) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new Error('Dữ liệu đầu vào phải là một đối tượng JSON hợp lệ.');
  }

  const category = normalizeCategory(rawPayload.category);

  const title = typeof rawPayload.title === 'string' ? rawPayload.title.trim() : '';
  if (!title) {
    throw new Error('Thiếu trường "title" (tiêu đề bài học).');
  }

  const summary =
    typeof rawPayload.summary === 'string' ? rawPayload.summary.trim() : '';
  if (!summary) {
    throw new Error('Thiếu trường "summary" (tóm tắt bài học).');
  }

  if (!Array.isArray(rawPayload.points) || rawPayload.points.length === 0) {
    throw new Error('Trường "points" phải là mảng có ít nhất 1 ý chính.');
  }

  const points = rawPayload.points
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);

  if (points.length === 0) {
    throw new Error('Các mục trong "points" không được để trống.');
  }

  const quiz = typeof rawPayload.quiz === 'string' ? rawPayload.quiz.trim() : '';
  if (!quiz) {
    throw new Error('Thiếu trường "quiz" (câu hỏi ôn bài).');
  }

  const answer =
    typeof rawPayload.answer === 'string' ? rawPayload.answer.trim() : '';
  if (!answer) {
    throw new Error('Thiếu trường "answer" (đáp án câu hỏi).');
  }

  const maxId = existingLessons.reduce(
    (max, item) => (typeof item.id === 'number' && item.id > max ? item.id : max),
    0
  );

  const createdAt =
    typeof rawPayload.createdAt === 'string' && rawPayload.createdAt.trim()
      ? rawPayload.createdAt.trim()
      : now.toISOString();

  return {
    id: maxId + 1,
    category,
    title,
    summary,
    points,
    quiz,
    answer,
    createdAt,
  };
}
