"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getToken, setTeamData, clearTeamData } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (token) {
        // Verify the token is still valid (not expired)
        try {
          const result = await api.verifyAuth(token);
          if (result.valid) {
            router.replace("/contest");
            return;
          }
        } catch {
          // Verification failed — token is bad, clear it
        }
        clearTeamData();
      }
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!teamName.trim() || !password.trim()) {
      setError("Team name and password are required");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign up
      const signupData = await api.signup(teamName.trim(), password.trim());

      // Step 2: Store team data with JWT token
      setTeamData(signupData.team_id, teamName.trim(), signupData.token);

      // Step 3: Start round to assign questions
      try {
        await api.startRound(signupData.team_id);
      } catch {
        // Round start might fail if already started, that's ok
        addToast("Questions may already be assigned.", "info");
      }

      addToast("Registration successful! Welcome to the contest.", "success");

      // Step 4: Redirect to contest
      router.push("/contest");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("Team name already taken. Please choose a different name.");
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-blue-500">&lt;</span>
            CodeArena
            <span className="text-blue-500">/&gt;</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Competitive Programming Contest
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Register Your Team
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Registering...
                </>
              ) : (
                "Register & Enter"
              )}
            </button>
          </form>

          <p className="text-gray-500 text-xs text-center mt-4">
            60 teams. 2 problems. 10 submissions each. May the best code win.
          </p>
        </div>
      </div>
    </div>
  );
}
