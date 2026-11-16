import { ArrowLeft, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { formatSupabaseAuthError } from '../services/supabaseHelpers';

interface AuthViewProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onBackToReader: () => void;
  onAuthSuccess: () => void;
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export function AuthView({
  mode,
  onSwitchMode,
  onBackToReader,
  onAuthSuccess,
}: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const handleModeChange = (nextMode: 'login' | 'register') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    onSwitchMode(nextMode);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMessage(formatSupabaseAuthError(error.message));
          return;
        }

        if (data.session) {
          onAuthSuccess();
          return;
        }

        setSuccessMessage(
          'Đăng ký thành công. Vui lòng kiểm tra hộp thư email để xác nhận tài khoản trước khi đăng nhập.'
        );
        setPassword('');
        setConfirmPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          setErrorMessage(formatSupabaseAuthError(error.message));
          return;
        }

        onAuthSuccess();
      }
    } catch (err) {
      setErrorMessage(
        formatSupabaseAuthError(
          err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1380px] flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
        className="w-full max-w-[440px]"
      >
        <div className="mb-5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onBackToReader}
            className="group inline-flex min-h-[38px] items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            <span>Quay lại tủ sách</span>
          </motion.button>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {/* Segmented Tab Switcher */}
          <div
            role="tablist"
            aria-label="Chế độ tài khoản"
            className="mb-7 grid grid-cols-2 gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-1"
          >
            {(
              [
                { id: 'login', label: 'Đăng nhập' },
                { id: 'register', label: 'Đăng ký' },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => handleModeChange(tab.id)}
                  className={`relative min-h-[38px] rounded px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    active
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="authTabPill"
                      transition={{ type: 'spring', stiffness: 440, damping: 36 }}
                      aria-hidden="true"
                      className="absolute inset-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-card)]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
            >
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-[var(--text-primary)] [text-wrap:balance]">
                {isRegister ? 'Tạo tài khoản KinetixNotes' : 'Đăng nhập KinetixNotes'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {isRegister
                  ? 'Lưu và đồng bộ tiến độ đã thuộc trên mọi thiết bị.'
                  : 'Đồng bộ tiến độ ghi nhớ cá nhân từ Supabase.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                className="w-full min-h-[42px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Mật khẩu
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full min-h-[42px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.div
                  key="confirm-password-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                  className="overflow-hidden"
                >
                  <div className="pt-0.5">
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                    >
                      Xác nhận mật khẩu
                    </label>
                    <input
                      id="auth-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full min-h-[42px] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  role="alert"
                  className="rounded-md border border-red-500/35 bg-red-500/8 px-3.5 py-2.5 text-xs leading-relaxed text-red-700 dark:text-red-300"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  role="status"
                  className="rounded-md border border-[var(--mastered)]/40 bg-[var(--mastered-soft)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--mastered)]"
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.985 }}
              disabled={isSubmitting}
              className="mt-2 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <span>
                {isSubmitting
                  ? 'Đang xử lý...'
                  : isRegister
                    ? 'Tạo tài khoản'
                    : 'Đăng nhập'}
              </span>
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
