const TEAM_ID_KEY = "contest_team_id";
const TEAM_NAME_KEY = "contest_team_name";
const TOKEN_KEY = "contest_token";

export function getTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TEAM_ID_KEY);
}

export function getTeamName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TEAM_NAME_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTeamData(
  teamId: string,
  teamName: string,
  token: string
): void {
  localStorage.setItem(TEAM_ID_KEY, teamId);
  localStorage.setItem(TEAM_NAME_KEY, teamName);
  localStorage.setItem(TOKEN_KEY, token);

  // Also set the token as a cookie so Next.js middleware can read it.
  // SameSite=Strict for security; path=/ so it's sent on all routes.
  document.cookie = `contest_token=${token}; path=/; SameSite=Strict; max-age=10800`;
}

export function clearTeamData(): void {
  localStorage.removeItem(TEAM_ID_KEY);
  localStorage.removeItem(TEAM_NAME_KEY);
  localStorage.removeItem(TOKEN_KEY);

  // Clear the cookie too
  document.cookie =
    "contest_token=; path=/; SameSite=Strict; max-age=0";
}
