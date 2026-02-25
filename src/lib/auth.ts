import { SignJWT, jwtVerify } from "jose";

// JWT secret — in production, set JWT_SECRET env var to a strong random string.
// This fallback is only for local dev.
const JWT_SECRET =
  process.env.JWT_SECRET || "codearena-default-secret-change-me";

// Token validity: 3 hours (typical contest duration)
const TOKEN_EXPIRY = "3h";

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  team_id: string;
  team_name: string;
}

/**
 * Create a signed JWT containing the team's identity.
 * Called server-side only (API routes).
 */
export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer("codearena")
    .sign(secret);
}

/**
 * Verify and decode a JWT. Returns the payload or null if invalid/expired.
 * Works in Edge runtime (middleware) and Node runtime (API routes).
 */
export async function verifyToken(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "codearena",
    });
    return {
      team_id: payload.team_id as string,
      team_name: payload.team_name as string,
    };
  } catch {
    return null;
  }
}
