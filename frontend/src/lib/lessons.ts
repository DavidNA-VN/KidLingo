import { apiRequest, apiUpload } from "./api";

export type VocabularyItem = {
  class_key: string;
  english: string;
  vi: string;
  phonetic?: string | null;
};

export type LessonMaterial = {
  id: string;
  lesson_id: string;
  type: "PDF" | "YOUTUBE_VIDEO" | "SPEAKING_PROMPT" | "DOODLE_VOCAB" | "NOTE";
  title: string;
  description: string | null;
  file_url: string | null;
  external_url: string | null;
  youtube_video_id: string | null;
  vocabulary_items: VocabularyItem[] | null;
  sort_order: number;
  created_at: string;
};

export type LessonSummary = {
  id: string;
  class_id: string | null;
  title: string;
  description: string | null;
  material_count: number;
  assignment_count: number;
  created_at: string;
};

export type LessonDetail = LessonSummary & {
  materials: LessonMaterial[];
};

export type AssignmentSummary = {
  id: string;
  class_id: string;
  lesson_id: string;
  assignment_type: string;
  title: string;
  instructions: string | null;
  worksheet_file_url: string | null;
  answer_template_url: string | null;
  max_score: number;
  due_at: string | null;
  status: "PUBLISHED" | "CLOSED";
  class_name: string;
  lesson_title: string;
  material_count: number;
  submission_count: number;
  created_at: string;
};

export function listLessons(token: string, classId?: string | null): Promise<LessonSummary[]> {
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : "";
  return apiRequest<LessonSummary[]>(`/lessons${query}`, { token });
}

export function updateMaterial(
  token: string,
  lessonId: string,
  materialId: string,
  payload: { title?: string; description?: string; sort_order?: number },
): Promise<LessonMaterial> {
  return apiRequest<LessonMaterial>(`/lessons/${lessonId}/materials/${materialId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteMaterial(token: string, lessonId: string, materialId: string): Promise<void> {
  return apiRequest<void>(`/lessons/${lessonId}/materials/${materialId}`, {
    method: "DELETE",
    token,
  });
}

export function createLesson(
  token: string,
  payload: { class_id: string; title: string; description?: string },
): Promise<LessonSummary> {
  return apiRequest<LessonSummary>("/lessons", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getLesson(token: string, lessonId: string): Promise<LessonDetail> {
  return apiRequest<LessonDetail>(`/lessons/${lessonId}`, { token });
}

export function addYoutubeMaterial(
  token: string,
  lessonId: string,
  payload: { title: string; external_url: string; description?: string; sort_order?: number },
): Promise<LessonMaterial> {
  return apiRequest<LessonMaterial>(`/lessons/${lessonId}/materials/youtube`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function addDoodleMaterial(
  token: string,
  lessonId: string,
  payload: { title: string; vocabulary_items: VocabularyItem[]; description?: string; sort_order?: number },
): Promise<LessonMaterial> {
  return apiRequest<LessonMaterial>(`/lessons/${lessonId}/materials/doodle-vocab`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function uploadPdfMaterial(
  token: string,
  lessonId: string,
  payload: { title: string; description?: string; sort_order?: number; file: File },
): Promise<LessonMaterial> {
  const formData = new FormData();
  formData.set("title", payload.title);
  formData.set("description", payload.description ?? "");
  formData.set("sort_order", String(payload.sort_order ?? 0));
  formData.set("file", payload.file);
  return apiUpload<LessonMaterial>(`/lessons/${lessonId}/materials/pdf`, formData, token);
}

export function createAssignment(
  token: string,
  payload: {
    class_id: string;
    lesson_id: string;
    title: string;
    instructions?: string;
    assignment_type?: string;
    worksheet_file_url?: string | null;
    answer_template_url?: string | null;
    max_score?: number;
    status: string;
    due_at?: string | null;
  },
): Promise<AssignmentSummary> {
  return apiRequest<AssignmentSummary>("/assignments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
