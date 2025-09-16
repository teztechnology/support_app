export function exportToCSV(data: string[][], filename: string) {
  // Convert 2D array to CSV string
  const csvContent = data
    .map((row) =>
      row
        .map((cell) => {
          // Handle cells that contain commas, quotes, or newlines
          if (
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
          ) {
            // Escape quotes by doubling them and wrap in quotes
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");

  // Add BOM for proper UTF-8 encoding in Excel
  const bom = "\uFEFF";
  const csvWithBom = bom + csvContent;

  // Create blob and download
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function formatDateForCSV(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export function escapeCSVField(
  field: string | number | null | undefined
): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
