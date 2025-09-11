"use client";

import { useState, useEffect } from "react";
import { Modal } from "./modal";
import { Application } from "@/types";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application;
  onSubmit: (data: {
    name: string;
    description: string;
    isActive: boolean;
  }) => Promise<void>;
}

export function ApplicationModal({
  isOpen,
  onClose,
  application,
  onSubmit,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (application) {
        setFormData({
          name: application.name,
          description: application.description,
          isActive: application.isActive,
        });
      } else {
        setFormData({
          name: "",
          description: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        isActive: formData.isActive,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save application:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={application ? "Edit Application" : "Create Application"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Application name"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={isSubmitting}
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Describe what this application does..."
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              disabled={isSubmitting}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Inactive applications won&apos;t appear in issue creation forms
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
            className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : application
                ? "Update Application"
                : "Create Application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
