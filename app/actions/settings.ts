'use server'

import { revalidatePath } from 'next/cache'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { 
  CreateCategorySchema, 
  UpdateCategorySchema,
  CreateApplicationSchema,
  UpdateApplicationSchema
} from '@/lib/validations/settings'
import { ServerActionResponse, Category, Application } from '@/types'

// Category Actions
export async function createCategory(prevState: any, formData: FormData): Promise<ServerActionResponse<Category>> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    const validatedFields = CreateCategorySchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description') || '',
      applicationId: formData.get('applicationId'),
      color: formData.get('color') || undefined,
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const category = await dbQueries.createCategory({
      ...validatedFields.data,
      organizationId: session.organizationId,
    })

    revalidatePath('/settings')
    
    return {
      success: true,
      data: category,
    }
  } catch (error: any) {
    console.error('Create category error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create category',
    }
  }
}

export async function updateCategory(categoryId: string, prevState: any, formData: FormData): Promise<ServerActionResponse<Category>> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    const validatedFields = UpdateCategorySchema.safeParse({
      name: formData.get('name') || undefined,
      description: formData.get('description') || undefined,
      applicationId: formData.get('applicationId') || undefined,
      color: formData.get('color') || undefined,
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const updates = Object.fromEntries(
      Object.entries(validatedFields.data).filter(([_, value]) => value !== undefined)
    )

    const category = await dbQueries.updateCategory(categoryId, session.organizationId, updates)

    revalidatePath('/settings')
    
    return {
      success: true,
      data: category,
    }
  } catch (error: any) {
    console.error('Update category error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update category',
    }
  }
}

export async function deleteCategory(categoryId: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    await dbQueries.deleteCategory(categoryId, session.organizationId)

    revalidatePath('/settings')
    
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Delete category error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete category',
    }
  }
}

// Application Actions
export async function createApplication(prevState: any, formData: FormData): Promise<ServerActionResponse<Application>> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    const validatedFields = CreateApplicationSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description') || '',
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const application = await dbQueries.createApplication({
      ...validatedFields.data,
      organizationId: session.organizationId,
    })

    revalidatePath('/settings')
    
    return {
      success: true,
      data: application,
    }
  } catch (error: any) {
    console.error('Create application error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create application',
    }
  }
}

export async function updateApplication(applicationId: string, prevState: any, formData: FormData): Promise<ServerActionResponse<Application>> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    const validatedFields = UpdateApplicationSchema.safeParse({
      name: formData.get('name') || undefined,
      description: formData.get('description') || undefined,
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const updates = Object.fromEntries(
      Object.entries(validatedFields.data).filter(([_, value]) => value !== undefined)
    )

    const application = await dbQueries.updateApplication(applicationId, session.organizationId, updates)

    revalidatePath('/settings')
    
    return {
      success: true,
      data: application,
    }
  } catch (error: any) {
    console.error('Update application error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update application',
    }
  }
}

export async function deleteApplication(applicationId: string): Promise<ServerActionResponse> {
  try {
    const session = await SessionManager.requirePermission('settings:write')
    
    await dbQueries.deleteApplication(applicationId, session.organizationId)

    revalidatePath('/settings')
    
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Delete application error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete application',
    }
  }
}