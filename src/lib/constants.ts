// API base URL — the backend at src/app.js has cors() enabled, so direct calls work.
// Override with NEXT_PUBLIC_API_URL env var if the backend is on a different host.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ck-cp-backend-m4mb.onrender.com";

export const LANGUAGES = [
  { id: 109, name: "Python (3.13.2)" },
  { id: 100, name: "Python (3.12.5)" },
  { id: 105, name: "C++ (GCC 14.1.0)" },
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 103, name: "C (GCC 14.1.0)" },
  { id: 50, name: "C (GCC 9.2.0)" },
  { id: 91, name: "Java (JDK 17.0.6)" },
  { id: 62, name: "Java (OpenJDK 13.0.1)" },
  { id: 102, name: "JavaScript (Node.js 22.08.0)" },
  { id: 97, name: "JavaScript (Node.js 20.17.0)" },
  { id: 101, name: "TypeScript (5.6.2)" },
  { id: 94, name: "TypeScript (5.0.3)" },
  { id: 107, name: "Go (1.23.5)" },
  { id: 108, name: "Rust (1.85.0)" },
  { id: 111, name: "Kotlin (2.1.10)" },
  { id: 51, name: "C# (Mono 6.6.0.161)" },
  { id: 83, name: "Swift (5.2.3)" },
  { id: 72, name: "Ruby (2.7.0)" },
  { id: 90, name: "Dart (2.19.2)" },
] as const;

export const DEFAULT_LANGUAGE_ID = 109;

export const MAX_SUBMISSIONS = 10;

/** Drive link shown to contestants after completing both questions */
export const CREATIVES_DRIVE_LINK =
  ""; // TODO: replace with actual link

/** Map language id to Monaco language identifier */
export function getMonacoLanguage(languageId: number): string {
  const map: Record<number, string> = {
    109: "python",
    100: "python",
    105: "cpp",
    54: "cpp",
    103: "c",
    50: "c",
    91: "java",
    62: "java",
    102: "javascript",
    97: "javascript",
    101: "typescript",
    94: "typescript",
    107: "go",
    108: "rust",
    111: "kotlin",
    51: "csharp",
    83: "swift",
    72: "ruby",
    90: "dart",
  };
  return map[languageId] || "plaintext";
}
