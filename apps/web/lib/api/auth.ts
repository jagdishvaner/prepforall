import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
}

export const authApi = {
  login: async (req: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/api/v1/auth/login", req);
    return data;
  },

  register: async (req: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/api/v1/auth/register", req);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/api/v1/auth/logout");
    localStorage.removeItem("access_token");
  },
};
