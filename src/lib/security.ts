import { randomBytes } from 'crypto';

const STAFF_ROLES = new Set(['super_admin', 'batch_admin', 'teacher']);

/**
 * The signing key that used to be hardcoded in this repository.
 * It is listed here only so a deployment cannot keep using it.
 */
export const RETIRED_JWT_SECRET = 'trinity-one-super-secret-key-2026-tei';

let ephemeralSecret: Uint8Array | null = null;
let warnedJwt = false;
let warnedDemo = false;

export function isDemoMode(): boolean {
  const flag = process.env.DEMO_MODE?.trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'off') return false;
  return true;
}

export function isStaffRole(role: string | undefined | null): boolean {
  return !!role && STAFF_ROLES.has(role);
}

export function getJwtSecret(): Uint8Array {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured && configured !== RETIRED_JWT_SECRET) {
    if (configured.length < 32 && !warnedJwt) {
      warnedJwt = true;
      console.warn('[trinity] JWT_SECRET should be at least 32 characters.');
    }
    return new TextEncoder().encode(configured);
  }

  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(32);
  }
  if (!warnedJwt) {
    warnedJwt = true;
    if (configured === RETIRED_JWT_SECRET) {
      console.warn(
        '[trinity] JWT_SECRET is the retired key that was committed to git. It will not be used. Set a new JWT_SECRET.'
      );
    } else {
      console.warn(
        '[trinity] JWT_SECRET is not set. Using an ephemeral secret for this process. Sessions reset when the server restarts.'
      );
    }
  }
  warnIfDemoModeIsPublic();
  return ephemeralSecret;
}

export function warnIfDemoModeIsPublic(): void {
  if (warnedDemo || !isDemoMode()) return;
  warnedDemo = true;
  console.warn(
    '[trinity] Demo mode is on: the app signs in as a sample student and /api/auth/switch-demo can assume any persona. Set DEMO_MODE=false before real student data.'
  );
}

export function publicError(error: unknown, status = 500): Response {
  console.error(error);
  const expose = process.env.NODE_ENV !== 'production';
  const message =
    expose && error instanceof Error && error.message
      ? error.message
      : 'Something went wrong. Please try again.';
  return Response.json({ error: message }, { status });
}

export function isSafeAssetUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (!url || url.length > 2048) return false;
  if (url.startsWith('/')) {
    if (!url.startsWith('/uploads/')) return false;
    if (url.includes('..') || url.includes('\\') || url.includes('\0') || url.includes('//')) return false;
    return true;
  }
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  if (hits.size > 5000) {
    for (const [bucket, value] of hits) {
      if (now > value.reset) hits.delete(bucket);
    }
  }
  return entry.count <= limit;
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'local';
}
