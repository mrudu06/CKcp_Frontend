import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * POST /api/auth/verify
 *
 * Verifies that a JWT is still valid (not expired, not tampered).
 * Used by the client to check if the stored token is still good.
 *
 * Request body: { token: string }
 * Response:     { valid: true, team_id, team_name } or { valid: false }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      team_id: payload.team_id,
      team_name: payload.team_name,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
