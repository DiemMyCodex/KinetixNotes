import { Command, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';
import { useDialogA11y } from '../lib/useDialogA11y';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['⌘', 'K'], label: 'Mở bảng tìm kiếm & lệnh nhanh' },
  { keys: ['/'], label: 'Focus ô tìm kiếm trong tủ sách' },
  { keys: ['←', '→'], label: 'Chuyển bài trước / bài tiếp theo' },
  { keys: ['T'], label: 'Đổi giao diện sáng / tối' },
  { keys: ['R'], label: 'Ôn một bài ngẫu nhiên' },
  { keys: ['?'], label: 'Mở bảng phím tắt này' },
  { keys: ['Esc'], label: 'Đóng hộp thoại đang mở' },
];

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useDialogA11y(panelRef, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[3px]"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[460px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] px-5 py-4">
              <div>
                <h2
                  id="shortcuts-title"
                  className="font-serif text-lg font-semibold text-[var(--text-primary)]"
                >
                  Phím tắt
                </h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Điều khiển tủ sách mà không cần rời bàn phím.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                data-autofocus
                aria-label="Đóng bảng phím tắt"
                className="icon-btn h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <ul className="divide-y divide-[var(--border-hairline)] px-5">
              {SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.label}
                  className="flex items-center justify-between gap-4 py-2.5"
                >
                  <span className="text-[13px] text-[var(--text-secondary)]">
                    {shortcut.label}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd key={key} className="kbd h-[22px] min-w-[22px]">
                        {key === '⌘' ? <Command className="h-3 w-3" /> : key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>

            <p className="border-t border-[var(--border-hairline)] px-5 py-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
              Trên thiết bị cảm ứng, vuốt ngang trong bài viết để chuyển bài. Trên macOS dùng ⌘,
              trên Windows/Linux dùng Ctrl.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
