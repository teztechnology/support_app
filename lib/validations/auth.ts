import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  organizationSlug: z.string().optional(),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters"),
  organizationSlug: z
    .string()
    .min(1, "Organization slug is required")
    .max(50, "Organization slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Organization slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

export const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  role: z.enum(["admin", "support_agent", "read_only"], {
    required_error: "Role is required",
  }),
});

export const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "support_agent", "read_only"], {
    required_error: "Role is required",
  }),
  permissions: z.array(z.string()).optional(),
});

export const OrganizationSettingsSchema = z.object({
  allowSelfRegistration: z.boolean(),
  defaultUserRole: z.enum(["admin", "support_agent", "read_only"]),
  requireApproval: z.boolean(),
  branding: z
    .object({
      logoUrl: z.string().url().optional().or(z.literal("")),
      primaryColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
        .optional(),
      secondaryColor: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
        .optional(),
    })
    .optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type OrganizationSettingsInput = z.infer<
  typeof OrganizationSettingsSchema
>;
