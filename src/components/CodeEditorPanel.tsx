"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { LANGUAGES, getMonacoLanguage, MAX_SUBMISSIONS } from "@/lib/constants";
import type { editor } from "monaco-editor";

interface CodeEditorPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  languageId: number;
  onLanguageChange: (languageId: number) => void;
  submissionsRemaining: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  activeTab: "easy" | "medium";
}

export default function CodeEditorPanel({
  code,
  onCodeChange,
  languageId,
  onLanguageChange,
  submissionsRemaining,
  isSubmitting,
  onSubmit,
  activeTab,
}: CodeEditorPanelProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const canSubmit = !isSubmitting && submissionsRemaining > 0 && code.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: language selector */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <label htmlFor="language-select" className="text-xs text-gray-400">
            Language:
          </label>
          <select
            id="language-select"
            value={languageId}
            onChange={(e) => onLanguageChange(Number(e.target.value))}
            className="bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-gray-500">
          Editing: <span className="text-gray-300 capitalize">{activeTab}</span> problem
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getMonacoLanguage(languageId)}
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), 'Fira Code', 'Cascadia Code', monospace",
            lineNumbers: "on",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                Loading editor...
              </div>
            </div>
          }
        />
      </div>

      {/* Bottom bar: submit area */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-t border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <span
            className={`text-sm ${
              submissionsRemaining <= 2
                ? "text-red-400"
                : submissionsRemaining <= 5
                ? "text-amber-400"
                : "text-gray-400"
            }`}
          >
            Submissions remaining:{" "}
            <span className="font-semibold">
              {submissionsRemaining}/{MAX_SUBMISSIONS}
            </span>
          </span>
          <span className="text-xs text-amber-500/80">
            Latest submission score replaces previous
          </span>
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
            canSubmit
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              Running tests...
            </>
          ) : submissionsRemaining <= 0 ? (
            "No submissions left"
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Submit
            </>
          )}
        </button>
      </div>
    </div>
  );
}
