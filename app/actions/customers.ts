'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SessionManager } from '@/lib/stytch/session'
import { dbQueries } from '@/lib/cosmos/queries'
import { Customer, ServerActionResponse } from '@/types'

export async function createCustomer(formData: FormData): Promise<void> {
  try {
    const session = await SessionManager.requirePermission('customers:write')
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string

    if (!name?.trim()) {
      throw new Error('Name is required')
    }

    if (!email?.trim()) {
      throw new Error('Email is required')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address')
    }

    const newCustomer = await dbQueries.createCustomer({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      company: company?.trim() || undefined,
      organizationId: session.organizationId,
      metadata: {},
    })

    revalidatePath('/customers')
    redirect(`/customers/${newCustomer.id}`)
  } catch (error) {
    console.error('Failed to create customer:', error)
    throw error
  }
}

export async function updateCustomer(
  customerId: string,
  formData: FormData
): Promise<void> {
  try {
    const session = await SessionManager.requirePermission('customers:write')
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const company = formData.get('company') as string

    if (!name?.trim()) {
      throw new Error('Name is required')
    }

    if (!email?.trim()) {
      throw new Error('Email is required')
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address')
    }

    const existingCustomer = await dbQueries.getCustomerById(customerId, session.organizationId)
    if (!existingCustomer) {
      throw new Error('Customer not found')
    }

    await dbQueries.updateItem<Customer>(
      'customers',
      customerId,
      {
        ...existingCustomer,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || undefined,
        company: company?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    )

    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
  } catch (error) {
    console.error('Failed to update customer:', error)
    throw error
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const session = await SessionManager.requirePermission('customers:write')
    
    const customer = await dbQueries.getCustomerById(customerId, session.organizationId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // Check if customer has any issues
    const issues = await dbQueries.getIssues(session.organizationId, { customerId })
    if (issues.length > 0) {
      throw new Error(`Cannot delete customer with ${issues.length} existing issue(s). Please resolve or reassign the issues first.`)
    }

    await dbQueries.deleteItem('customers', customerId, session.organizationId)

    revalidatePath('/customers')
    redirect('/customers')
  } catch (error) {
    console.error('Failed to delete customer:', error)
    throw error
  }
}