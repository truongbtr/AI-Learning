import { PIN_LENGTH } from "@mtct/core";
import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.-]{2,32}$/, "Tên đăng nhập: 2-32 ký tự a-z, 0-9, . _ -");

const pinSchema = z.array(z.string().min(1)).length(PIN_LENGTH, "Mã hình phải đủ 4 hình");

export const studentInputSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  nickname: z.string().trim().min(1).max(40),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  className: z.string().trim().max(20).default("1B3"),
  schoolYear: z.string().trim().max(20).default("2026-2027"),
  interests: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  mascot: z.enum(["ROBOT", "OWL"]).default("ROBOT"),
});

const base = {
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(60),
  avatarKey: z.string().max(40).nullable().optional(),
};

export const createUserSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("CHILD"),
    ...base,
    pictureSetKey: z.string().max(40),
    pin: pinSchema,
    student: studentInputSchema,
    guardianUserIds: z.array(z.string()).default([]),
  }),
  z.object({
    role: z.enum(["PARENT", "ADMIN"]),
    ...base,
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(200),
    guardianStudentIds: z.array(z.string()).default([]),
  }),
]);

export const patchUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    displayName: z.string().trim().min(1).max(60).optional(),
    email: z.string().trim().toLowerCase().email().nullable().optional(),
    avatarKey: z.string().max(40).nullable().optional(),
    role: z.enum(["PARENT", "ADMIN"]).optional(),
    /** Full replacement of the parent's linked students. */
    guardianStudentIds: z.array(z.string()).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Không có gì để cập nhật");

export const resetCredentialSchema = z.union([
  z.object({ password: z.string().min(1).max(200) }),
  z.object({ pin: pinSchema, pictureSetKey: z.string().max(40).optional() }),
]);
