"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SessionManager } from "@/lib/stytch/session";
import { dbQueries } from "@/lib/cosmos/queries";
import { Customer, ServerActionResponse } from "@/types";

export async function createCustomer(companyName: string): Promise<Customer> {
  try {
    const session = await SessionManager.requirePermission("customers:write");

    if (!companyName?.trim()) {
      throw new Error("Company name is required");
    }

    const newCustomer = await dbQueries.createCustomer({
      companyName: companyName.trim(),
      organizationId: session.organizationId,
    });

    revalidatePath("/customers");
    return newCustomer;
  } catch (error) {
    console.error("Failed to create customer:", error);
    throw error;
  }
}

export async function updateCustomer(
  customerId: string,
  companyName: string
): Promise<Customer> {
  try {
    const session = await SessionManager.requirePermission("customers:write");

    if (!companyName?.trim()) {
      throw new Error("Company name is required");
    }

    const existingCustomer = await dbQueries.getCustomerById(
      customerId,
      session.organizationId
    );
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    const updatedCustomer = await dbQueries.updateItem<Customer>(
      "customers",
      customerId,
      {
        ...existingCustomer,
        companyName: companyName.trim(),
        updatedAt: new Date().toISOString(),
      },
      session.organizationId
    );

    revalidatePath("/customers");
    return updatedCustomer;
  } catch (error) {
    console.error("Failed to update customer:", error);
    throw error;
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  try {
    const session = await SessionManager.requirePermission("customers:write");

    const customer = await dbQueries.getCustomerById(
      customerId,
      session.organizationId
    );
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check if customer has any issues
    const issues = await dbQueries.getIssues(session.organizationId, {
      customerId,
    });
    if (issues.length > 0) {
      throw new Error(
        `Cannot delete customer with ${issues.length} existing issue(s). Please resolve or reassign the issues first.`
      );
    }

    await dbQueries.deleteItem("customers", customerId, session.organizationId);

    revalidatePath("/customers");
    redirect("/customers");
  } catch (error) {
    console.error("Failed to delete customer:", error);
    throw error;
  }
}
