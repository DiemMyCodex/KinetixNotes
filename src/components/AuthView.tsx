import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { formatSupabaseAuthError } from '../services/supabaseHelpers';

interface AuthViewProps {
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onBackToReader: () => void;
  onAuthSuccess: () => void;
}

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

const PERKS = [
  { Icon: Cloud, text: 'Đồng bộ tiến độ đã thuộc trên mọi thiết bị.' },
  { Icon: ShieldCheck, text: 'Dữ liệu cá nhân được bảo vệ bằng Row-Level Security.' },
  { Icon: Check, text: 'Giữ nguyên trải nghiệm đọc khi mất kết nối.' },
];

export function AuthView({
  mode,
  onSwitchMode,
  onBackToReader,
  onAuthSuccess,
}: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <main
      id="main"
      className="mx-auto flex w-full max-w-[var(--shell-max)] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={onBackToReader}
        className="group inline-flex min-h-[38px] w-fit items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
      >
        <ArrowLeft
          className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        <span>Quay lại tủ sách</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE_OUT_EXPO }}
        className="mx-auto my-auto w-full max-w-[880px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-raised)] lg:grid lg:grid-cols-[1.02fr_1fr]"
      >
        <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-[#101114] p-9 text-[#f6f5f0] lg:flex">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#1f47d6]/35 blur-3xl"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#7c3aed]/25 blur-3xl"
          />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f6f5f0] font-serif text-base font-semibold leading-none text-[#101114]"
              >
                K
              </span>
              <span className="font-serif text-lg font-semibold tracking-tight">
                KinetixNotes
              </span>
            </div>

            <p className="mt-10 font-serif text-[27px] font-medium leading-[1.25] tracking-[-0.01em] text-white/95">
              Đọc ít hơn.
              <br />
              Nhớ lâu hơn.
            </p>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-white/55">
              Tủ sách vi mô cho bốn lĩnh vực trọng tâm, kèm ôn tập chủ động để kiến thức thực sự
              nằm lại.
            </p>
          </div>

          <ul className="relative space-y-3">
            {PERKS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/65">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-white/85">
                  <Icon className="h-3 w-3" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-8">
          <div
            role="tablist"
            aria-label="Chế độ tài khoản"
            className="mb-6 grid grid-cols-2 gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-1"
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
                  className={`relative min-h-[36px] rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
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
                      className="absolute inset-0 rounded bg-[var(--bg-card)] shadow-[inset_0_0_0_1px_var(--border-hairline)]"
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
              <h1 className="font-serif text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
                {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
              </h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {isRegister
                  ? 'Lưu và đồng bộ tiến độ đã thuộc trên mọi thiết bị.'
                  : 'Tiếp tục với tiến độ ghi nhớ của bạn.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {!isSupabaseConfigured && (
            <div
              role="status"
              className="mt-5 flex items-start gap-2 rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--text-secondary)]"
            >
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
              <span>
                Chưa cấu hình Supabase (<code className="font-mono text-[10.5px]">VITE_SUPABASE_URL</code>,{' '}
                <code className="font-mono text-[10.5px]">VITE_SUPABASE_ANON_KEY</code>). Đăng nhập
                sẽ không hoạt động cho tới khi thêm biến môi trường.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ban@example.com"
                className="field min-h-[42px]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="field min-h-[42px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
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
                      className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
                    >
                      Xác nhận mật khẩu
                    </label>
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="field min-h-[42px]"
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
                  className="flex items-start gap-2 rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--danger)]"
                >
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
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
                  className="flex items-start gap-2 rounded-md border border-[var(--mastered)]/35 bg-[var(--mastered-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--mastered)]"
                >
                  <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary mt-1 min-h-[44px] w-full text-[13px]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>
                {isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
              </span>
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
            Khách vẫn đọc và lưu tiến độ cục bộ mà không cần tài khoản.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
