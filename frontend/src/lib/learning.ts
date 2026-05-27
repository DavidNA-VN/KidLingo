import { apiRequest } from "./api";

export type DoodlePrediction = {
  target_class: string | null;
  predicted_class: string;
  english: string;
  vi: string;
  phonetic: string | null;
  confidence: number;
  is_correct: boolean;
  top_predictions: Array<{
    class_key: string;
    english: string;
    vi: string;
    phonetic: string | null;
    confidence: number;
  }>;
};

export type SubmissionResult = {
  id: string;
  assignment_id: string;
  child_id: string;
  target_class: string | null;
  predicted_class: string;
  confidence: number;
  is_correct: boolean;
  top_predictions: DoodlePrediction["top_predictions"] | null;
  canvas_image_url: string | null;
  speech_transcript: string | null;
  speech_passed: boolean;
  stars_earned: number;
  coins_earned: number;
  created_at: string;
};

export function predictDoodle(
  token: string,
  payload: {
    child_id: string;
    assignment_id: string;
    image_data_url: string;
    target_class?: string | null;
    top_k?: number;
  },
): Promise<DoodlePrediction> {
  return apiRequest<DoodlePrediction>("/ai/predict", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function createSubmission(
  token: string,
  payload: {
    child_id: string;
    assignment_id: string;
    target_class?: string | null;
    predicted_class: string;
    confidence: number;
    is_correct?: boolean;
    top_predictions?: DoodlePrediction["top_predictions"];
    canvas_image_data_url?: string | null;
    speech_transcript?: string | null;
    speech_passed: boolean;
  },
): Promise<SubmissionResult> {
  return apiRequest<SubmissionResult>("/submissions", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
