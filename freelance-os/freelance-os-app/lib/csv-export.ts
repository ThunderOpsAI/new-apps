type ColumnDef<T> = {
  header: string;
  value: (record: T) => string | number;
};

function quoteCsv(value: string | number) {
  const strValue = String(value);
  const normalized = strValue.replace(/"/g, '""').replace(/(\r\n|\n|\r)/g, " ");
  return `"${normalized}"`;
}

export function buildCsv<T>(records: T[], columns: ColumnDef<T>[]): string {
  const header = columns.map((col) => col.header).join(",");

  const rows = records.map((record) => {
    return columns.map((col) => quoteCsv(col.value(record))).join(",");
  });

  return [header, ...rows].join("\n");
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
