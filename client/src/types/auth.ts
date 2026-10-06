export type UserRole =
  | "employee"
  | "hr"
  | "super_admin"
  | "attendance";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  employee?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
}