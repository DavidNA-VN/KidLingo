import { apiRequest } from "./api";

export type TeacherSubmissionListItem = {
  id: string;
  submission_type: string;
  child_id: string;
  child_name: string;
  parent_name: string;
  parent_email: string;
  class_id: string;
  class_name: string;
  assignment_id: string;
  assignment_title: string;
  lesson_title: string;
  answer_file_url: string | null;
  target_class: string | null;
  predicted_class: string | null;
  confidence: number | null;
  is_correct: boolean;
  speech_passed: boolean;
  speech_transcript: string | null;
  stars_earned: number;
  coins_earned: number;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  score: number | null;
  max_score: number | null;
  grading_status: string;
  returned_at: string | null;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  review_reason: string | null;
};

export type TeacherSubmissionDetail = TeacherSubmissionListItem & {
  top_predictions: { class_key?: string; confidence?: number; [key: string]: unknown }[] | null;
  canvas_image_url: string | null;
  lesson_materials: string[];
};

export type SubmissionFilters = {
  class_id?: string;
  assignment_id?: string;
  child_id?: string;
  grading_status?: string;
  score_min?: string;
  score_max?: string;
  late?: string;
  is_correct?: string;
  speech_passed?: string;
  reviewed?: string;
  confidence_max?: string;
};

export function listTeacherSubmissions(
  token: string,
  filters: SubmissionFilters = {},
): Promise<TeacherSubmissionListItem[]> {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "ALL") search.set(key, value);
  });
  const query = search.toString();
  return apiRequest<TeacherSubmissionListItem[]>(`/teacher/submissions${query ? `?${query}` : ""}`, { token });
}

export function getTeacherSubmissionDetail(token: string, submissionId: string): Promise<TeacherSubmissionDetail> {
  return apiRequest<TeacherSubmissionDetail>(`/teacher/submissions/${submissionId}`, { token });
}

export function updateTeacherSubmissionReview(
  token: string,
  submissionId: string,
  payload: { teacher_feedback?: string | null; reviewed: boolean; score?: number | null; max_score?: number | null; grading_status?: string | null },
): Promise<TeacherSubmissionDetail> {
  return apiRequest<TeacherSubmissionDetail>(`/teacher/submissions/${submissionId}/review`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}
