/** Account lockout policy (docs/12 §6): 5 failures -> locked 10 minutes. */
export const LOCKOUT_POLICY = {
  maxFailures: 5,
  lockMinutes: 10,
} as const;

/** IP throttle (docs/12 §6): 10 attempts per minute per IP. */
export const IP_THROTTLE = {
  maxAttempts: 10,
  windowSeconds: 60,
} as const;

export interface LockState {
  failedCount: number;
  lockedUntil: Date | null;
}

export function isLocked(state: LockState, now: Date): boolean {
  return state.lockedUntil !== null && state.lockedUntil.getTime() > now.getTime();
}

/** Seconds left until the lock expires (0 when not locked). */
export function lockRemainingSeconds(state: LockState, now: Date): number {
  if (!isLocked(state, now)) return 0;
  return Math.ceil((state.lockedUntil!.getTime() - now.getTime()) / 1000);
}

/** New state after a failed attempt. Locks when the failure counter reaches the limit. */
export function applyFailure(
  state: LockState,
  now: Date,
  policy: { maxFailures: number; lockMinutes: number } = LOCKOUT_POLICY,
): LockState {
  // A lock that already expired resets the counter before counting this failure.
  const base = state.lockedUntil && !isLocked(state, now) ? 0 : state.failedCount;
  const failedCount = base + 1;
  if (failedCount >= policy.maxFailures) {
    return {
      failedCount,
      lockedUntil: new Date(now.getTime() + policy.lockMinutes * 60_000),
    };
  }
  return { failedCount, lockedUntil: null };
}

/** New state after a successful login. */
export function applySuccess(): LockState {
  return { failedCount: 0, lockedUntil: null };
}

/** Whether an IP has exceeded the throttle window. */
export function ipThrottled(
  attemptsInWindow: number,
  throttle: { maxAttempts: number } = IP_THROTTLE,
): boolean {
  return attemptsInWindow >= throttle.maxAttempts;
}
