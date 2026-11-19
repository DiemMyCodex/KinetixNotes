<script lang="ts">
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
  } from '@lucide/svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { isSupabaseConfigured, supabase } from '../lib/supabase';
  import { formatSupabaseAuthError } from '../services/supabaseHelpers';

  interface Props {
    mode: 'login' | 'register';
    onSwitchMode: (mode: 'login' | 'register') => void;
    onBackToReader: () => void;
    onAuthSuccess: () => void;
  }

  let { mode, onSwitchMode, onBackToReader, onAuthSuccess }: Props = $props();

  const PERKS = [
    { Icon: Cloud, text: 'Đồng bộ tiến độ đã thuộc trên mọi thiết bị.' },
    { Icon: ShieldCheck, text: 'Dữ liệu cá nhân được bảo vệ bằng Row-Level Security.' },
    { Icon: Check, text: 'Giữ nguyên trải nghiệm đọc khi mất kết nối.' },
  ];

  const TABS = [
    { id: 'login', label: 'Đăng nhập' },
    { id: 'register', label: 'Đăng ký' },
  ] as const;

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let showPassword = $state(false);
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);
  let mounted = $state(false);

  const isRegister = $derived(mode === 'register');

  // Suppress the header intro on first paint so only mode switches animate.
  $effect(() => {
    mounted = true;
  });

  function handleModeChange(nextMode: 'login' | 'register') {
    errorMessage = null;
    successMessage = null;
    onSwitchMode(nextMode);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = null;
    successMessage = null;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errorMessage = 'Vui lòng nhập địa chỉ email hợp lệ.';
      return;
    }

    if (password.length < 6) {
      errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự.';
      return;
    }

    if (isRegister && password !== confirmPassword) {
      errorMessage = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    isSubmitting = true;
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (error) {
          errorMessage = formatSupabaseAuthError(error.message);
          return;
        }

        if (data.session) {
          onAuthSuccess();
          return;
        }

        successMessage =
          'Đăng ký thành công. Vui lòng kiểm tra hộp thư email để xác nhận tài khoản trước khi đăng nhập.';
        password = '';
        confirmPassword = '';
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          errorMessage = formatSupabaseAuthError(error.message);
          return;
        }

        onAuthSuccess();
      }
    } catch (err) {
      errorMessage = formatSupabaseAuthError(
        err instanceof Error ? err.message : 'Lỗi kết nối máy chủ.'
      );
    } finally {
      isSubmitting = false;
    }
  }
</script>

<main
  id="main"
  class="mx-auto flex w-full max-w-[var(--shell-max)] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10"
>
  <button
    type="button"
    onclick={onBackToReader}
    class="group inline-flex min-h-[38px] w-fit items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
  >
    <ArrowLeft
      class="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
      aria-hidden="true"
    />
    <span>Quay lại tủ sách</span>
  </button>

  <div
    in:fly={{ y: 12, duration: 260, easing: cubicOut }}
    class="mx-auto my-auto w-full max-w-[880px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-[var(--shadow-raised)] lg:grid lg:grid-cols-[1.02fr_1fr]"
  >
    <aside
      class="relative hidden flex-col justify-between gap-8 overflow-hidden bg-[#101114] p-9 text-[#f6f5f0] lg:flex"
    >
      <span
        aria-hidden="true"
        class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#1f47d6]/35 blur-3xl"></span>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-[#7c3aed]/25 blur-3xl"></span>

      <div class="relative">
        <div class="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            class="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f6f5f0] font-serif text-base font-semibold leading-none text-[#101114]"
          >
            K
          </span>
          <span class="font-serif text-lg font-semibold tracking-tight">KinetixNotes</span>
        </div>

        <p
          class="mt-10 font-serif text-[27px] font-medium leading-[1.25] tracking-[-0.01em] text-white/95"
        >
          Đọc ít hơn.
          <br />
          Nhớ lâu hơn.
        </p>
        <p class="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-white/55">
          Tủ sách vi mô cho bốn lĩnh vực trọng tâm, kèm ôn tập chủ động để kiến thức thực sự nằm
          lại.
        </p>
      </div>

      <ul class="relative space-y-3">
        {#each PERKS as perk (perk.text)}
          {@const Icon = perk.Icon}
          <li class="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/65">
            <span
              class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-white/85"
            >
              <Icon class="h-3 w-3" aria-hidden="true" />
            </span>
            {perk.text}
          </li>
        {/each}
      </ul>
    </aside>

    <div class="p-6 sm:p-8">
      <div
        role="tablist"
        aria-label="Chế độ tài khoản"
        class="mb-6 grid grid-cols-2 gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-1"
      >
        {#each TABS as tab (tab.id)}
          {@const active = mode === tab.id}
          <button
            role="tab"
            type="button"
            aria-selected={active}
            onclick={() => handleModeChange(tab.id)}
            class={`relative min-h-[36px] rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              active
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {#if active}
              <span
                transition:fade={{ duration: 120 }}
                aria-hidden="true"
                class="absolute inset-0 rounded bg-[var(--bg-card)] shadow-[inset_0_0_0_1px_var(--border-hairline)]"></span>
            {/if}
            <span class="relative z-10">{tab.label}</span>
          </button>
        {/each}
      </div>

      {#key mode}
        <div
          in:fly={mounted
            ? { y: 6, duration: 180, easing: cubicOut }
            : { duration: 0 }}
          out:fly={{ y: -6, duration: 180, easing: cubicOut }}
        >
          <h1
            class="font-serif text-[26px] font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
          </h1>
          <p class="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {isRegister
              ? 'Lưu và đồng bộ tiến độ đã thuộc trên mọi thiết bị.'
              : 'Tiếp tục với tiến độ ghi nhớ của bạn.'}
          </p>
        </div>
      {/key}

      {#if !isSupabaseConfigured}
        <div
          role="status"
          class="mt-5 flex items-start gap-2 rounded-md border border-[var(--warning)]/35 bg-[var(--warning)]/10 px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--text-secondary)]"
        >
          <AlertCircle
            class="mt-px h-3.5 w-3.5 shrink-0 text-[var(--warning)]"
            aria-hidden="true"
          />
          <span>
            Chưa cấu hình Supabase (<code class="font-mono text-[10.5px]">VITE_SUPABASE_URL</code>,{' '}
            <code class="font-mono text-[10.5px]">VITE_SUPABASE_ANON_KEY</code>). Đăng nhập sẽ không
            hoạt động cho tới khi thêm biến môi trường.
          </span>
        </div>
      {/if}

      <form onsubmit={handleSubmit} novalidate class="mt-5 space-y-4">
        <div>
          <label
            for="auth-email"
            class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            placeholder="ban@example.com"
            class="field min-h-[42px]"
          />
        </div>

        <div>
          <label
            for="auth-password"
            class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
          >
            Mật khẩu
          </label>
          <div class="relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autocomplete={isRegister ? 'new-password' : 'current-password'}
              required
              minlength={6}
              bind:value={password}
              placeholder="Tối thiểu 6 ký tự"
              class="field min-h-[42px] pr-10"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              {#if showPassword}
                <EyeOff class="h-4 w-4" aria-hidden="true" />
              {:else}
                <Eye class="h-4 w-4" aria-hidden="true" />
              {/if}
            </button>
          </div>
        </div>

        {#if isRegister}
          <div transition:slide={{ duration: 220, easing: cubicOut }} class="overflow-hidden">
            <div transition:fade={{ duration: 220 }} class="pt-0.5">
              <label
                for="auth-confirm-password"
                class="mb-1.5 block text-[11.5px] font-semibold text-[var(--text-secondary)]"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="auth-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autocomplete="new-password"
                required
                minlength={6}
                bind:value={confirmPassword}
                placeholder="Nhập lại mật khẩu"
                class="field min-h-[42px]"
              />
            </div>
          </div>
        {/if}

        {#if errorMessage}
          <div
            transition:fly={{ y: -4, duration: 160, easing: cubicOut }}
            role="alert"
            class="flex items-start gap-2 rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--danger)]"
          >
            <AlertCircle class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        {#if successMessage}
          <div
            transition:fly={{ y: -4, duration: 160, easing: cubicOut }}
            role="status"
            class="flex items-start gap-2 rounded-md border border-[var(--mastered)]/35 bg-[var(--mastered-soft)] px-3 py-2.5 text-[11.5px] leading-relaxed text-[var(--mastered)]"
          >
            <CheckCircle2 class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        {/if}

        <button
          type="submit"
          disabled={isSubmitting}
          class="btn btn-primary mt-1 min-h-[44px] w-full text-[13px]"
        >
          {#if isSubmitting}
            <Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
          {/if}
          <span>
            {isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
          </span>
        </button>
      </form>

      <p class="mt-4 text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
        Khách vẫn đọc và lưu tiến độ cục bộ mà không cần tài khoản.
      </p>
    </div>
  </div>
</main>
