"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Moon, Sun, X, Sparkles, User, Check, BookmarkCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/context/UserContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  const { currentUser, availableUsers, switchUser, trackedSkillsCount } = useUser();

  useEffect(() => { 
    setMounted(true); 
  }, []);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      switchUser(emailInput.trim());
    } else {
      switchUser(currentUser.email);
    }
    setShowAuthModal(false);
    setEmailInput("");
    setPasswordInput("");
  };

  return (
    <>
      <div className="sticky top-4 z-50 flex justify-center px-4 pointer-events-none mb-8">
        <nav className="w-full max-w-[1250px] pointer-events-auto glass rounded-full py-3 px-6 flex justify-between items-center shadow-lg hover:shadow-xl transition-all duration-300">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">ResumePro</span>
          </Link>
        
        <div className="hidden lg:flex items-center gap-5">
          <Link href="/dashboard" className="text-sm font-bold text-foreground hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/templates" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
          <Link href="/tools/ats-score" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">ATS Check</Link>
          <Link href="/tools/cover-letter" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Cover Letters</Link>
          <Link href="/tools/mock-interview" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Interviews</Link>
          <Link href="/tools/skill-gap" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Skill Gap</Link>
          <Link href="/tools/skill-tracker" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1.5 relative">
            <BookmarkCheck className="w-4 h-4" />
            <span>Skill Tracker</span>
            {trackedSkillsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-indigo-600 text-white rounded-full">
                {trackedSkillsCount}
              </span>
            )}
          </Link>
          <Link href="/tools/linkedin-optimizer" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">LinkedIn</Link>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* User Profile Pill / Switcher */}
          <button 
            onClick={() => {
              setEmailInput(currentUser.email);
              setShowAuthModal(true);
            }}
            className="flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all text-xs font-semibold text-foreground group"
            title="Click to switch or manage active user profile"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight max-w-[100px] truncate">{currentUser.name}</span>
              <span className="text-[9px] text-muted-foreground leading-none">Switch User</span>
            </div>
          </button>
        </div>
      </nav>
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass w-full max-w-md rounded-[2rem] border border-white/20 dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 bg-black/5 dark:bg-white/5 border-b border-border/50">
                <div className="flex gap-2">
                  <button onClick={() => setShowAuthModal(false)} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center group">
                    <X className="w-2.5 h-2.5 text-red-900 opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User Profile Session</span>
              </div>

              <div className="p-8 pt-18">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground mb-1">
                    {authMode === "login" ? "User Profile & Session" : "Create New User Profile"}
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground">
                    Switch profiles to see how each user gets an isolated, personalized skill tracker.
                  </p>
                </div>

                {/* Quick Switch Existing Users */}
                {availableUsers && availableUsers.length > 0 && (
                  <div className="mb-6">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Quick Switch Profile
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableUsers.map((u) => {
                        const isSelected = currentUser.userId === u || currentUser.email === u;
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              switchUser(u);
                              setShowAuthModal(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isSelected 
                                ? "bg-indigo-600 text-white shadow-sm" 
                                : "bg-card hover:bg-muted text-foreground border border-border"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{u}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Or Sign In As Custom User / Email
                    </label>
                    <input 
                      type="email" 
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. yourname@company.com"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <input 
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Password (optional for demo session)"
                      className="w-full bg-background border border-border rounded-xl p-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.01] transition-all"
                  >
                    Activate Profile Session
                  </button>
                </form>

                <p className="mt-6 text-center text-xs font-medium text-muted-foreground">
                  {authMode === "login" ? "Want a fresh test account? " : "Already have a profile? "}
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                    className="text-indigo-500 font-bold hover:underline"
                  >
                    {authMode === "login" ? "Create new" : "Sign in"}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
