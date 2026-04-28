import React, { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "student" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => UserRole | null; // <-- Updated signature
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Mock secure backend store
  const MOCK_USERS = [
    {
      email: "admin@university.edu",
      password: "SecurePassword123!",
      role: "admin",
      name: "Admin User",
      id: "ADM-001",
    },
    {
      email: "student@university.edu",
      password: "StudentPassword123!",
      role: "student",
      name: "John Doe",
      id: "STU-001",
    },
  ];

  const login = (email: string, password: string): UserRole | null => {
    // Validate credentials against the "backend" store
    const foundUser = MOCK_USERS.find(
      (u) => u.email === email && u.password === password,
    );

    if (foundUser) {
      setUser({
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role as UserRole,
      });
      return foundUser.role as UserRole;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
