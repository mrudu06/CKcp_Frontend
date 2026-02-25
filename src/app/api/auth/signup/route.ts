import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://ck-cp-backend-m4mb.onrender.com";

/**
 * POST /api/auth/signup
 *
 * Proxies the signup request to the backend, then mints a JWT
 * containing the team_id and team_name.
 *
 * Request body: { team_name: string, password: string }
 * Response:     { token: string, team_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { team_name, password } = body;

    if (!team_name || !password) {
      return NextResponse.json(
        { error: "Team name and password are required" },
        { status: 400 }
      );
    }

    // Forward signup to the actual backend
    const backendRes = await fetch(`${BACKEND_URL}/api/teams/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name, password }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Signup failed" },
        { status: backendRes.status }
      );
    }

    // Mint a JWT with team identity
    const token = await createToken({
      team_id: data.team_id,
      team_name,
    });

    return NextResponse.json({
      token,
      team_id: data.team_id,
    });
  } catch (err) {
    console.error("Auth signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
