"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAppStore } from "@/lib/data/store";
import type { StaffRole } from "@/lib/data/staff";

export type { StaffRole } from "@/lib/data/staff";

export type UserRole =
  | "super_admin"
  | "manager"
  | "registration"
  | "cash_point"
  | "vitals"
  | "doctor"
  | "injection_room"
  | "lab"
  | "pharmacist"
  | "hmo_desk"
  | "hmo_admin"
  | "records_officer";

export interface User {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getStaffByUsername } = useAppStore();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call to your backend
      // For demo purposes, we'll simulate a successful login with mock data

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get staff data from the store
      const staffMember = getStaffByUsername(username);

      if (!staffMember) {
        throw new Error("Invalid username or password");
      }

      // Check if the user is active
      if (staffMember.status !== "active") {
        throw new Error(
          "Your account is inactive. Please contact an administrator."
        );
      }

      // Create user object from staff data
      const userObj: User = {
        id: staffMember.id,
        name: staffMember.name,
        username: staffMember.username,
        role: staffMember.role,
        email: staffMember.email,
      };

      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
    } catch (error) {
      // Re-throw the error to be caught by the login form
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
