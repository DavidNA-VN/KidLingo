import { apiRequest } from "./api";

export type DashboardSummary = {
  class_count: number;
  active_child_count: number;
  open_assignment_count: number;
  new_submission_count: number;
  review_submission_count: number;
  ungraded_submission_count: number;
  average_completion_rate: number;
  average_confidence: number | null;
  average_score: number | null;
};

export type ClassProgressItem = {
  class_id: string;
  class_name: string;
  class_code: string | null;
  active_child_count: number;
  assignment_count: number;
  submitted_count: number;
  missing_count: number;
  ungraded_submission_count: number;
  graded_submission_count: number;
  average_score: number | null;
  completion_rate: number;
};

export type AssignmentProgressItem = {
  assignment_id: string;
  assignment_type: string;
  title: string;
  instructions: string | null;
  worksheet_file_url: string | null;
  answer_template_url: string | null;
  max_score: number;
  status: "PUBLISHED" | "CLOSED";
  due_at: string | null;
  class_id: string;
  class_name: string;
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
};

export type StatusBreakdownItem = {
  status: "PUBLISHED" | "CLOSED";
  count: number;
};

export type SubmissionQualityItem = {
  label: string;
  count: number;
};

export type DashboardSubmissionItem = {
  id: string;
  submission_type: string;
  child_id: string;
  child_name: string;
  class_name: string;
  assignment_id: string;
  assignment_title: string;
  predicted_class: string | null;
  is_correct: boolean;
  confidence: number | null;
  speech_passed: boolean;
  stars_earned: number;
  coins_earned: number;
  grading_status: string;
  score: number | null;
  max_score: number | null;
  created_at: string;
  review_reason: string | null;
};

export type TopStudentItem = {
  child_id: string;
  child_name: string;
  class_id: string;
  class_name: string;
  graded_submission_count: number;
  average_score: number;
};

export type TeacherDashboardData = {
  summary: DashboardSummary;
  class_progress: ClassProgressItem[];
  assignment_progress: AssignmentProgressItem[];
  status_breakdown: StatusBreakdownItem[];
  submission_quality: SubmissionQualityItem[];
  score_distribution: SubmissionQualityItem[];
  pronunciation_pass_rate: number;
  ungraded_by_class: ClassProgressItem[];
  assignment_stats_by_class: ClassProgressItem[];
  top_students: TopStudentItem[];
  upcoming_assignments: AssignmentProgressItem[];
  review_submissions: DashboardSubmissionItem[];
  recent_submissions: DashboardSubmissionItem[];
};

export function getTeacherDashboard(token: string, classId?: string | null): Promise<TeacherDashboardData> {
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : "";
  return apiRequest<TeacherDashboardData>(`/teacher/dashboard${query}`, { token });
}
