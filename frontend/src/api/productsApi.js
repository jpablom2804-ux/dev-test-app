import { apiRequest } from "./client";

export const productsApi = {
  list: () => apiRequest("GET", "/api/products"),
  listDeleted: () => apiRequest("GET", "/api/products/deleted"),
  create: (product) => apiRequest("POST", "/api/products", product),
  update: (id, product) => apiRequest("PUT", `/api/products/${id}`, product),
  remove: (id) => apiRequest("DELETE", `/api/products/${id}`),
  restore: (id) => apiRequest("PATCH", `/api/products/${id}/restore`),
};
