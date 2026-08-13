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
      <nav className="w-full z-50 py-6 px-8 flex justify-between items-center max-w-[1400px] mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">ResumePro</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/tools/ats-score" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">ATS Optimization</Link>
          <Link href="/tools/cover-letter" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Cover Letters</Link>
          <Link href="/tools/mock-interview" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Interviews</Link>
          <Link href="/tools/skill-gap" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Skill Gap Analyzer</Link>
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
            className="text-sm font-bold bg-foreground text-background px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-md"
          >
            Download for free
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md p-8 rounded-[2rem] border border-border shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="w-6 h-6 text-background" />
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
                <button className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm shadow-md hover:bg-foreground/90 transition-colors">
                  {authMode === "login" ? "Sign In" : "Sign Up"}
                </button>
              </div>

              <p className="mt-8 text-center text-xs font-medium text-muted-foreground">
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-foreground hover:underline"
                >
                  {authMode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
