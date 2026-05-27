import { apiRequest, apiUpload } from "./api";
import type { LessonMaterial } from "./lessons";

export type MissingChildItem = {
  id: string;
  display_name: string;
  birth_year: number | null;
  parent_name: string;
  parent_email: string;
  joined_at: string;
};

export type TeacherAssignmentListItem = {
  assignment_id: string;
  assignment_type: string;
  title: string;
  instructions: string | null;
  worksheet_file_url: string | null;
  answer_template_url: string | null;
  max_score: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  due_at: string | null;
  class_id: string;
  class_name: string;
  lesson_id: string;
  lesson_title: string;
  material_count: number;
  assigned_child_count: number;
  submitted_child_count: number;
  missing_child_count: number;
  correct_count: number;
  incorrect_count: number;
  speech_failed_count: number;
  ungraded_submission_count: number;
  graded_submission_count: number;
  average_score: number | null;
  completion_rate: number;
  average_confidence: number | null;
  created_at: string;
};

export type AssignmentSubmissionPreview = {
  id: string;
  child_name: string;
  submitted_at: string | null;
  grading_status: string;
  score: number | null;
  max_score: number | null;
  answer_file_url: string | null;
};

export type TeacherAssignmentDetail = TeacherAssignmentListItem & {
  materials: LessonMaterial[];
  missing_children: MissingChildItem[];
  recent_submissions: AssignmentSubmissionPreview[];
};

export type TeacherAssignmentUpdatePayload = {
  title?: string;
  instructions?: string;
  worksheet_file_url?: string | null;
  answer_template_url?: string | null;
  max_score?: number;
  due_at?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
};

export type CreateTeacherAssignmentPayload = {
  class_id: string;
  lesson_id: string;
  title: string;
  instructions?: string;
  assignment_type?: string;
  max_score?: number;
  due_at?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
};

export function listTeacherAssignments(
  token: string,
  params: { status?: string; class_id?: string } = {},
): Promise<TeacherAssignmentListItem[]> {
  const search = new URLSearchParams();
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.class_id && params.class_id !== "ALL") search.set("class_id", params.class_id);
  const query = search.toString();
  return apiRequest<TeacherAssignmentListItem[]>(`/teacher/assignments${query ? `?${query}` : ""}`, { token });
}

export function getTeacherAssignmentDetail(token: string, assignmentId: string): Promise<TeacherAssignmentDetail> {
  return apiRequest<TeacherAssignmentDetail>(`/teacher/assignments/${assignmentId}`, { token });
}

export function updateTeacherAssignment(
  token: string,
  assignmentId: string,
  payload: TeacherAssignmentUpdatePayload,
): Promise<TeacherAssignmentDetail> {
  return apiRequest<TeacherAssignmentDetail>(`/teacher/assignments/${assignmentId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function createTeacherAssignment(token: string, payload: CreateTeacherAssignmentPayload): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/assignments", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function uploadAssignmentWorksheet(token: string, assignmentId: string, file: File): Promise<TeacherAssignmentDetail> {
  const formData = new FormData();
  formData.set("file", file);
  return apiUpload<TeacherAssignmentDetail>(`/teacher/assignments/${assignmentId}/worksheet`, formData, token);
}

export function uploadAssignmentAnswerTemplate(token: string, assignmentId: string, file: File): Promise<TeacherAssignmentDetail> {
  const formData = new FormData();
  formData.set("file", file);
  return apiUpload<TeacherAssignmentDetail>(`/teacher/assignments/${assignmentId}/answer-template`, formData, token);
}
