export const AUTH_COOKIE = "team_session";

export const authEnabled = () => Boolean(process.env.TEAM_PASSWORD);

/** Deterministic session token derived from the team password, so changing the password signs everyone out. */
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(`${process.env.TEAM_PASSWORD}:${process.env.AUTH_SECRET ?? ""}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!authEnabled()) return true;
  return Boolean(value) && value === (await sessionToken());
}
