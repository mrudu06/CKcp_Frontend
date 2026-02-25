export interface Question {
  id: number;
  difficulty: "easy" | "medium";
  title: string;
  problem_description: string;
  sample_input: string;
  sample_output: string;
  input_format: string;
  output_format: string;
  created_at: string;
}

export interface RoundStartResponse {
  easy_question: Question;
  medium_question: Question;
  easy_score: number;
  medium_score: number;
  easy_submission_count: number;
  medium_submission_count: number;
}

export interface QuestionsResponse {
  easy_question: Question | null;
  medium_question: Question | null;
  easy_score: number;
  medium_score: number;
  easy_submission_count: number;
  medium_submission_count: number;
  completion_time: string | null;
  cp_start_time: string | null;
  cp_time_taken: number | null;
}

export interface TestCaseDetail {
  test_case_id: string;
  passed: boolean;
  hidden: boolean;
  status_id: number;
  stdout: string | null;
  expected_output: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string;
  memory: number;
}

export interface SubmissionResponse {
  status: "Accepted" | "Partial" | "Wrong Answer";
  score: number;
  passed_testcases: number;
  total_testcases: number;
  submission_number: number;
  submissions_remaining: number;
  details: TestCaseDetail[];
  message?: string;
}

export interface LeaderboardEntry {
  team_name: string;
  easy_score: number;
  total_score: number;
  easy_submission_count: number;
  completion_time: string | null;
  cp_time_taken: number | null;
  drive_link?: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface SignupResponse {
  team_id: string;
  token: string;
}

export interface AuthVerifyResponse {
  valid: boolean;
  team_id?: string;
  team_name?: string;
}

export interface StartTimerResponse {
  cp_start_time: string;
}

export interface ApiError {
  error: string;
}
