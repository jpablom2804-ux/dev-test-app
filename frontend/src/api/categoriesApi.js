import { apiRequest } from "./client";

export const categoriesApi = {
  list: () => apiRequest("GET", "/api/categories"),
};
