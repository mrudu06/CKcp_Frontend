import { API_BASE_URL } from "./constants";
import { getToken, clearTeamData } from "./storage";
import type {
  SignupResponse,
  RoundStartResponse,
  QuestionsResponse,
  SubmissionResponse,
  LeaderboardResponse,
  StartTimerResponse,
  AuthVerifyResponse,
} from "./types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // Fix instanceof check for transpiled ES5 targets
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /** Build headers, attaching JWT Bearer token when available. */
  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.authHeaders(),
          ...options?.headers,
        },
      });
    } catch (err) {
      // Network error, CORS block, connection refused, etc.
      const message =
        err instanceof Error ? err.message : "Network request failed";
      throw new ApiError(
        `Cannot connect to server: ${message}. Is the backend running at ${this.baseUrl}?`,
        0
      );
    }

    let data: Record<string, unknown>;
    try {
      data = await response.json();
    } catch {
      // Response wasn't valid JSON
      throw new ApiError(
        `Server returned invalid response (status ${response.status})`,
        response.status
      );
    }

    if (!response.ok) {
      // If 401, token is likely expired — clear stored data
      if (response.status === 401) {
        clearTeamData();
      }
      const errorMessage =
        (data.error as string) ||
        (data.message as string) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    return data as T;
  }

  // ──────────────────────────────────────────────
  //  Auth (calls Next.js API routes, not backend)
  // ──────────────────────────────────────────────

  /**
   * Signup via the Next.js proxy route which mints a JWT.
   * The frontend should call THIS instead of the backend directly.
   */
  async signup(teamName: string, password: string): Promise<SignupResponse> {
    // Call the Next.js API route (same origin), not the external backend
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name: teamName, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new ApiError(
        data.error || `Signup failed with status ${res.status}`,
        res.status
      );
    }

    return data as SignupResponse;
  }

  /** Verify that the stored JWT is still valid. */
  async verifyAuth(token: string): Promise<AuthVerifyResponse> {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return (await res.json()) as AuthVerifyResponse;
  }

  // ──────────────────────────────────────────────
  //  Backend API calls (proxied with JWT header)
  // ──────────────────────────────────────────────

  async startRound(teamId: string): Promise<RoundStartResponse> {
    return this.request<RoundStartResponse>("/api/round/start", {
      method: "POST",
      body: JSON.stringify({ team_id: teamId }),
    });
  }

  async startTimer(teamId: string): Promise<StartTimerResponse> {
    return this.request<StartTimerResponse>("/api/round/start-timer", {
      method: "POST",
      body: JSON.stringify({ team_id: teamId }),
    });
  }

  async getQuestions(teamId: string): Promise<QuestionsResponse> {
    return this.request<QuestionsResponse>(`/api/questions/${teamId}`);
  }

  async submitCode(
    teamId: string,
    questionId: number,
    languageId: number,
    sourceCode: string
  ): Promise<SubmissionResponse> {
    return this.request<SubmissionResponse>("/api/submissions", {
      method: "POST",
      body: JSON.stringify({
        team_id: teamId,
        question_id: questionId,
        language_id: languageId,
        source_code: sourceCode,
      }),
    });
  }

  async getLeaderboard(): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>("/api/leaderboard");
  }
}

export const api = new ApiClient();
