"use client";

import {
  createApplication,
  createCategory,
  deleteApplication,
  deleteCategory,
  updateApplication,
  updateCategory,
} from "@/app/actions/settings";
import {
  addUserToDatabase,
  removeUserFromDatabase,
  searchStytchMembers,
  toggleUserActivation,
  updateUserRole,
} from "@/app/actions/users";
import { ApplicationModal } from "@/components/application-modal";
import { CategoryModal } from "@/components/category-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Application, Category, User, UserRole } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface SettingsClientProps {
  categories: Category[];
  applications: Application[];
  databaseUsers: User[];
  userRole: UserRole;
  stytchOrganizationId: string;
}

type SettingsTab = "applications" | "users";

export function SettingsClient({
  categories,
  applications,
  databaseUsers,
  userRole,
  stytchOrganizationId,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("applications");
  const [categoriesState, setCategoriesState] = useState(categories);
  const [applicationsState, setApplicationsState] =
    useState<Application[]>(applications);
  const [databaseUsersState, setDatabaseUsersState] =
    useState<User[]>(databaseUsers);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [editingApplication, setEditingApplication] = useState<
    Application | undefined
  >();
  const [selectedApplicationForCategory, setSelectedApplicationForCategory] =
    useState<string | undefined>();

  const tabs = [
    { id: "applications" as const, label: "Applications", adminOnly: false },
    { id: "users" as const, label: "Users", adminOnly: true },
  ];

  const visibleTabs = tabs.filter(
    (tab) => !tab.adminOnly || userRole === "admin"
  );

  // Category handlers
  const handleCreateCategory = async (data: {
    name: string;
    description: string;
    color?: string;
    isActive: boolean;
  }) => {
    if (!selectedApplicationForCategory) return;

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("applicationId", selectedApplicationForCategory);
      if (data.color) formData.append("color", data.color);
      formData.append("isActive", data.isActive.toString());

      const result = await createCategory(null, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to create category");
      }

      setCategoriesState((prev) => [result.data!, ...prev]);
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error;
    }
  };

  const handleUpdateCategory = async (data: {
    name: string;
    description: string;
    color?: string;
    isActive: boolean;
  }) => {
    if (!editingCategory) return;

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("applicationId", editingCategory.applicationId);
      if (data.color) formData.append("color", data.color);
      formData.append("isActive", data.isActive.toString());

      const result = await updateCategory(editingCategory.id, null, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }

      setCategoriesState((prev) =>
        prev.map((c) => (c.id === result.data!.id ? result.data! : c))
      );
    } catch (error) {
      console.error("Failed to update category:", error);
      throw error;
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete category");
      }

      setCategoriesState((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(undefined);
    setSelectedApplicationForCategory(undefined);
  };

  const openCreateCategoryModal = (applicationId: string) => {
    setSelectedApplicationForCategory(applicationId);
    setEditingCategory(undefined);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setSelectedApplicationForCategory(category.applicationId);
    setIsCategoryModalOpen(true);
  };

  // Application handlers
  const handleCreateApplication = async (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("isActive", data.isActive.toString());

      const result = await createApplication(null, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to create application");
      }

      setApplicationsState((prev) => [result.data!, ...prev]);
    } catch (error) {
      console.error("Failed to create application:", error);
      throw error;
    }
  };

  const handleUpdateApplication = async (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => {
    if (!editingApplication) return;

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("isActive", data.isActive.toString());

      const result = await updateApplication(
        editingApplication.id,
        null,
        formData
      );
      if (!result.success) {
        throw new Error(result.error || "Failed to update application");
      }

      setApplicationsState((prev) =>
        prev.map((a) => (a.id === result.data!.id ? result.data! : a))
      );
    } catch (error) {
      console.error("Failed to update application:", error);
      throw error;
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this application? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const result = await deleteApplication(applicationId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete application");
      }

      setApplicationsState((prev) =>
        prev.filter((a) => a.id !== applicationId)
      );
    } catch (error) {
      console.error("Failed to delete application:", error);
      alert("Failed to delete application. Please try again.");
    }
  };

  const openCreateApplicationModal = () => {
    setEditingApplication(undefined);
    setIsApplicationModalOpen(true);
  };

  const openEditApplicationModal = (application: Application) => {
    setEditingApplication(application);
    setIsApplicationModalOpen(true);
  };

  const closeApplicationModal = () => {
    setIsApplicationModalOpen(false);
    setEditingApplication(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "applications" && (
          <ApplicationsSection
            applications={applicationsState}
            categories={categoriesState}
            onAdd={openCreateApplicationModal}
            onEdit={openEditApplicationModal}
            onDelete={handleDeleteApplication}
            onAddCategory={openCreateCategoryModal}
            onEditCategory={openEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
        {activeTab === "users" && userRole === "admin" && (
          <UsersSection
            databaseUsers={databaseUsersState}
            stytchOrganizationId={stytchOrganizationId}
            onUserAdded={(user) =>
              setDatabaseUsersState((prev) => [...prev, user])
            }
            onUserUpdated={(updatedUser) =>
              setDatabaseUsersState((prev) =>
                prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
              )
            }
            onUserRemoved={(userId) =>
              setDatabaseUsersState((prev) =>
                prev.filter((u) => u.id !== userId)
              )
            }
          />
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        category={editingCategory}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
      />

      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={closeApplicationModal}
        application={editingApplication}
        onSubmit={
          editingApplication ? handleUpdateApplication : handleCreateApplication
        }
      />
    </div>
  );
}

function ApplicationsSection({
  applications,
  categories,
  onAdd,
  onEdit,
  onDelete,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: {
  applications: Application[];
  categories: Category[];
  onAdd: () => void;
  onEdit: (application: Application) => void;
  onDelete: (applicationId: string) => void;
  onAddCategory: (applicationId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Applications & Categories</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage applications and their associated categories for issue
            tracking
          </p>
        </div>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Application
        </button>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <p>
              No applications found. Create your first application to get
              started.
            </p>
            <p className="text-sm mt-2">
              Applications help organize issues by the specific software or
              service they relate to.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const applicationCategories = categories.filter(
              (cat) => cat.applicationId === application.id
            );

            return (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">
                        {application.name}
                      </CardTitle>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          application.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {application.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEdit(application)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit App
                      </button>
                      {applicationCategories.length === 0 && (
                        <button
                          onClick={() => onDelete(application.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete App
                        </button>
                      )}
                    </div>
                  </div>
                  {application.description && (
                    <p className="text-sm text-gray-600">
                      {application.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Categories ({applicationCategories.length})
                      </h4>
                      <button
                        onClick={() => onAddCategory(application.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Add Category
                      </button>
                    </div>

                    {applicationCategories.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                        <p className="text-sm">
                          No categories for this application yet.
                        </p>
                        <button
                          onClick={() => onAddCategory(application.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm mt-1"
                        >
                          Create the first category
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {applicationCategories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                          >
                            <div className="flex items-center space-x-3">
                              {category.color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-xs text-gray-500">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  category.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                              <button
                                onClick={() => onEditCategory(category)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDeleteCategory(category.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


interface UsersSectionProps {
  databaseUsers: User[];
  stytchOrganizationId: string;
  onUserAdded: (user: User) => void;
  onUserUpdated: (user: User) => void;
  onUserRemoved: (userId: string) => void;
}

function UsersSection({
  databaseUsers,
  stytchOrganizationId,
  onUserAdded,
  onUserUpdated,
  onUserRemoved,
}: UsersSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // State to track if user was found but already added
  const [foundButExists, setFoundButExists] = useState<any>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      setIsSearching(true);
      setFoundButExists(null); // Reset the state

      try {
        const result = await searchStytchMembers(query);
        if (result.success) {
          if (result.data && result.data.length > 0) {
            // Filter out users that are already in the database
            const dbMemberIds = new Set(
              databaseUsers.map((u) => u.stytchMemberId)
            );

            const foundMember = result.data[0]; // Should only be one member from exact email search
            const availableMembers = result.data.filter(
              (member) => !dbMemberIds.has(member.member_id)
            );

            if (
              availableMembers.length === 0 &&
              dbMemberIds.has(foundMember.member_id)
            ) {
              // User was found but already exists in database
              setFoundButExists(foundMember);
              setSearchResults([]);
            } else {
              setSearchResults(availableMembers);
            }
          } else {
            setSearchResults([]);
          }
        } else {
          console.error("Search failed:", result.error);
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [databaseUsers]
  );

  // Search effect
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      handleSearch(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery, handleSearch]);

  const activeUsers = databaseUsers.filter((u) => u.isActive !== false);
  const inactiveUsers = databaseUsers.filter((u) => u.isActive === false);

  const handleAddUser = async (
    stytchMemberId: string,
    role: string = "support_agent"
  ) => {
    setIsLoading(true);
    try {
      const result = await addUserToDatabase(stytchMemberId, role);
      if (result.success && result.data) {
        onUserAdded(result.data);
      } else {
        alert("Failed to add user: " + result.error);
      }
    } catch (error) {
      alert("Failed to add user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActivation = async (userId: string) => {
    setIsLoading(true);
    try {
      const result = await toggleUserActivation(userId);
      if (result.success && result.data) {
        onUserUpdated(result.data);
      } else {
        alert("Failed to update user: " + result.error);
      }
    } catch (error) {
      alert("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (
    userId: string,
    role: string,
    permissions: string[]
  ) => {
    setIsLoading(true);
    try {
      const result = await updateUserRole(userId, role, permissions);
      if (result.success && result.data) {
        onUserUpdated(result.data);
      } else {
        alert("Failed to update user role: " + result.error);
      }
    } catch (error) {
      alert("Failed to update user role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this user? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await removeUserFromDatabase(userId);
      if (result.success) {
        onUserRemoved(userId);
      } else {
        alert("Failed to remove user: " + result.error);
      }
    } catch (error) {
      alert("Failed to remove user");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "support_agent":
        return "bg-blue-100 text-blue-800";
      case "read_only":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search for Organization Members */}
      <Card>
        <CardHeader>
          <CardTitle>Available Organization Members</CardTitle>
          <p className="text-sm text-gray-600">
            Enter the complete email address of an organization member to add
            them to the support tool
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Enter complete email address (e.g., user@company.com)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.includes("@") && (
              <div className="space-y-3">
                {searchResults.length > 0 ? (
                  searchResults.map((member) => (
                    <div
                      key={member.member_id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(member.name ||
                              member.email_address)[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.name || member.email_address}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email_address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                          defaultValue="support_agent"
                          id={`role-${member.member_id}`}
                        >
                          <option value="support_agent">Support Agent</option>
                          <option value="admin">Admin</option>
                          <option value="read_only">Read Only</option>
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById(
                              `role-${member.member_id}`
                            ) as HTMLSelectElement;
                            handleAddUser(member.member_id, select.value);
                          }}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                ) : !isSearching && foundButExists ? (
                  <div className="text-center py-6 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="font-medium">
                      User &ldquo;{foundButExists.email_address}&rdquo; found in
                      organization
                    </p>
                    <p className="text-sm mt-1">
                      This user has already been added to the support tool
                    </p>
                    <p className="text-xs mt-2 text-amber-700">
                      Check the &ldquo;Active Users&rdquo; section below
                    </p>
                  </div>
                ) : !isSearching ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No users found matching &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-sm mt-1">
                      Try searching with a different email address
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {searchQuery.length > 0 && !searchQuery.includes("@") && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Please enter a complete email address
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users ({activeUsers.length})</CardTitle>
          <p className="text-sm text-gray-600">
            Users with access to the support tool
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeUsers.map((databaseUser) => (
              <div key={databaseUser.id} className="border rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {databaseUser.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{databaseUser.name}</p>
                      <p className="text-sm text-gray-500">
                        {databaseUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                        databaseUser.role
                      )}`}
                    >
                      {databaseUser.role.replace("_", " ")}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedUser(
                          expandedUser === databaseUser.id
                            ? null
                            : databaseUser.id
                        )
                      }
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {expandedUser === databaseUser.id ? "Collapse" : "Manage"}
                    </button>
                  </div>
                </div>

                {expandedUser === databaseUser.id && (
                  <div className="border-t p-3 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          value={databaseUser.role}
                          onChange={(e) => {
                            const newPermissions = getDefaultPermissions(
                              e.target.value
                            );
                            handleUpdateRole(
                              databaseUser.id,
                              e.target.value,
                              newPermissions
                            );
                          }}
                        >
                          <option value="support_agent">Support Agent</option>
                          <option value="admin">Admin</option>
                          <option value="read_only">Read Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleToggleActivation(databaseUser.id)
                            }
                            disabled={isLoading}
                            className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleRemoveUser(databaseUser.id)}
                            disabled={isLoading}
                            className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Permissions
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {databaseUser.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {activeUsers.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p>No active users in the tool.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Users ({inactiveUsers.length})</CardTitle>
            <p className="text-sm text-gray-600">
              Users who have been deactivated but not removed
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveUsers.map((databaseUser) => (
                <div
                  key={databaseUser.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {databaseUser.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        {databaseUser.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {databaseUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                    <button
                      onClick={() => handleToggleActivation(databaseUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={() => handleRemoveUser(databaseUser.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case "admin":
      return [
        "issues:read",
        "issues:write",
        "issues:delete",
        "customers:read",
        "customers:write",
        "customers:delete",
        "settings:read",
        "settings:write",
      ];
    case "support_agent":
      return [
        "issues:read",
        "issues:write",
        "customers:read",
        "customers:write",
      ];
    case "read_only":
      return ["issues:read", "customers:read"];
    default:
      return [];
  }
}
