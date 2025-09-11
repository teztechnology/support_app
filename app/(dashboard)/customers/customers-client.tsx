"use client";

import { useState } from "react";
import Link from "next/link";
import { Customer, Category, Application, User } from "@/types";
import { CustomerModal } from "@/components/customer-modal";
import { IssueModal } from "@/components/issue-modal";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/app/actions/customers";
import { createIssue } from "@/app/actions/issues";

interface CustomersClientProps {
  initialCustomers: Customer[];
  categories: Category[];
  applications: Application[];
  users: User[];
}

export function CustomersClient({
  initialCustomers,
  categories,
  applications,
  users,
}: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<
    Customer | undefined
  >();
  const [selectedCustomerForIssue, setSelectedCustomerForIssue] = useState<
    string | undefined
  >();

  const handleCreateCustomer = async (data: { companyName: string }) => {
    try {
      const newCustomer = await createCustomer(data.companyName);
      setCustomers([newCustomer, ...customers]);
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  };

  const handleUpdateCustomer = async (data: { companyName: string }) => {
    if (!editingCustomer) return;

    try {
      const updatedCustomer = await updateCustomer(
        editingCustomer.id,
        data.companyName
      );
      setCustomers(
        customers.map((c) =>
          c.id === updatedCustomer.id ? updatedCustomer : c
        )
      );
    } catch (error) {
      console.error("Failed to update customer:", error);
      throw error;
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteCustomer(customerId);
      setCustomers(customers.filter((c) => c.id !== customerId));
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert("Failed to delete customer. Please try again.");
    }
  };

  const handleCreateIssue = async (data: {
    title: string;
    description: string;
    priority: any;
    customerId: string;
    category?: string;
    applicationId?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("priority", data.priority);
      formData.append("customerId", data.customerId);
      if (data.category) {
        formData.append("category", data.category);
      }
      if (data.applicationId) {
        formData.append("applicationId", data.applicationId);
      }

      const result = await createIssue(null, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to create issue");
      }
    } catch (error) {
      console.error("Failed to create issue:", error);
      throw error;
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(undefined);
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setEditingCustomer(undefined);
  };

  const openIssueModal = (customerId: string) => {
    setSelectedCustomerForIssue(customerId);
    setIsIssueModalOpen(true);
  };

  const closeIssueModal = () => {
    setIsIssueModalOpen(false);
    setSelectedCustomerForIssue(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={openCreateModal}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No customers found
          </h3>
          <p className="mb-4 text-gray-600">
            Get started by adding your first customer.
          </p>
          <button
            onClick={openCreateModal}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Add First Customer
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.companyName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {customer.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">
                        {customer.totalIssues}
                      </span>
                      {customer.totalIssues > 0 && (
                        <Link
                          href={`/issues?customerId=${customer.id}`}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openIssueModal(customer.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Create Issue
                      </button>
                      {customer.totalIssues === 0 && (
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={closeCustomerModal}
        customer={editingCustomer}
        onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
      />

      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={closeIssueModal}
        customers={customers}
        categories={categories}
        applications={applications}
        users={users}
        preselectedCustomerId={selectedCustomerForIssue}
        onSubmit={handleCreateIssue}
      />
    </div>
  );
}
