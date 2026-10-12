import { apiRequest } from "./client";

export const authApi = {
  me: () => apiRequest("GET", "/api/auth/me"),
  login: ({ username, password }) => apiRequest("POST", "/api/auth/login", { username, password }),
  logout: () => apiRequest("POST", "/api/auth/logout"),
};
