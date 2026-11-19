const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement
  );
}

export interface DialogA11yParams {
  active: boolean;
  onClose: () => void;
}

/**
 * Svelte action for dialogs: locks body scroll, traps Tab, closes on Escape and
 * restores focus to the trigger when the dialog goes inactive or unmounts.
 *
 * Usage: <div use:dialogA11y={{ active: isOpen, onClose: close }}>...</div>
 */
export function dialogA11y(node: HTMLElement, params: DialogA11yParams) {
  let active = params.active;
  let onClose = params.onClose;
  let previouslyFocused: HTMLElement | null = null;
  let previousOverflow = '';
  let previousPadding = '';
  let focusTimer: number | undefined;

  function setup() {
    previouslyFocused = document.activeElement as HTMLElement | null;
    previousOverflow = document.body.style.overflow;
    previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    focusTimer = window.setTimeout(() => {
      const preferred = node.querySelector<HTMLElement>('[data-autofocus]');
      const target = preferred ?? getFocusable(node)[0];
      target?.focus({ preventScroll: true });
    }, 30);

    document.addEventListener('keydown', handleKeyDown, true);
  }

  function teardown() {
    if (!active) return;
    if (focusTimer !== undefined) window.clearTimeout(focusTimer);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPadding;
    previouslyFocused?.focus?.({ preventScroll: true });
    active = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const items = getFocusable(node);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!current || current === first || !node.contains(current)) {
        event.preventDefault();
        last.focus();
      }
    } else if (current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (params.active) setup();

  return {
    update(next: DialogA11yParams) {
      onClose = next.onClose;
      if (next.active === active) return;
      if (next.active) {
        active = true;
        setup();
      } else {
        teardown();
      }
    },
    destroy() {
      teardown();
    },
  };
}
