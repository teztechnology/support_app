import { z } from "zod";

export const CreateIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters"),
  priority: z.enum(["critical", "high", "medium", "low"], {
    required_error: "Priority is required",
  }),
  category: z.string().optional(),
  applicationId: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  assignedToId: z.string().optional(),
});

export const UpdateIssueSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  status: z
    .enum(["new", "in_progress", "awaiting_customer", "resolved"])
    .optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  category: z.string().optional(),
  applicationId: z.string().optional(),
  customerId: z.string().optional(),
  assignedToId: z.string().optional(),
  resolutionNotes: z
    .string()
    .max(2000, "Resolution notes must be less than 2000 characters")
    .optional(),
});

export const BulkUpdateIssuesSchema = z.object({
  issueIds: z.array(z.string()).min(1, "At least one issue must be selected"),
  updates: z
    .object({
      status: z
        .enum(["new", "in_progress", "awaiting_customer", "resolved"])
        .optional(),
      priority: z.enum(["critical", "high", "medium", "low"]).optional(),
      assignedToId: z.string().optional(),
      category: z.string().optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, {
      message: "At least one field must be updated",
    }),
});

export const IssueFilterSchema = z.object({
  status: z
    .array(z.enum(["new", "in_progress", "awaiting_customer", "resolved"]))
    .optional(),
  priority: z.array(z.enum(["critical", "high", "medium", "low"])).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  category: z.string().optional(),
  dateRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "updatedAt", "priority", "status", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const AddCommentSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(2000, "Comment must be less than 2000 characters"),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export type BulkUpdateIssuesInput = z.infer<typeof BulkUpdateIssuesSchema>;
export type IssueFilterInput = z.infer<typeof IssueFilterSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
