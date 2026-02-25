"use client";

import { useState } from "react";
import { SubmissionResponse } from "@/lib/types";

interface SubmissionResultsModalProps {
  result: SubmissionResponse;
  onClose: () => void;
  onViewLeaderboard?: () => void;
}

export default function SubmissionResultsModal({
  result,
  onClose,
  onViewLeaderboard,
}: SubmissionResultsModalProps) {
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  const toggleTest = (index: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const statusColor =
    result.status === "Accepted"
      ? "text-emerald-400"
      : result.status === "Partial"
      ? "text-amber-400"
      : "text-red-400";

  const statusBg =
    result.status === "Accepted"
      ? "bg-emerald-500/10 border-emerald-500/30"
      : result.status === "Partial"
      ? "bg-amber-500/10 border-amber-500/30"
      : "bg-red-500/10 border-red-500/30";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h3 className="text-lg font-semibold text-white">
            Submission Results
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contest Complete Message */}
          {result.message && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-emerald-400 font-semibold">
                {result.message}
              </p>
            </div>
          )}

          {/* Status Summary */}
          <div
            className={`${statusBg} border rounded-lg p-4 mb-6 flex items-center justify-between`}
          >
            <div className="flex items-center gap-4">
              <div>
                <span className={`text-2xl font-bold ${statusColor}`}>
                  {result.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {result.score}
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0f0f0f] rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">
                {result.passed_testcases}/{result.total_testcases}
              </div>
              <div className="text-xs text-gray-400">Tests Passed</div>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">
                #{result.submission_number}
              </div>
              <div className="text-xs text-gray-400">Submission</div>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-3 text-center">
              <div
                className={`text-lg font-bold ${
                  result.submissions_remaining <= 2
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {result.submissions_remaining}
              </div>
              <div className="text-xs text-gray-400">Remaining</div>
            </div>
          </div>

          {/* Test Case Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Test Case Details
            </h4>
            <div className="space-y-2">
              {result.details.map((detail, index) => (
                <div
                  key={detail.test_case_id}
                  className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg overflow-hidden"
                >
                  {detail.hidden ? (
                    /* Hidden test case — show only pass/fail, no expandable details */
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            detail.passed ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm text-gray-300">
                          Test Case {index + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400">
                          Hidden
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            detail.passed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {detail.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{detail.time}s</span>
                        <span>{Math.round(detail.memory / 1024)}MB</span>
                      </div>
                    </div>
                  ) : (
                    /* Visible test case — expandable with full details */
                    <>
                  <button
                    onClick={() => toggleTest(index)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          detail.passed ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm text-gray-300">
                        Test Case {index + 1}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          detail.passed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {detail.passed ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{detail.time}s</span>
                      <span>{Math.round(detail.memory / 1024)}MB</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedTests.has(index) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {expandedTests.has(index) && (
                    <div className="px-4 pb-4 border-t border-[#2a2a2a] pt-3 space-y-3">
                      {detail.stdout && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Your Output:
                          </div>
                          <pre className="bg-[#1a1a1a] rounded p-2 text-xs font-mono text-gray-300 overflow-x-auto">
                            {detail.stdout}
                          </pre>
                        </div>
                      )}
                      {detail.expected_output && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Expected Output:
                          </div>
                          <pre className="bg-[#1a1a1a] rounded p-2 text-xs font-mono text-emerald-300 overflow-x-auto">
                            {detail.expected_output}
                          </pre>
                        </div>
                      )}
                      {detail.stderr && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Stderr:
                          </div>
                          <pre className="bg-red-950/30 border border-red-500/20 rounded p-2 text-xs font-mono text-red-300 overflow-x-auto">
                            {detail.stderr}
                          </pre>
                        </div>
                      )}
                      {detail.compile_output && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Compile Output:
                          </div>
                          <pre className="bg-red-950/30 border border-red-500/20 rounded p-2 text-xs font-mono text-red-300 overflow-x-auto">
                            {detail.compile_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">
          {result.message && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              View Leaderboard
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-medium rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
