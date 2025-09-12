"use client";

import { useState } from "react";
import { diagnoseJiraSetup, listJiraProjects } from "@/lib/jira/diagnostic";

export function JiraDiagnostic() {
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [projects, setProjects] = useState<any>(null);
  const [projectKey, setProjectKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!projectKey.trim()) {
      alert("Please enter a project key");
      return;
    }

    setLoading(true);
    try {
      const result = await diagnoseJiraSetup(projectKey.trim().toUpperCase());
      setDiagnosis(result);
    } catch (error) {
      console.error("Diagnosis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleListProjects = async () => {
    setLoading(true);
    try {
      const result = await listJiraProjects();
      setProjects(result);
    } catch (error) {
      console.error("Failed to list projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg bg-gray-50 p-6">
      <h3 className="text-lg font-semibold">Jira Configuration Diagnostic</h3>

      <div className="space-y-4">
        <div>
          <button
            onClick={handleListProjects}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "List Available Projects"}
          </button>
        </div>

        {projects && (
          <div className="rounded border bg-white p-4">
            <h4 className="mb-2 font-medium">Available Projects:</h4>
            {projects.success ? (
              <ul className="space-y-1">
                {projects.projects.map((project: any) => (
                  <li key={project.key} className="text-sm">
                    <strong>{project.key}</strong>: {project.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-600">Error: {projects.error}</p>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <input
            type="text"
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)}
            placeholder="Enter project key (e.g., PROJ)"
            className="flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleDiagnose}
            disabled={loading}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Project Access"}
          </button>
        </div>

        {diagnosis && (
          <div className="rounded border bg-white p-4">
            <h4 className="mb-2 font-medium">Diagnosis Results:</h4>
            {diagnosis.success ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span
                    className={`h-3 w-3 rounded-full ${diagnosis.diagnosis.canConnect ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>
                    Connection:{" "}
                    {diagnosis.diagnosis.canConnect ? "Success" : "Failed"}
                  </span>
                </div>

                {diagnosis.diagnosis.userInfo && (
                  <div>
                    <strong>User:</strong>{" "}
                    {diagnosis.diagnosis.userInfo.displayName} (
                    {diagnosis.diagnosis.userInfo.emailAddress})
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span
                    className={`h-3 w-3 rounded-full ${diagnosis.diagnosis.hasProjectAccess ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>
                    Project Access ({projectKey}):{" "}
                    {diagnosis.diagnosis.hasProjectAccess ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`h-3 w-3 rounded-full ${diagnosis.diagnosis.canCreateIssues ? "bg-green-500" : "bg-red-500"}`}
                  ></span>
                  <span>
                    Can Create Issues:{" "}
                    {diagnosis.diagnosis.canCreateIssues ? "Yes" : "No"}
                  </span>
                </div>

                {diagnosis.diagnosis.availableIssueTypes && (
                  <div>
                    <strong>Available Issue Types:</strong>
                    <ul className="ml-4 list-disc">
                      {diagnosis.diagnosis.availableIssueTypes.map(
                        (type: any) => (
                          <li key={type.id}>
                            {type.name} (ID: {type.id})
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {diagnosis.diagnosis.availableProjects && (
                  <div>
                    <strong>Your Accessible Projects:</strong>
                    <ul className="ml-4 list-disc">
                      {diagnosis.diagnosis.availableProjects.map(
                        (project: string, index: number) => (
                          <li key={index}>{project}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {diagnosis.diagnosis.error && (
                  <div className="text-red-600">
                    <strong>Error:</strong> {diagnosis.diagnosis.error}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">Error: {diagnosis.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
