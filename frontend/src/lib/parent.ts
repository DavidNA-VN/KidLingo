import { apiRequest, apiUpload } from "./api";

export type ParentChild = {
  id: string;
  display_name: string;
  birth_year: number | null;
  avatar_url: string | null;
  status: "ACTIVE" | "ARCHIVED";
  total_stars: number;
  total_coins: number;
  class_count: number;
  published_assignment_count: number;
  created_at: string;
};

export type ParentClass = {
  class_id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  teacher_name: string;
  membership_status: string;
  joined_at: string;
  published_assignment_count: number;
};

export type ParentAssignment = {
  assignment_id: string;
  title: string;
  instructions: string | null;
  status: string;
  due_at: string | null;
  class_id: string;
  class_name: string;
  teacher_name: string;
  lesson_id: string;
  lesson_title: string;
  lesson_description: string | null;
  material_count: number;
  assignment_type: string;
  worksheet_file_url: string | null;
  answer_template_url: string | null;
  max_score: number;
  submitted: boolean;
  latest_submission_at: string | null;
  latest_is_correct: boolean | null;
  latest_confidence: number | null;
  latest_score: number | null;
  latest_max_score: number | null;
  latest_grading_status: string | null;
  latest_feedback: string | null;
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
  vocabulary_items: Array<{ class_key: string; english: string; vi: string; phonetic: string | null }> | null;
  sort_order: number;
  created_at: string;
};

export type ParentAssignmentDetail = ParentAssignment & {
  materials: LessonMaterial[];
};

export type ParentSubmissionHistoryItem = {
  id: string;
  submission_type: string;
  assignment_id: string;
  assignment_title: string;
  class_name: string;
  lesson_title: string;
  answer_file_url: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  score: number | null;
  max_score: number | null;
  grading_status: string | null;
  returned_at: string | null;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type JoinClassResponse = {
  class_id: string;
  child_id: string;
  class_name: string;
  class_code: string | null;
  membership_status: string;
  joined_at: string;
  already_joined: boolean;
};

export function listParentChildren(token: string): Promise<ParentChild[]> {
  return apiRequest<ParentChild[]>("/parent/children", { token });
}

export function createParentChild(
  token: string,
  payload: { display_name: string; birth_year?: number | null; avatar_url?: string | null },
): Promise<ParentChild> {
  return apiRequest<ParentChild>("/parent/children", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateParentChild(
  token: string,
  childId: string,
  payload: { display_name?: string; birth_year?: number | null; avatar_url?: string | null; status?: "ACTIVE" | "ARCHIVED" },
): Promise<ParentChild> {
  return apiRequest<ParentChild>(`/parent/children/${childId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function joinClassByCode(token: string, childId: string, classCode: string): Promise<JoinClassResponse> {
  return apiRequest<JoinClassResponse>(`/parent/children/${childId}/join-class`, {
    method: "POST",
    token,
    body: JSON.stringify({ class_code: classCode }),
  });
}

export function listChildClasses(token: string, childId: string): Promise<ParentClass[]> {
  return apiRequest<ParentClass[]>(`/parent/children/${childId}/classes`, { token });
}

export function listChildAssignments(token: string, childId: string): Promise<ParentAssignment[]> {
  return apiRequest<ParentAssignment[]>(`/parent/children/${childId}/assignments`, { token });
}

export function getChildAssignmentDetail(
  token: string,
  childId: string,
  assignmentId: string,
): Promise<ParentAssignmentDetail> {
  return apiRequest<ParentAssignmentDetail>(`/parent/children/${childId}/assignments/${assignmentId}`, { token });
}

export function uploadAssignmentSubmissionFile(
  token: string,
  childId: string,
  assignmentId: string,
  file: File,
): Promise<ParentSubmissionHistoryItem> {
  const formData = new FormData();
  formData.set("file", file);
  return apiUpload<ParentSubmissionHistoryItem>(
    `/parent/children/${childId}/assignments/${assignmentId}/submission-file`,
    formData,
    token,
  );
}
