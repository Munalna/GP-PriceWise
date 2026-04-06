import api from "./api";

export async function fetchDailyReport() {
  const response = await api.get("/reports/daily");
  return response.data;
}

export async function exportReportPdf() {
  const response = await api.get("/reports/export", {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "daily-pricing-report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function importSalesData(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/sales-data/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}