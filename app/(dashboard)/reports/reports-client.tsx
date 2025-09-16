"use client";

import { useState } from "react";
import { Issue, Customer, Application, Category } from "@/types";
import { DateRangeSelector } from "@/components/date-range-selector";
import { OverviewReport } from "@/components/reports/overview-report";
import { IssuesList } from "@/components/reports/issues-list";
import { exportToCSV } from "@/lib/csv-export";

interface ReportsClientProps {
  issues: Issue[];
  customers: Customer[];
  applications: Application[];
  categories: Category[];
}

type ReportType = "overview" | "list";

export function ReportsClient({
  issues,
  customers,
  applications,
  categories,
}: ReportsClientProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("overview");
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    end: new Date().toISOString().split("T")[0], // today
  });
  const [sortBy, setSortBy] = useState<keyof Issue>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<
    "none" | "applicationId" | "priority" | "customerId" | "category"
  >("none");

  // Filter issues by date range and category
  const filteredIssues = issues.filter((issue) => {
    const issueDate = new Date(issue.createdAt).toISOString().split("T")[0];
    const dateMatch =
      issueDate >= dateRange.start && issueDate <= dateRange.end;

    if (selectedCategory === "all") return dateMatch;
    if (selectedCategory === "uncategorized")
      return dateMatch && !issue.category;
    return dateMatch && issue.category === selectedCategory;
  });

  const reportTabs = [
    { key: "overview", label: "Overview", icon: "📊", isDashboard: true },
    { key: "list", label: "Issues List", icon: "📋", isDashboard: false },
  ];

  const handleExportCSV = () => {
    const reportData = generateReportData(selectedReport, filteredIssues);
    const filename = `${selectedReport}-report-${dateRange.start}-to-${dateRange.end}.csv`;
    exportToCSV(reportData, filename);
  };

  const generateReportData = (reportType: ReportType, issues: Issue[]) => {
    // For list reports, export the actual issues
    if (reportType !== "overview") {
      return generateIssueListData(issues);
    }
    // For overview, export summary data
    return generateOverviewData(issues);
  };

  const generateIssueListData = (issues: Issue[]) => {
    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Customer",
      "Application",
      "Category",
      "Created",
      "Resolved",
      "Assigned To",
    ];

    const rows = issues.map((issue) => [
      issue.id,
      issue.title,
      issue.status,
      issue.priority,
      getCustomerName(issue.customerId),
      getApplicationName(issue.applicationId),
      issue.category || "N/A",
      new Date(issue.createdAt).toLocaleDateString(),
      issue.resolvedAt
        ? new Date(issue.resolvedAt).toLocaleDateString()
        : "N/A",
      getUserName(issue.assignedToId) || "Unassigned",
    ]);

    return [headers, ...rows];
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.companyName || customerId;
  };

  const getApplicationName = (applicationId?: string) => {
    if (!applicationId) return "N/A";
    const application = applications.find((a) => a.id === applicationId);
    return application?.name || applicationId;
  };

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    // This would need to be passed from the parent component
    return userId; // Placeholder
  };

  const generateOverviewData = (issues: Issue[]) => [
    ["Metric", "Value"],
    ["Total Issues", issues.length.toString()],
    [
      "Open Issues",
      issues
        .filter((i) => !["resolved", "closed"].includes(i.status))
        .length.toString(),
    ],
    [
      "Resolved Issues",
      issues.filter((i) => i.status === "resolved").length.toString(),
    ],
    [
      "Critical Issues",
      issues.filter((i) => i.priority === "critical").length.toString(),
    ],
    [
      "High Priority Issues",
      issues.filter((i) => i.priority === "high").length.toString(),
    ],
    [
      "Average Resolution Time (hours)",
      calculateAverageResolutionTime(issues).toString(),
    ],
  ];

  const generateApplicationData = (issues: Issue[]) => {
    const appData = applications.map((app) => {
      const appIssues = issues.filter((i) => i.applicationId === app.id);
      return [
        app.name,
        appIssues.length.toString(),
        appIssues
          .filter((i) => !["resolved", "closed"].includes(i.status))
          .length.toString(),
        appIssues.filter((i) => i.status === "resolved").length.toString(),
        appIssues.filter((i) => i.priority === "critical").length.toString(),
      ];
    });

    return [
      [
        "Application",
        "Total Issues",
        "Open Issues",
        "Resolved Issues",
        "Critical Issues",
      ],
      ...appData,
    ];
  };

  const generatePriorityData = (issues: Issue[]) => {
    const priorities = ["critical", "high", "medium", "low"];
    const priorityData = priorities.map((priority) => {
      const priorityIssues = issues.filter((i) => i.priority === priority);
      return [
        priority.charAt(0).toUpperCase() + priority.slice(1),
        priorityIssues.length.toString(),
        priorityIssues
          .filter((i) => !["resolved", "closed"].includes(i.status))
          .length.toString(),
        priorityIssues.filter((i) => i.status === "resolved").length.toString(),
        calculateAverageResolutionTime(
          priorityIssues.filter((i) => i.status === "resolved")
        ).toString(),
      ];
    });

    return [
      [
        "Priority",
        "Total Issues",
        "Open Issues",
        "Resolved Issues",
        "Avg Resolution Time (hours)",
      ],
      ...priorityData,
    ];
  };

  const generateCustomerData = (issues: Issue[]) => {
    const customerData = customers.map((customer) => {
      const customerIssues = issues.filter((i) => i.customerId === customer.id);
      return [
        customer.companyName,
        customerIssues.length.toString(),
        customerIssues
          .filter((i) => !["resolved", "closed"].includes(i.status))
          .length.toString(),
        customerIssues.filter((i) => i.status === "resolved").length.toString(),
        customerIssues
          .filter((i) => i.priority === "critical")
          .length.toString(),
      ];
    });

    return [
      [
        "Customer",
        "Total Issues",
        "Open Issues",
        "Resolved Issues",
        "Critical Issues",
      ],
      ...customerData,
    ];
  };

  const calculateAverageResolutionTime = (resolvedIssues: Issue[]) => {
    const issuesWithResolutionTime = resolvedIssues.filter(
      (i) => i.resolvedAt && i.createdAt
    );
    if (issuesWithResolutionTime.length === 0) return 0;

    const totalTime = issuesWithResolutionTime.reduce((acc, issue) => {
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt!).getTime();
      return acc + (resolved - created);
    }, 0);

    return Math.round(
      totalTime / issuesWithResolutionTime.length / (1000 * 60 * 60)
    ); // Convert to hours
  };

  // Sort and filter issues for list views
  const getSortedIssues = () => {
    const sorted = [...filteredIssues].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc"
        ? (aVal as any) - (bVal as any)
        : (bVal as any) - (aVal as any);
    });

    return sorted;
  };

  const renderReport = () => {
    switch (selectedReport) {
      case "overview":
        return (
          <OverviewReport
            issues={filteredIssues}
            customers={customers}
            applications={applications}
          />
        );
      case "list":
        return (
          <IssuesList
            issues={getSortedIssues()}
            customers={customers}
            applications={applications}
            categories={categories}
            groupBy={groupBy}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        {selectedReport !== "overview" && (
          <button
            onClick={handleExportCSV}
            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            Export to CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <p className="text-sm text-gray-600">
            Select date range, category filter, and grouping options for your
            report
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <DateRangeSelector
              startDate={dateRange.start}
              endDate={dateRange.end}
              onDateRangeChange={setDateRange}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-filter"
                className="block text-sm font-medium text-gray-700"
              >
                Category Filter
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="group-by"
                className="block text-sm font-medium text-gray-700"
              >
                Group By
              </label>
              <select
                id="group-by"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="none">No Grouping</option>
                <option value="applicationId">Application</option>
                <option value="priority">Priority</option>
                <option value="customerId">Customer</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedReport(tab.key as ReportType)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-2 text-sm font-medium ${
                selectedReport === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      <div className="rounded-lg bg-white shadow">{renderReport()}</div>

      {/* Report Summary */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            Report Period:
          </span>
          <span className="text-sm text-blue-700">
            {new Date(dateRange.start).toLocaleDateString()} -{" "}
            {new Date(dateRange.end).toLocaleDateString()}
          </span>
          <span className="text-sm text-blue-700">
            ({filteredIssues.length} issues in range)
          </span>
        </div>
      </div>
    </div>
  );
}
