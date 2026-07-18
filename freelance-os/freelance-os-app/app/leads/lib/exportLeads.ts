import { sourceLabels, statusLabels, type Lead } from "./leadDefaults";

function formatDateForCsv(value: string | null) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());

  return `${day}/${month}/${year}`;
}

function quoteCsv(value: string) {
  const normalized = value.replace(/"/g, '""').replace(/(\r\n|\n|\r)/g, " ");
  return `"${normalized}"`;
}

export function buildLeadsCsv(leads: Lead[]) {
  const header = [
    "Name",
    "Company",
    "Email",
    "Source",
    "Service",
    "Value",
    "Status",
    "Last Contacted",
    "Next Follow-Up",
    "Notes",
    "Created",
  ].join(",");

  const rows = leads.map((lead) => {
    return [
      quoteCsv(lead.name),
      quoteCsv(lead.company),
      quoteCsv(lead.email),
      quoteCsv(sourceLabels[lead.source]),
      quoteCsv(lead.service),
      String(lead.value),
      quoteCsv(statusLabels[lead.status]),
      quoteCsv(formatDateForCsv(lead.lastContacted)),
      quoteCsv(formatDateForCsv(lead.nextFollowUp)),
      quoteCsv(lead.notes),
      quoteCsv(formatDateForCsv(lead.createdAt)),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

export function downloadLeadsCsv(leads: Lead[]) {
  const csvContent = buildLeadsCsv(leads);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const fileName = `freelanceos-leads-${new Date().toISOString().slice(0, 10)}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
