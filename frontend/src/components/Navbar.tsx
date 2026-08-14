"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Moon, Sun, X, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => { 
    setMounted(true); 
  }, []);

  return (
    <>
      <div className="sticky top-4 z-50 flex justify-center px-4 pointer-events-none mb-8">
        <nav className="w-full max-w-[1200px] pointer-events-auto glass rounded-full py-3 px-6 flex justify-between items-center shadow-lg hover:shadow-xl transition-all duration-300">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">ResumePro</span>
          </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-bold text-foreground hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/templates" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
          <Link href="/tools/ats-score" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">ATS Check</Link>
          <Link href="/tools/cover-letter" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Cover Letters</Link>
          <Link href="/tools/mock-interview" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Interviews</Link>
          <Link href="/tools/skill-gap" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Skill Gap</Link>
          <Link href="/tools/linkedin-optimizer" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">LinkedIn</Link>
        </div>

        <div className="flex items-center gap-4">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <button 
            onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
            className="text-sm font-bold text-foreground hover:text-muted-foreground transition-colors px-4 py-2"
          >
            Sign In
          </button>
          <button 
            onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }}
            className="text-sm font-bold bg-foreground text-background px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-md hover:shadow-lg hover:bg-foreground/90"
          >
            Download for free
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
              </div>

              <div className="p-8 pt-20">
                <div className="mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
                    {authMode === "login" ? "Welcome back" : "Create an account"}
                  </h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    {authMode === "login" ? "Sign in to access your saved resumes." : "Sign up to start optimizing your career."}
                  </p>
                </div>

              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full bg-background border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full bg-background border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all">
                  {authMode === "login" ? "Sign In" : "Sign Up"}
                </button>
              </div>

              <p className="mt-8 text-center text-xs font-medium text-muted-foreground">
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-indigo-500 font-bold hover:underline"
                >
                  {authMode === "login" ? "Sign up" : "Sign in"}
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
