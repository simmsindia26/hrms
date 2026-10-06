import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../lib/axios";

// =====================================================
// TYPES
// =====================================================

export type UserRole =
  | "employee"
  | "hr"
  | "attendance"
  | "super_admin";

export interface EmployeeReference {
  _id?: string;
  id?: string;

  employeeId?: string;

  name?: string;
  firstName?: string;
  lastName?: string;

  email?: string;
}

export interface AuthUser {
  _id: string;

  email: string;

  role: UserRole;

  name?: string;

  firstName?: string;

  lastName?: string;

  employee?:
    | string
    | EmployeeReference
    | null;

  isActive?: boolean;

  createdAt?: string;

  updatedAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;

  loading: boolean;

  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<AuthUser>;

  logout: () => void;

  refreshUser: () => Promise<AuthUser | null>;
}

// =====================================================
// CONTEXT
// =====================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

// =====================================================
// STORAGE
// =====================================================

const TOKEN_KEY = "sellopedia_token";

const USER_KEY = "sellopedia_user";

// =====================================================
// ROLE NORMALIZER
// =====================================================

function normalizeRole(
  value: unknown
): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const role = value
    .trim()
    .toLowerCase();

  // ---------------------------------------------------
  // EMPLOYEE
  // ---------------------------------------------------

  if (role === "employee") {
    return "employee";
  }

  // ---------------------------------------------------
  // HR
  // ---------------------------------------------------

  if (
    role === "hr" ||
    role === "human_resource" ||
    role === "human-resources" ||
    role === "human resources"
  ) {
    return "hr";
  }

  // ---------------------------------------------------
  // HRD
  // ---------------------------------------------------

  // ---------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------

  if (
    role === "attendance" ||
    role === "attendance_terminal" ||
    role === "attendance-terminal" ||
    role === "attendance terminal"
  ) {
    return "attendance";
  }

  // ---------------------------------------------------
  // SUPER ADMIN
  // ---------------------------------------------------

  if (
    role === "super_admin" ||
    role === "super-admin" ||
    role === "superadmin" ||
    role === "admin"
  ) {
    return "super_admin";
  }

  return null;
}

// =====================================================
// USER NORMALIZER
// =====================================================

function normalizeUser(
  value: any
): AuthUser | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const id =
    value._id ||
    value.id ||
    value.userId;

  const email =
    value.email ||
    value.userEmail ||
    value.mail;

  let roleValue =
    value.role ??
    value.userRole ??
    value.type;

  // Role can be an object
  if (
    roleValue &&
    typeof roleValue === "object"
  ) {
    roleValue =
      roleValue.name ||
      roleValue.code ||
      roleValue.slug ||
      roleValue.role;
  }

  const role =
    normalizeRole(roleValue);

  // A valid authenticated user MUST have:
  // _id
  // email
  // role

  if (
    !id ||
    !email ||
    !role
  ) {
    return null;
  }

  const employee =
    value.employee ??
    value.linkedEmployee ??
    null;

  return {
    _id: String(id),

    email: String(email),

    role,

    name:
      value.name ||
      value.fullName ||
      value.displayName,

    firstName:
      value.firstName,

    lastName:
      value.lastName,

    employee,

    isActive:
      value.isActive !== undefined
        ? Boolean(value.isActive)
        : true,

    createdAt:
      value.createdAt,

    updatedAt:
      value.updatedAt,
  };
}

// =====================================================
// FIND AUTHENTICATED USER
// =====================================================

function findUser(
  payload: any
): AuthUser | null {
  /*
   * IMPORTANT:
   *
   * Do NOT treat payload.data.employee
   * as the authenticated User.
   *
   * An employee profile and login User
   * are different objects.
   */

  const candidates = [
    payload?.user,

    payload?.data?.user,

    payload?.data?.account,

    payload?.data?.profile,

    payload?.data?.auth?.user,

    payload?.data?.authentication?.user,

    payload?.data?.data?.user,

    payload?.data?.result?.user,

    payload?.result?.user,

    payload?.result,

    payload?.data,
  ];

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeUser(candidate);

    if (normalized) {
      return normalized;
    }
  }

  // ===================================================
  // DEEP SEARCH
  // ===================================================

  const visited =
    new Set<object>();

  function search(
    value: any,
    depth = 0
  ): AuthUser | null {
    if (
      depth > 5 ||
      !value ||
      typeof value !== "object"
    ) {
      return null;
    }

    if (
      visited.has(value)
    ) {
      return null;
    }

    visited.add(value);

    const normalized =
      normalizeUser(value);

    if (normalized) {
      return normalized;
    }

    for (
      const key of Object.keys(value)
    ) {
      const result =
        search(
          value[key],
          depth + 1
        );

      if (result) {
        return result;
      }
    }

    return null;
  }

  return search(payload);
}

// =====================================================
// FIND TOKEN
// =====================================================

function findToken(
  payload: any
): string | null {
  const candidates = [
    payload?.token,

    payload?.accessToken,

    payload?.data?.token,

    payload?.data?.accessToken,

    payload?.data?.auth?.token,

    payload?.data?.auth?.accessToken,

    payload?.data?.authentication?.token,

    payload?.data?.authentication?.accessToken,

    payload?.data?.data?.token,

    payload?.data?.result?.token,

    payload?.result?.token,
  ];

  for (
    const token of candidates
  ) {
    if (
      typeof token === "string" &&
      token.trim()
    ) {
      return token;
    }
  }

  const visited =
    new Set<object>();

  function search(
    value: any,
    depth = 0
  ): string | null {
    if (
      depth > 5 ||
      !value ||
      typeof value !== "object"
    ) {
      return null;
    }

    if (
      visited.has(value)
    ) {
      return null;
    }

    visited.add(value);

    for (
      const key of Object.keys(value)
    ) {
      const current =
        value[key];

      if (
        (
          key === "token" ||
          key === "accessToken" ||
          key === "access_token"
        ) &&
        typeof current === "string" &&
        current.trim()
      ) {
        return current;
      }

      const result =
        search(
          current,
          depth + 1
        );

      if (result) {
        return result;
      }
    }

    return null;
  }

  return search(payload);
}

// =====================================================
// STORED USER
// =====================================================

function getStoredUser():
  | AuthUser
  | null {
  try {
    const raw =
      localStorage.getItem(
        USER_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    return normalizeUser(
      parsed
    );
  } catch {
    return null;
  }
}

// =====================================================
// SAVE AUTH
// =====================================================

function saveAuth(
  token: string,
  user: AuthUser
) {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
}

// =====================================================
// CLEAR AUTH
// =====================================================

function clearAuth() {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

// =====================================================
// PROVIDER
// =====================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState<AuthUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // RESTORE SESSION
  // ===================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const token =
          localStorage.getItem(
            TOKEN_KEY
          );

        if (!token) {
          if (mounted) {
            setUser(null);
          }

          return;
        }

        // ---------------------------------------------
        // RESTORE STORED USER FIRST
        // ---------------------------------------------

        const storedUser =
          getStoredUser();

        if (
          storedUser &&
          mounted
        ) {
          console.log(
            "RESTORED STORED USER:",
            storedUser
          );

          console.log(
            "RESTORED ROLE:",
            storedUser.role
          );

          setUser(
            storedUser
          );
        }

        // ---------------------------------------------
        // NO STORED USER
        // ---------------------------------------------

        if (!storedUser) {
          try {
            const response =
              await api.get(
                "/auth/me"
              );

            const serverUser =
              findUser(
                response.data
              );

            if (
              serverUser &&
              mounted
            ) {
              console.log(
                "RESTORED SERVER USER:",
                serverUser
              );

              setUser(
                serverUser
              );

              localStorage.setItem(
                USER_KEY,
                JSON.stringify(
                  serverUser
                )
              );
            }
          } catch (error) {
            console.warn(
              "Auth /me restore failed:",
              error
            );
          }

          return;
        }

        // ---------------------------------------------
        // VERIFY SERVER SESSION
        // ---------------------------------------------

        try {
          const response =
            await api.get(
              "/auth/me"
            );

          const serverUser =
            findUser(
              response.data
            );

          if (!serverUser) {
            console.warn(
              "/auth/me did not return a valid authenticated user. Keeping stored user."
            );

            return;
          }

          /*
           * IMPORTANT:
           *
           * Do not allow a valid local role
           * to suddenly disappear.
           */

          if (
            storedUser.role ===
              "attendance" &&
            serverUser.role !==
              "attendance"
          ) {
            console.warn(
              "Prevented attendance role from being changed during session restore.",
              {
                storedRole:
                  storedUser.role,
                serverRole:
                  serverUser.role,
              }
            );

            if (mounted) {
              setUser(
                storedUser
              );
            }

            return;
          }

          if (
            storedUser.role ===
              "employee" &&
            serverUser.role !==
              "employee"
          ) {
            console.warn(
              "Prevented employee role from being changed during session restore.",
              {
                storedRole:
                  storedUser.role,
                serverRole:
                  serverUser.role,
              }
            );

            if (mounted) {
              setUser(
                storedUser
              );
            }

            return;
          }

          if (mounted) {
            setUser(
              serverUser
            );

            localStorage.setItem(
              USER_KEY,
              JSON.stringify(
                serverUser
              )
            );
          }
        } catch (error) {
          console.warn(
            "Auth refresh failed. Keeping stored session:",
            error
          );
        }
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // LOGIN
  // ===================================================

  const login =
    useCallback(
      async (
        email: string,
        password: string
      ): Promise<AuthUser> => {
        try {
          setLoading(true);

          const response =
            await api.post(
              "/auth/login",
              {
                email:
                  email.trim(),
                password,
              }
            );

          const payload =
            response.data;

          console.log(
            "LOGIN RESPONSE:",
            payload
          );

          const token =
            findToken(
              payload
            );

          const loggedUser =
            findUser(
              payload
            );

          console.log(
            "LOGIN TOKEN FOUND:",
            Boolean(token)
          );

          console.log(
            "LOGIN USER FOUND:",
            loggedUser
          );

          let finalUser =
            loggedUser;

          // =================================================
          // JWT FALLBACK
          // =================================================

          if (
            !finalUser &&
            token
          ) {
            try {
              const parts =
                token.split(".");

              if (
                parts.length === 3
              ) {
                const base64 =
                  parts[1]
                    .replace(
                      /-/g,
                      "+"
                    )
                    .replace(
                      /_/g,
                      "/"
                    );

                const decoded =
                  JSON.parse(
                    atob(base64)
                  );

                finalUser =
                  normalizeUser(
                    decoded
                  );

                console.log(
                  "USER FROM JWT:",
                  finalUser
                );
              }
            } catch (error) {
              console.warn(
                "JWT decode failed:",
                error
              );
            }
          }

          // =================================================
          // TOKEN VALIDATION
          // =================================================

          if (!token) {
            throw new Error(
              "Login successful but authentication token was not returned."
            );
          }

          // =================================================
          // USER VALIDATION
          // =================================================

          if (!finalUser) {
            console.error(
              "FULL LOGIN RESPONSE:",
              JSON.stringify(
                payload,
                null,
                2
              )
            );

            throw new Error(
              "Login successful but user information was not returned correctly."
            );
          }

          // =================================================
          // SAVE AUTH
          // =================================================

          saveAuth(
            token,
            finalUser
          );

          setUser(
            finalUser
          );

          console.log(
            "LOGIN SUCCESS:",
            finalUser
          );

          console.log(
            "LOGIN SUCCESS ROLE:",
            finalUser.role
          );

          return finalUser;
        } catch (error: any) {
          console.error(
            "LOGIN ERROR:",
            error
          );

          throw new Error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Login failed."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  // ===================================================
  // REFRESH USER
  // ===================================================

  const refreshUser =
    useCallback(
      async (): Promise<
        AuthUser | null
      > => {
        try {
          const token =
            localStorage.getItem(
              TOKEN_KEY
            );

          if (!token) {
            setUser(null);

            return null;
          }

          const response =
            await api.get(
              "/auth/me"
            );

          const refreshedUser =
            findUser(
              response.data
            );

          if (!refreshedUser) {
            console.warn(
              "Invalid /auth/me response:",
              response.data
            );

            return user;
          }

          // ---------------------------------------------
          // PROTECT EMPLOYEE ROLE
          // ---------------------------------------------

          if (
            user?.role ===
              "employee" &&
            refreshedUser.role !==
              "employee"
          ) {
            console.warn(
              "Prevented employee role from changing during refresh."
            );

            return user;
          }

          // ---------------------------------------------
          // PROTECT ATTENDANCE ROLE
          // ---------------------------------------------

          if (
            user?.role ===
              "attendance" &&
            refreshedUser.role !==
              "attendance"
          ) {
            console.warn(
              "Prevented attendance role from changing during refresh."
            );

            return user;
          }

          setUser(
            refreshedUser
          );

          localStorage.setItem(
            USER_KEY,
            JSON.stringify(
              refreshedUser
            )
          );

          return refreshedUser;
        } catch (error) {
          console.error(
            "Failed to refresh user:",
            error
          );

          return user;
        }
      },
      [user]
    );

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout =
    useCallback(() => {
      clearAuth();

      setUser(null);

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }, [navigate]);

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value: AuthContextType = {
    user,

    loading,

    isAuthenticated:
      Boolean(user),

    login,

    logout,

    refreshUser,
  };

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;