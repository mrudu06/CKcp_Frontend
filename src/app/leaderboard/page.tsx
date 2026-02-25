"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getTeamName } from "@/lib/storage";
import { useToast } from "@/components/ToastProvider";
import type { LeaderboardEntry } from "@/lib/types";

const REFRESH_INTERVAL = 10_000; // 10 seconds

export default function LeaderboardPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [currentTeamName, setCurrentTeamName] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data.leaderboard);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof ApiError) {
        addToast(err.message, "error");
      } else {
        addToast("Failed to load leaderboard", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Get current team name
  useEffect(() => {
    setCurrentTeamName(getTeamName());
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  // Update "seconds ago" counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(
        Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"; // Gold
      case 2:
        return "text-gray-300"; // Silver
      case 3:
        return "text-amber-600"; // Bronze
      default:
        return "text-gray-400";
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
            1
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">
            2
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">
            3
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 text-gray-500 text-sm">
            {rank}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">
              <span className="text-blue-500">&lt;</span>
              CodeArena
              <span className="text-blue-500">/&gt;</span>
            </h1>
            <span className="text-gray-500">|</span>
            <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Updated {secondsAgo}s ago
            </span>
            <button
              onClick={() => router.push("/contest")}
              className="px-3 py-1.5 text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              Back to Contest
            </button>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
             <thead>
              <tr className="border-b border-[#2a2a2a] text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Score
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Time Taken
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                  Submissions
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Link
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentTeam = entry.team_name === currentTeamName;
                const isTop3 = rank <= 3;

                return (
                  <tr
                    key={entry.team_name}
                    className={`border-b border-[#2a2a2a] last:border-b-0 transition-colors ${
                      isCurrentTeam
                        ? "bg-blue-500/10 hover:bg-blue-500/15"
                        : isTop3
                        ? "bg-[#1e1e1e] hover:bg-[#222222]"
                        : "hover:bg-[#1e1e1e]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      {getRankBadge(rank)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isCurrentTeam
                              ? "text-blue-400"
                              : isTop3
                              ? getRankStyle(rank)
                              : "text-white"
                          }`}
                        >
                          {entry.team_name}
                        </span>
                        {isCurrentTeam && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-bold ${
                          entry.easy_score >= 100
                            ? "text-emerald-400"
                            : entry.easy_score > 0
                            ? "text-amber-400"
                            : "text-gray-500"
                        }`}
                      >
                        {entry.easy_score}
                      </span>
                      <span className="text-xs text-gray-600">/100</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.cp_time_taken != null ? (
                        <span className="text-sm font-mono text-emerald-400">
                          {formatTimeTaken(entry.cp_time_taken)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">--:--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-400">
                        {entry.easy_submission_count}/10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.completion_time ? (
                        <div>
                          <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                            Completed
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCompletionTime(entry.completion_time)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.drive_link ? (
                        <a
                          href={entry.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leaderboard.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No teams have registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-4 text-xs text-gray-600">
          Auto-refreshing every 10 seconds
        </div>
      </div>
    </div>
  );
}

function formatCompletionTime(timeStr: string): string {
  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timeStr;
  }
}

function formatTimeTaken(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}
