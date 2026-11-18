import type { AuthRoute } from '../types/lesson';

export interface ParsedRoute {
  authRoute: AuthRoute;
  lessonId: number | null;
}

const LESSON_PATH = /^\/(?:bai|bài|lesson)\/(\d+)\/?$/i;

export function parseRoute(pathname: string): ParsedRoute {
  const path = (pathname || '/').toLowerCase();

  if (path === '/login' || path === '/login/') {
    return { authRoute: 'login', lessonId: null };
  }
  if (path === '/register' || path === '/register/') {
    return { authRoute: 'register', lessonId: null };
  }

  const match = pathname.match(LESSON_PATH);
  if (match) {
    const id = Number(match[1]);
    return {
      authRoute: 'reader',
      lessonId: Number.isFinite(id) ? id : null,
    };
  }

  return { authRoute: 'reader', lessonId: null };
}

export function lessonPath(id: number): string {
  return `/bai/${id}`;
}

export function lessonUrl(id: number): string {
  if (typeof window === 'undefined') return lessonPath(id);
  return `${window.location.origin}${lessonPath(id)}`;
}
