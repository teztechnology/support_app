"use client";

import { useState } from "react";
import { BugReport } from "@/lib/claude/client";

interface BugReportPreviewProps {
  bugReport: BugReport;
  onSave: (editedReport: BugReport) => void;
  onCancel: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function BugReportPreview({
  bugReport,
  onSave,
  onCancel,
  onRegenerate,
  isRegenerating = false,
}: BugReportPreviewProps) {
  const [editedReport, setEditedReport] = useState<BugReport>(bugReport);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(editedReport);
  };

  const handleFieldChange = (field: keyof BugReport, value: any) => {
    setEditedReport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStepsChange = (index: number, value: string) => {
    const newSteps = [...editedReport.stepsToReproduce];
    newSteps[index] = value;
    setEditedReport((prev) => ({
      ...prev,
      stepsToReproduce: newSteps,
    }));
  };

  const addStep = () => {
    setEditedReport((prev) => ({
      ...prev,
      stepsToReproduce: [...prev.stepsToReproduce, ""],
    }));
  };

  const removeStep = (index: number) => {
    setEditedReport((prev) => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              AI-Generated Bug Report
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isEditing ? "View" : "Edit"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Summary */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Summary
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedReport.summary}
                  onChange={(e) => handleFieldChange("summary", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-sm text-gray-900">
                    {editedReport.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editedReport.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  rows={4}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-900">
                    {editedReport.description}
                  </p>
                </div>
              )}
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Steps to Reproduce
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {editedReport.stepsToReproduce.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-8 text-sm text-gray-500">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) =>
                          handleStepsChange(index, e.target.value)
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeStep(index)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Step
                  </button>
                </div>
              ) : (
                <div className="rounded-md bg-gray-50 p-3">
                  <ol className="space-y-1 text-sm text-gray-900">
                    {editedReport.stepsToReproduce.map((step, index) => (
                      <li key={index} className="flex">
                        <span className="mr-2">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Expected vs Actual Behavior */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Expected Behavior
                </label>
                {isEditing ? (
                  <textarea
                    value={editedReport.expectedBehavior}
                    onChange={(e) =>
                      handleFieldChange("expectedBehavior", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-sm text-gray-900">
                      {editedReport.expectedBehavior}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Actual Behavior
                </label>
                {isEditing ? (
                  <textarea
                    value={editedReport.actualBehavior}
                    onChange={(e) =>
                      handleFieldChange("actualBehavior", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-sm text-gray-900">
                      {editedReport.actualBehavior}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Impact */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Impact Level
              </label>
              {isEditing ? (
                <select
                  value={editedReport.impact}
                  onChange={(e) =>
                    handleFieldChange(
                      "impact",
                      e.target.value as BugReport["impact"]
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <div className="rounded-md bg-gray-50 p-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      editedReport.impact === "critical"
                        ? "bg-red-100 text-red-800"
                        : editedReport.impact === "high"
                          ? "bg-orange-100 text-orange-800"
                          : editedReport.impact === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                    }`}
                  >
                    {editedReport.impact.charAt(0).toUpperCase() +
                      editedReport.impact.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Technical Notes */}
            {editedReport.technicalNotes && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Technical Notes
                </label>
                {isEditing ? (
                  <textarea
                    value={editedReport.technicalNotes}
                    onChange={(e) =>
                      handleFieldChange("technicalNotes", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                      {editedReport.technicalNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
            <button
              onClick={onCancel}
              className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Create Jira Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
