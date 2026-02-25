"use client";

import { Question } from "@/lib/types";

interface QuestionPanelProps {
  question: Question | null;
  score: number;
}

export default function QuestionPanel({
  question,
  score,
}: QuestionPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e]">
        <span className="text-sm font-medium text-white">Problem</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              score >= 100
                ? "bg-emerald-500/20 text-emerald-400"
                : score > 0
                ? "bg-amber-500/20 text-amber-400"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {score}/100
          </span>
          {score >= 100 && (
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {question ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">
                {question.title}
              </h2>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  question.difficulty === "medium"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {question.difficulty === "easy" ? "Easy" : "Medium"}
              </span>
            </div>

            {/* Problem Description */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div
                className="text-gray-300 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: formatDescription(question.problem_description),
                }}
              />
            </div>

            {/* Input Format */}
            {question.input_format && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-200 mb-2">
                  Input Format
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {question.input_format}
                </div>
              </div>
            )}

            {/* Output Format */}
            {question.output_format && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-200 mb-2">
                  Output Format
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {question.output_format}
                </div>
              </div>
            )}

            {/* Sample Input / Output */}
            {(question.sample_input || question.sample_output) && (
              <div className="mt-6 space-y-4">
                {question.sample_input && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      Sample Input
                    </h3>
                    <pre className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-gray-300">
                        {question.sample_input}
                      </code>
                    </pre>
                  </div>
                )}
                {question.sample_output && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      Sample Output
                    </h3>
                    <pre className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-gray-300">
                        {question.sample_output}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No question assigned yet. Click &quot;Start Contest&quot; to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDescription(description: string): string {
  let html = description;

  // Escape HTML first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-[#2a2a2a] px-1.5 py-0.5 rounded text-blue-300 text-sm font-mono">$1</code>'
  );

  // Code blocks: ```code```
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    '<pre class="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 my-3 overflow-x-auto"><code class="text-sm font-mono text-gray-300">$2</code></pre>'
  );

  // Headers
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-semibold text-white mt-6 mb-3">$1</h2>'
  );

  // Horizontal rule
  html = html.replace(
    /^---$/gm,
    '<hr class="border-[#2a2a2a] my-4" />'
  );

  // Line breaks (double newline = paragraph break)
  html = html.replace(/\n\n/g, '<br/><br/>');

  return html;
}
