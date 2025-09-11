"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";

interface InlineAssignmentProps {
  currentAssignedUser: User | null;
  onAssign: (userId: string) => Promise<void>;
  onSearch: (email: string) => Promise<any[]>;
}

export function InlineAssignment({
  currentAssignedUser,
  onAssign,
  onSearch,
}: InlineAssignmentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  const handleAssign = async (member: any) => {
    setIsLoading(true);
    try {
      await onAssign(member.member_id);
      setIsEditing(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to assign user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);
    try {
      await onAssign("");
      setIsEditing(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to unassign user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Assigned to:</span>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[200px] rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleUnassign}
            disabled={isLoading}
            className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Unassign
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
            disabled={isLoading}
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        {/* Search Results Dropdown */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="absolute left-0 top-full z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg">
            {isSearching ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Searching...
              </div>
            ) : (
              searchResults.map((member) => (
                <button
                  key={member.member_id}
                  onClick={() => handleAssign(member)}
                  disabled={isLoading}
                  className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-100 disabled:opacity-50"
                >
                  <div className="font-medium">
                    {member.name || member.email_address}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.email_address}
                  </div>
                </button>
              ))
            )}
            {!isSearching &&
              searchResults.length === 0 &&
              searchQuery.trim().length >= 2 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No users found
                </div>
              )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group flex items-center space-x-2">
      <span className="font-medium">Assigned to:</span>
      <span className="text-gray-600">
        {currentAssignedUser ? currentAssignedUser.name : "Unassigned"}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
        title="Edit assignment"
      >
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
    </div>
  );
}
