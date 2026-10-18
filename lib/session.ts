import "server-only";
import { cookies } from "next/headers";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";

export async function isTeamMember(): Promise<boolean> {
  return isValidSession((await cookies()).get(AUTH_COOKIE)?.value);
}

export async function requireTeam(): Promise<void> {
  if (!(await isTeamMember())) throw new Error("Your session expired. Sign in again.");
}
