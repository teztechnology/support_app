import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  metadata: z.record(z.any()).default({}),
})

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  metadata: z.record(z.any()).optional(),
})

export const SearchCustomersSchema = z.object({
  search: z.string().optional(),
  company: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'company', 'createdAt', 'totalIssues']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const MergeCustomersSchema = z.object({
  primaryCustomerId: z.string().min(1, 'Primary customer ID is required'),
  duplicateCustomerId: z.string().min(1, 'Duplicate customer ID is required'),
}).refine(data => data.primaryCustomerId !== data.duplicateCustomerId, {
  message: 'Primary and duplicate customer IDs must be different',
  path: ['duplicateCustomerId']
})

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>
export type SearchCustomersInput = z.infer<typeof SearchCustomersSchema>
export type MergeCustomersInput = z.infer<typeof MergeCustomersSchema>