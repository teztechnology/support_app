import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters"),
  applicationId: z.string().min(1, "Application is required"),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color")
    .optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  applicationId: z.string().min(1, "Application is required").optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color")
    .optional(),
  isActive: z.boolean().optional(),
});

export const CreateApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "Application name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters"),
  jiraProjectKey: z
    .string()
    .max(50, "Jira project key must be less than 50 characters")
    .regex(
      /^[A-Z][A-Z0-9]*$/,
      "Jira project key must contain only uppercase letters and numbers"
    )
    .optional(),
  isActive: z.boolean().default(true),
});

export const UpdateApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "Application name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  jiraProjectKey: z
    .string()
    .max(50, "Jira project key must be less than 50 characters")
    .regex(
      /^[A-Z][A-Z0-9]*$/,
      "Jira project key must contain only uppercase letters and numbers"
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
