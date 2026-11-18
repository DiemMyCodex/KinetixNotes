import { Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type FormEvent } from 'react';
import { useDialogA11y } from '../lib/useDialogA11y';
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [category, setCategory] = useState<Category>('Trí tuệ AI');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [pointsText, setPointsText] = useState('');
  const [quiz, setQuiz] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useDialogA11y(panelRef, isOpen, onClose);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const pointsCount = parsePointsTextarea(pointsText).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-lesson-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-h-[90dvh] w-full max-w-[580px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] px-5 py-4">
              <div>
                <h2
                  id="add-lesson-title"
                  className="font-serif text-xl font-semibold text-[var(--text-primary)]"
                >
                  Thêm bài học mới
                </h2>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-secondary)]">
                  Bài học được lưu vào bảng <code className="font-mono text-[10.5px]">lessons</code>{' '}
                  trên Supabase và gắn với tài khoản quản trị.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng hộp thoại"
                className="icon-btn h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <label
                    htmlFor="new-lesson-category"
                    className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                  >
                    Tủ sách
                  </label>
                  <select
                    id="new-lesson-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as Category)}
                    className="field min-h-[40px] text-[13px]"
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
                    className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                  >
                    Tiêu đề
                  </label>
                  <input
                    id="new-lesson-title"
                    data-autofocus
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ví dụ: Cơ chế Attention trong Transformer"
                    className="field min-h-[40px] text-[13px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-lesson-summary"
                    className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                  >
                    Tóm tắt ngắn
                  </label>
                  <textarea
                    id="new-lesson-summary"
                    rows={2}
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="Một đến hai câu tóm gọn ý tưởng trọng tâm..."
                    className="field min-h-[64px] resize-y text-[13px]"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="new-lesson-points"
                      className="text-[11.5px] font-semibold text-[var(--text-secondary)]"
                    >
                      Các ý chính (mỗi dòng một ý)
                    </label>
                    <span className="font-mono text-[10.5px] tabular-nums text-[var(--text-muted)]">
                      {pointsCount} ý
                    </span>
                  </div>
                  <textarea
                    id="new-lesson-points"
                    rows={4}
                    value={pointsText}
                    onChange={(event) => setPointsText(event.target.value)}
                    placeholder="Mỗi dòng một ý chính, giải thích rõ từ viết tắt..."
                    className="field min-h-[104px] resize-y text-[13px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-lesson-quiz"
                    className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                  >
                    Câu hỏi ôn tập
                  </label>
                  <input
                    id="new-lesson-quiz"
                    type="text"
                    value={quiz}
                    onChange={(event) => setQuiz(event.target.value)}
                    placeholder="Câu hỏi gợi nhớ chủ động..."
                    className="field min-h-[40px] text-[13px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-lesson-answer"
                    className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                  >
                    Đáp án
                  </label>
                  <textarea
                    id="new-lesson-answer"
                    rows={2}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Câu trả lời ngắn gọn, súc tích..."
                    className="field min-h-[64px] resize-y text-[13px]"
                  />
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--danger)]"
                  >
                    {errorMsg}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[var(--border-hairline)] bg-[var(--bg-subtle)]/60 px-5 py-3">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary min-w-[112px]">
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
