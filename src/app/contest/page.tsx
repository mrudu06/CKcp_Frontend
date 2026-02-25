"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getTeamId, getTeamName, getToken, clearTeamData } from "@/lib/storage";
import { DEFAULT_LANGUAGE_ID, MAX_SUBMISSIONS, CREATIVES_DRIVE_LINK } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";
import QuestionPanel from "@/components/QuestionPanel";
import SubmissionResultsModal from "@/components/SubmissionResultsModal";
import type { QuestionsResponse, SubmissionResponse } from "@/lib/types";

// Lazy-load Monaco editor to avoid SSR issues
const CodeEditorPanel = lazy(() => import("@/components/CodeEditorPanel"));

function EditorFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
        Loading editor...
      </div>
    </div>
  );
}

function formatTimer(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export default function ContestPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // Auth state
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamNameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Question state
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(
    null
  );

  // Editor state
  const [code, setCode] = useState("");
  const [languageId, setLanguageId] = useState(DEFAULT_LANGUAGE_ID);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResponse | null>(null);

  // Timer state
  const [cpStartTime, setCpStartTime] = useState<string | null>(null);
  const [cpTimeTaken, setCpTimeTaken] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Question progression state (easy → medium, one-way)
  const [activeQuestion, setActiveQuestion] = useState<"easy" | "medium">("easy");
  const hasInitializedQuestion = useRef(false);

  // Auth check on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      const id = getTeamId();
      const name = getTeamName();

      if (!token || !id) {
        clearTeamData();
        router.replace("/");
        return;
      }

      // Verify token is still valid (not expired)
      try {
        const result = await api.verifyAuth(token);
        if (!result.valid) {
          clearTeamData();
          router.replace("/");
          return;
        }
      } catch {
        clearTeamData();
        router.replace("/");
        return;
      }

      setTeamId(id);
      setTeamNameState(name);
    }
    checkAuth();
  }, [router]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = await api.getQuestions(teamId);
      setQuestionsData(data);
      // Sync timer state from server
      if (data.cp_start_time) setCpStartTime(data.cp_start_time);
      if (data.cp_time_taken != null) setCpTimeTaken(data.cp_time_taken);
    } catch (err) {
      if (err instanceof ApiError) {
        addToast(err.message, "error");
      } else if (err instanceof Error) {
        addToast(err.message, "error");
      } else {
        addToast("Failed to load questions", "error");
      }
      console.error("Fetch questions error:", err);
    } finally {
      setLoading(false);
    }
  }, [teamId, addToast]);

  useEffect(() => {
    if (teamId) {
      fetchQuestions();
    }
  }, [teamId, fetchQuestions]);

  // On first data load, jump straight to medium if easy is already done (handles refresh)
  useEffect(() => {
    if (!questionsData || hasInitializedQuestion.current) return;
    const easyDone =
      questionsData.easy_score >= 100 ||
      questionsData.easy_submission_count >= MAX_SUBMISSIONS;
    if (easyDone && questionsData.medium_question) {
      setActiveQuestion("medium");
    }
    hasInitializedQuestion.current = true;
  }, [questionsData]);

  // Start CP timer when contest page loads (only sets if not already set)
  useEffect(() => {
    if (!teamId) return;
    api.startTimer(teamId).then((res) => {
      setCpStartTime(res.cp_start_time);
    }).catch((err) => {
      console.error("Start timer error:", err);
    });
  }, [teamId]);

  // Live ticking timer
  useEffect(() => {
    // If contest is completed, show final time and stop ticking
    if (cpTimeTaken != null) {
      setElapsedSeconds(cpTimeTaken);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (!cpStartTime) return;

    const startMs = new Date(cpStartTime).getTime();

    const tick = () => {
      setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    };
    tick(); // immediate first tick
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cpStartTime, cpTimeTaken]);

  // Current question based on active progression step
  const currentQuestion =
    activeQuestion === "easy"
      ? questionsData?.easy_question ?? null
      : questionsData?.medium_question ?? null;
  const currentSubmissionCount =
    activeQuestion === "easy"
      ? questionsData?.easy_submission_count ?? 0
      : questionsData?.medium_submission_count ?? 0;
  const currentScore =
    activeQuestion === "easy"
      ? questionsData?.easy_score ?? 0
      : questionsData?.medium_score ?? 0;
  const submissionsRemaining = MAX_SUBMISSIONS - currentSubmissionCount;

  // Completion flags
  const isEasyDone =
    (questionsData?.easy_score ?? 0) >= 100 ||
    (questionsData?.easy_submission_count ?? 0) >= MAX_SUBMISSIONS;
  const isMediumDone =
    (questionsData?.medium_score ?? 0) >= 100 ||
    (questionsData?.medium_submission_count ?? 0) >= MAX_SUBMISSIONS;
  const isContestComplete = isEasyDone && isMediumDone;

  const handleSubmit = async () => {
    if (!teamId || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await api.submitCode(
        teamId,
        currentQuestion.id,
        languageId,
        code
      );
      setSubmissionResult(result);

      if (result.status === "Accepted") {
        addToast("All test cases passed!", "success");
      } else if (result.status === "Partial") {
        addToast(
          `Passed ${result.passed_testcases}/${result.total_testcases} test cases`,
          "warning"
        );
      } else {
        addToast("Wrong answer. Check the test case details.", "error");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          addToast("Submission limit reached for this question!", "error");
        } else {
          addToast(err.message, "error");
        }
      } else if (err instanceof Error) {
        addToast(err.message, "error");
      } else {
        addToast("Submission failed. Please try again.", "error");
      }
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseResults = () => {
    // If easy question was just finished (accepted or exhausted), auto-advance to medium
    if (
      activeQuestion === "easy" &&
      submissionResult !== null &&
      (submissionResult.status === "Accepted" ||
        submissionResult.submissions_remaining === 0) &&
      questionsData?.medium_question
    ) {
      setActiveQuestion("medium");
      setCode("");
    }
    setSubmissionResult(null);
    // Refresh questions data to update scores
    fetchQuestions();
  };

  const handleNextQuestion = () => {
    setSubmissionResult(null);
    setActiveQuestion("medium");
    setCode(""); // Clear editor for the new question
    fetchQuestions();
  };

  const handleViewLeaderboard = () => {
    setSubmissionResult(null);
    router.push("/leaderboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm">Loading contest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Top Nav Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">
            <span className="text-blue-500">&lt;</span>
            CodeArena
            <span className="text-blue-500">/&gt;</span>
          </h1>
          {isContestComplete ? (
            <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">
              Contest Completed!
            </span>
          ) : isEasyDone ? (
            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full font-medium">
              Q1 Done · On Q2
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {/* Live Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-sm ${
            cpTimeTaken != null
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[#2a2a2a] text-white"
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTimer(elapsedSeconds)}</span>
            {cpTimeTaken != null && (
              <span className="text-xs ml-1">(final)</span>
            )}
          </div>
          <span className="text-sm text-gray-400">
            Team:{" "}
            <span className="text-white font-medium">{teamName || "—"}</span>
          </span>
          <button
            onClick={() => router.push("/leaderboard")}
            className="px-3 py-1.5 text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            Leaderboard
          </button>
        </div>
      </header>

      {/* Completion Banner */}
      {isContestComplete ? (
        <div className="bg-emerald-600/20 border-b border-emerald-500/30 px-4 py-2 shrink-0 flex items-center justify-center gap-4">
          <span className="text-emerald-400 text-sm font-medium">
            🎉 Both questions complete! Your final score is locked.
          </span>
          <a
            href={CREATIVES_DRIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            View Creatives PPT →
          </a>
        </div>
      ) : isEasyDone && activeQuestion === "easy" ? (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center shrink-0">
          <span className="text-amber-400 text-sm font-medium">
            Easy question done! Proceed to the Medium question.
          </span>
        </div>
      ) : null}

      {/* Main Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel: Question (40%) */}
        <div className="w-[40%] border-r border-[#2a2a2a] bg-[#1a1a1a] flex flex-col min-h-0">
          <QuestionPanel
            question={currentQuestion}
            score={currentScore}
          />
        </div>

        {/* Right Panel: Code Editor (60%) */}
        <div className="w-[60%] flex flex-col min-h-0">
          <Suspense fallback={<EditorFallback />}>
            <CodeEditorPanel
              code={code}
              onCodeChange={setCode}
              languageId={languageId}
              onLanguageChange={setLanguageId}
              submissionsRemaining={submissionsRemaining}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              activeTab={activeQuestion}
            />
          </Suspense>
        </div>
      </div>

      {/* Submission Results Modal */}
      {submissionResult && (
        <SubmissionResultsModal
          result={submissionResult}
          onClose={handleCloseResults}
          onViewLeaderboard={handleViewLeaderboard}
          onNextQuestion={
            activeQuestion === "easy" &&
            questionsData?.medium_question != null &&
            (submissionResult.status === "Accepted" ||
              submissionResult.submissions_remaining === 0)
              ? handleNextQuestion
              : undefined
          }
          driveLink={
            activeQuestion === "medium" &&
            (submissionResult.status === "Accepted" ||
              submissionResult.submissions_remaining === 0)
              ? CREATIVES_DRIVE_LINK
              : undefined
          }
        />
      )}
    </div>
  );
}
