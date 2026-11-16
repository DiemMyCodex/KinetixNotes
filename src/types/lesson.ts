export type Category = 'Máy tính' | 'Trí tuệ AI' | 'Tâm lý & Sống' | 'Kinh tế';

export type CategoryFilter = 'Tất cả' | Category;

export type MasteryFilter = 'all' | 'unmastered' | 'mastered';

export type ThemeMode = 'light' | 'dark';

export type AuthRoute = 'reader' | 'login' | 'register';

export interface Lesson {
  id: number;
  category: Category;
  title: string;
  summary: string;
  points: string[];
  quiz: string;
  answer: string;
  createdAt: string;
  user_id?: string | null;
}

export interface NewLessonInput {
  category: Category;
  title: string;
  summary: string;
  points: string[];
  quiz: string;
  answer: string;
}
