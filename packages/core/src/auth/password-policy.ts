/** Password rules for ADMIN/PARENT (docs/12 §6): >= 10 chars, not a common password. */
export const PASSWORD_MIN_LENGTH = 10;

const COMMON_PASSWORDS = new Set([
  "1234567890",
  "12345678910",
  "0123456789",
  "password12",
  "password123",
  "passw0rd12",
  "qwertyuiop",
  "qwerty1234",
  "abcdefghij",
  "iloveyou12",
  "admin12345",
  "administrator",
  "welcome123",
  "letmein123",
  "changeme12",
  "matkhau123",
  "matkhau1234",
  "123456789a",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "1234512345",
  "0987654321",
]);

export type PasswordIssue = "TOO_SHORT" | "TOO_COMMON" | "NO_VARIETY";

export function validatePassword(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) issues.push("TOO_SHORT");
  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered) || /^(.)\1+$/.test(password)) issues.push("TOO_COMMON");
  // At least two character classes (letters / digits / other) to reject "aaaaaaaaaa".
  const classes = [/[a-z]/i, /\d/, /[^a-z\d]/i].filter((r) => r.test(password)).length;
  if (classes < 2) issues.push("NO_VARIETY");
  return issues;
}

export function isPasswordAcceptable(password: string): boolean {
  return validatePassword(password).length === 0;
}
