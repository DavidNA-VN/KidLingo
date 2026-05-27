import { apiRequest } from "./api";

export type ParentDashboardSummary = {
  child_count: number;
  active_child_count: number;
  class_count: number;
  published_assignment_count: number;
  submitted_assignment_count: number;
  total_submissions: number;
  correct_submissions: number;
  total_stars: number;
  total_coins: number;
  latest_submission_at: string | null;
};

export type ParentSubmissionHistoryItem = {
  id: string;
  submission_type: string;
  assignment_id: string;
  assignment_title: string;
  class_name: string;
  lesson_title: string;
  target_class: string | null;
  predicted_class: string | null;
  confidence: number | null;
  is_correct: boolean;
  speech_passed: boolean;
  speech_transcript: string | null;
  stars_earned: number;
  coins_earned: number;
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

export type ParentProgressSummary = {
  child_id: string;
  display_name: string;
  total_stars: number;
  total_coins: number;
  class_count: number;
  published_assignment_count: number;
  submitted_assignment_count: number;
  pending_assignment_count: number;
  total_submissions: number;
  correct_submissions: number;
  incorrect_submissions: number;
  speech_passed_count: number;
  average_confidence: number | null;
  latest_submission_at: string | null;
  recent_submissions: ParentSubmissionHistoryItem[];
};

export function getParentDashboard(token: string): Promise<ParentDashboardSummary> {
  return apiRequest<ParentDashboardSummary>("/parent/dashboard", { token });
}

export function getChildProgress(token: string, childId: string): Promise<ParentProgressSummary> {
  return apiRequest<ParentProgressSummary>(`/parent/children/${childId}/progress`, { token });
}

export function getChildSubmissions(token: string, childId: string): Promise<ParentSubmissionHistoryItem[]> {
  return apiRequest<ParentSubmissionHistoryItem[]>(`/parent/children/${childId}/submissions`, { token });
}
