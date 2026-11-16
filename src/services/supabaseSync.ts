import { supabase } from '../lib/supabase';
import type { Lesson, NewLessonInput } from '../types/lesson';
import {
  mergeCatalogLessons,
  normalizeRemoteLesson,
  type RemoteLessonRow,
} from './supabaseHelpers';

export interface FetchLessonsResult {
  lessons: Lesson[];
  fromSupabase: boolean;
  missingTable: boolean;
}

export async function fetchLessonsFromSupabase(
  defaultLessons: readonly Lesson[]
): Promise<FetchLessonsResult> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache');
      return {
        lessons: [...defaultLessons],
        fromSupabase: false,
        missingTable: Boolean(isMissing),
      };
    }

    if (!data || data.length === 0) {
      return {
        lessons: [...defaultLessons],
        fromSupabase: true,
        missingTable: false,
      };
    }

    const normalized = (data as RemoteLessonRow[])
      .map(normalizeRemoteLesson)
      .filter((item): item is Lesson => item !== null);

    return {
      lessons: mergeCatalogLessons(defaultLessons, normalized),
      fromSupabase: true,
      missingTable: false,
    };
  } catch {
    return {
      lessons: [...defaultLessons],
      fromSupabase: false,
      missingTable: false,
    };
  }
}

export async function createLessonInSupabase(
  input: NewLessonInput,
  userId: string
): Promise<{ lesson: Lesson | null; error: string | null }> {
  try {
    const payload = {
      user_id: userId,
      category: input.category,
      title: input.title.trim(),
      summary: input.summary.trim(),
      points: input.points,
      quiz: input.quiz.trim(),
      answer: input.answer.trim(),
    };

    const { data, error } = await supabase
      .from('lessons')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          lesson: null,
          error:
            'Bảng "lessons" chưa được tạo trên Supabase. Hãy chạy file supabase/schema.sql trong SQL Editor.',
        };
      }
      if (error.code === '42501' || error.message?.toLowerCase().includes('row-level security')) {
        return {
          lesson: null,
          error: 'Tài khoản này không có quyền thêm bài học mới.',
        };
      }
      return {
        lesson: null,
        error: error.message || 'Không thể lưu bài học lên Supabase.',
      };
    }

    const normalized = normalizeRemoteLesson(data as RemoteLessonRow);
    if (!normalized) {
      return {
        lesson: null,
        error: 'Dữ liệu trả về từ Supabase không hợp lệ.',
      };
    }

    return { lesson: normalized, error: null };
  } catch (err) {
    return {
      lesson: null,
      error: err instanceof Error ? err.message : 'Lỗi kết nối tới Supabase.',
    };
  }
}

export async function fetchUserProgressFromSupabase(
  userId: string
): Promise<{ masteredIds: Set<number>; missingTable: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('lesson_id')
      .eq('user_id', userId);

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache');
      return {
        masteredIds: new Set(),
        missingTable: Boolean(isMissing),
        error: isMissing ? null : error.message,
      };
    }

    const ids = new Set<number>();
    for (const row of data ?? []) {
      const numericId = Number((row as { lesson_id?: unknown }).lesson_id);
      if (Number.isFinite(numericId) && numericId > 0) {
        ids.add(numericId);
      }
    }

    return { masteredIds: ids, missingTable: false, error: null };
  } catch (err) {
    return {
      masteredIds: new Set(),
      missingTable: false,
      error: err instanceof Error ? err.message : 'Không tải được tiến độ.',
    };
  }
}

export async function syncLessonProgressInSupabase(
  userId: string,
  lessonId: number,
  isMastered: boolean
): Promise<{ error: string | null }> {
  try {
    if (isMastered) {
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: userId, lesson_id: lessonId },
          { onConflict: 'user_id,lesson_id' }
        );

      if (error) {
        if (error.code === 'PGRST205') {
          return {
            error:
              'Bảng "user_progress" chưa được tạo trên Supabase. Tiến độ tạm lưu cục bộ.',
          };
        }
        return { error: error.message || 'Không thể lưu tiến độ lên Supabase.' };
      }
      return { error: null };
    }

    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);

    if (error) {
      if (error.code === 'PGRST205') {
        return {
          error:
            'Bảng "user_progress" chưa được tạo trên Supabase. Tiến độ tạm lưu cục bộ.',
        };
      }
      return { error: error.message || 'Không thể xóa tiến độ trên Supabase.' };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Lỗi kết nối khi đồng bộ tiến độ.',
    };
  }
}
