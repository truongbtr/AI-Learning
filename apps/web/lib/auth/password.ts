import { hash, verify } from "@node-rs/argon2";

/** Argon2id parameters (OWASP 2024 minimum: 19 MiB, t=2, p=1). */
const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashSecret(secret: string): Promise<string> {
  return hash(secret, ARGON2);
}

export async function verifySecret(
  hashed: string | null | undefined,
  secret: string,
): Promise<boolean> {
  if (!hashed) return false;
  try {
    return await verify(hashed, secret);
  } catch {
    return false;
  }
}

/** Hash of a throw-away value; used to keep timing similar when the username does not exist. */
let dummyHash: Promise<string> | null = null;
export function verifyAgainstDummy(secret: string): Promise<boolean> {
  dummyHash ??= hash("mtct-dummy-password-for-timing", ARGON2);
  return dummyHash.then((h) => verify(h, secret)).catch(() => false);
}
