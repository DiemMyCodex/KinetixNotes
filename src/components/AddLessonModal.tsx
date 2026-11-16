import { Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { parsePointsTextarea } from '../services/supabaseHelpers';
import type { Category, NewLessonInput } from '../types/lesson';
import { CATEGORY_LIST } from '../utils/lessons';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLesson: (input: NewLessonInput) => Promise<{ error: string | null }>;
}

export function AddLessonModal({
  isOpen,
  onClose,
  onSubmitLesson,
}: AddLessonModalProps) {
  const [category, setCategory] = useState<Category>('Trí tuệ AI');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [quiz, setQuiz] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedPoints = parsePointsTextarea(pointsText);
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Vui lòng nhập phần tóm tắt.');
      return;
    }
    if (parsedPoints.length === 0) {
      setErrorMsg('Vui lòng nhập ít nhất 1 ý chính.');
      return;
    }
    if (!quiz.trim() || !answer.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ câu hỏi ôn tập và đáp án.');
      return;
    }

    setIsSaving(true);
    const { error } = await onSubmitLesson({
      category,
      title: title.trim(),
      summary: summary.trim(),
      points: parsedPoints,
      quiz: quiz.trim(),
      answer: answer.trim(),
    });
    setIsSaving(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    setTitle('');
    setSummary('');
    setPointsText('');
    setQuiz('');
    setAnswer('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-lesson-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-scroll max-h-[90vh] w-full max-w-[580px] overflow-y-auto rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 sm:p-7 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
              <div>
                <h2
                  id="add-lesson-title"
                  className="font-serif text-xl font-semibold text-[var(--text-primary)]"
                >
                  Thêm bài học mới
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Bài học mới sẽ được lưu vào bảng lessons trên Supabase gắn với tài khoản của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-hairline)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="new-lesson-category"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Tủ sách
            </label>
            <select
              id="new-lesson-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full min-h-[40px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-lesson-title"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Tiêu đề
            </label>
            <input
              id="new-lesson-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Cơ chế Attention trong Transformer"
              className="w-full min-h-[40px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-lesson-summary"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Tóm tắt ngắn
            </label>
            <textarea
              id="new-lesson-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Một đến hai câu tóm gọn ý tưởng trọng tâm..."
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-lesson-points"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Các ý chính (mỗi dòng một ý)
            </label>
            <textarea
              id="new-lesson-points"
              rows={4}
              value={pointsText}
              onChange={(e) => setPointsText(e.target.value)}
              placeholder="Mỗi dòng một ý chính, giải thích rõ từ viết tắt..."
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-lesson-quiz"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Câu hỏi ôn tập
            </label>
            <input
              id="new-lesson-quiz"
              type="text"
              value={quiz}
              onChange={(e) => setQuiz(e.target.value)}
              placeholder="Câu hỏi gợi nhớ chủ động..."
              className="w-full min-h-[40px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-lesson-answer"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Đáp án
            </label>
            <textarea
              id="new-lesson-answer"
              rows={2}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Câu trả lời ngắn gọn, súc tích..."
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-md border border-red-500/35 bg-red-500/8 px-3.5 py-2.5 text-xs leading-relaxed text-red-700 dark:text-red-300"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-hairline)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu bài học'}</span>
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
