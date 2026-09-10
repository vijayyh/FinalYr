"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
}

interface UserContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: string[];
  refreshUsers: () => Promise<void>;
  switchUser: (userIdOrEmail: string) => void;
  trackedSkillsCount: number;
  setTrackedSkillsCount: (count: number) => void;
  refreshTrackedCount: () => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  userId: "alex.dev@demo.com",
  name: "Alex Developer",
  email: "alex.dev@demo.com",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(DEFAULT_USER);
  const [availableUsers, setAvailableUsers] = useState<string[]>([
    "alex.dev@demo.com",
    "sarah.design@demo.com",
    "jordan.ai@demo.com",
  ]);
  const [trackedSkillsCount, setTrackedSkillsCount] = useState<number>(0);

  // Initialize from localStorage or default
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("resumepro_current_user");
      if (savedUser) {
        setCurrentUserState(JSON.parse(savedUser));
      } else {
        localStorage.setItem("resumepro_current_user", JSON.stringify(DEFAULT_USER));
      }
    } catch (e) {
      console.error("Failed to read user from localStorage", e);
    }
  }, []);

  const refreshUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tracker/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const combined = Array.from(
            new Set([...data.users, "alex.dev@demo.com", "sarah.design@demo.com", "jordan.ai@demo.com"])
          );
          setAvailableUsers(combined);
        }
      }
    } catch (e) {
      // Offline fallback
    }
  };

  const refreshTrackedCount = async () => {
    if (!currentUser?.userId) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tracker/skills?user_id=${encodeURIComponent(currentUser.userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats && typeof data.stats.total_active === "number") {
          setTrackedSkillsCount(data.stats.total_active);
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    refreshUsers();
    refreshTrackedCount();
  }, [currentUser?.userId]);

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem("resumepro_current_user", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const switchUser = (userIdOrEmail: string) => {
    const trimmed = userIdOrEmail.trim();
    if (!trimmed) return;
    
    let name = trimmed.split("@")[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    
    const newUser: UserProfile = {
      userId: trimmed,
      name: name || "User",
      email: trimmed.includes("@") ? trimmed : `${trimmed}@demo.com`,
    };

    setCurrentUser(newUser);
    if (!availableUsers.includes(trimmed)) {
      setAvailableUsers((prev) => [...prev, trimmed]);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        refreshUsers,
        switchUser,
        trackedSkillsCount,
        setTrackedSkillsCount,
        refreshTrackedCount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
