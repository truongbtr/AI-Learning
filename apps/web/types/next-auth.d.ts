import type { Role } from "@mtct/core";
import type { DefaultSession } from "next-auth";

/** Fields carried in the JWT/session (docs/12). Never includes password/pin hashes. */
export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  avatarKey: string | null;
  /** Student profile id for CHILD accounts. */
  studentId: string | null;
  nickname: string | null;
  mustChangePassword: boolean;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }
  interface User extends SessionUser {
    /** "Remember this device" for adults → 30-day cookie instead of idle timeout. */
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    username: string;
    displayName: string;
    role: Role;
    avatarKey: string | null;
    studentId: string | null;
    nickname: string | null;
    mustChangePassword: boolean;
    remember: boolean;
    /** last-activity epoch ms (idle timeout) */
    la: number;
    /** last DB re-check epoch ms */
    chk: number;
  }
}
