import { apiRequest } from "./client";

export const salesApi = {
  list: () => apiRequest("GET", "/api/sales"),
  summary: () => apiRequest("GET", "/api/sales/summary"),
  create: (sale) => apiRequest("POST", "/api/sales", sale),
  cancel: (id) => apiRequest("PATCH", `/api/sales/${id}/cancel`),
};
