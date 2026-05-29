import { apiRequest } from "./api";

export type TeacherClassSummary = {
  id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  active_child_count: number;
  archived_child_count: number;
  assignment_count: number;
  submission_count: number;
  created_at: string;
};

export type ParentSummary = {
  id: string;
  full_name: string;
  email: string;
};

export type RosterChild = {
  id: string;
  display_name: string;
  birth_year: number | null;
  nickname: string | null;
  status: string;
  membership_status: string;
  total_stars: number;
  total_coins: number;
  joined_at: string;
  parent: ParentSummary;
};

export type AssignmentMini = {
  id: string;
  title: string;
  status: string;
  lesson_title: string;
  max_score: number;
  due_at: string | null;
  submission_count: number;
};

export type RecentSubmissionSummary = {
  id: string;
  child_id: string;
  child_name: string;
  child_nickname: string | null;
  child_birth_year: number | null;
  assignment_id: string;
  assignment_title: string;
  target_class: string | null;
  predicted_class: string;
  is_correct: boolean;
  confidence: number;
  stars_earned: number;
  coins_earned: number;
  created_at: string;
};

export type TeacherClassDetail = {
  id: string;
  name: string;
  description: string | null;
  class_code: string | null;
  active_child_count: number;
  archived_child_count: number;
  assignment_count: number;
  submission_count: number;
  roster: RosterChild[];
  assignments: AssignmentMini[];
  recent_submissions: RecentSubmissionSummary[];
};

export type ChildSearchResult = {
  id: string;
  display_name: string;
  birth_year: number | null;
  nickname: string | null;
  status: string;
  total_stars: number;
  total_coins: number;
  parent: ParentSummary;
};

export type TeacherStudentProfile = {
  id: string;
  display_name: string;
  nickname: string | null;
  birth_year: number | null;
  age: number | null;
  avatar_url: string | null;
  profile_note: string | null;
  status: string;
  parent: ParentSummary;
  class_id: string;
  class_name: string;
  membership_status: string;
  joined_at: string;
  total_stars: number;
  total_coins: number;
  assignment_count: number;
  submission_count: number;
  latest_submissions: Array<{
    id: string;
    submission_type: string;
    assignment_id: string;
    assignment_title: string;
    score: number | null;
    max_score: number | null;
    grading_status: string;
    submitted_at: string | null;
    created_at: string;
  }>;
};

export function listTeacherClasses(token: string): Promise<TeacherClassSummary[]> {
  return apiRequest<TeacherClassSummary[]>("/teacher/classes", { token });
}

export function createTeacherClass(
  token: string,
  payload: { name: string; description?: string },
): Promise<TeacherClassSummary> {
  return apiRequest<TeacherClassSummary>("/teacher/classes", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateTeacherClass(
  token: string,
  classId: string,
  payload: { name?: string; description?: string },
): Promise<TeacherClassSummary> {
  return apiRequest<TeacherClassSummary>(`/teacher/classes/${classId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getTeacherClassDetail(token: string, classId: string): Promise<TeacherClassDetail> {
  return apiRequest<TeacherClassDetail>(`/teacher/classes/${classId}`, { token });
}

export function searchChildren(token: string, query: string): Promise<{ items: ChildSearchResult[] }> {
  return apiRequest<{ items: ChildSearchResult[] }>(
    `/teacher/children/search?q=${encodeURIComponent(query)}`,
    { token },
  );
}

export function addChildToClass(
  token: string,
  classId: string,
  childId: string,
): Promise<{ class_id: string; child_id: string; status: string; joined_at: string }> {
  return apiRequest(`/teacher/classes/${classId}/children`, {
    method: "POST",
    token,
    body: JSON.stringify({ child_id: childId }),
  });
}

export function updateChildMembership(
  token: string,
  classId: string,
  childId: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<{ class_id: string; child_id: string; status: string; joined_at: string }> {
  return apiRequest(`/teacher/classes/${classId}/children/${childId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

export function getTeacherStudentProfile(
  token: string,
  classId: string,
  childId: string,
): Promise<TeacherStudentProfile> {
  return apiRequest<TeacherStudentProfile>(`/teacher/classes/${classId}/children/${childId}/profile`, { token });
}
