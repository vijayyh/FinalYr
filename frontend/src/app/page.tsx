"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, ArrowRight, Moon, Sun, X, Sparkles, Target, Zap, Layout } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

const ADVICE = [
  "Keep it under 2 pages!",
  "Start bullets with action verbs.",
  "Quantify your achievements!",
  "Tailor it to the job description.",
  "Always check for typos!"
];

export default function Home() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [adviceIndex, setAdviceIndex] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => { 
    setMounted(true); 
    
    // Splash screen timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      window.scrollTo(0, 0);
    }, 600);

    // Advice rotating timer
    const interval = setInterval(() => {
      setAdviceIndex((prev) => (prev + 1) % ADVICE.length);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(splashTimer);
    };
  }, []);

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to analyze resume");
      }

      localStorage.setItem("analysisResult", JSON.stringify(data));
      if (data.extracted_text) {
        localStorage.setItem("resumeText", data.extracted_text);
      }
      
      router.push("/analysis-report");
    } catch (err: any) {
      console.error("Error analyzing resume:", err);
      setError(err.message || "Failed to connect to the analysis engine. Is the backend running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.2, type: "spring", bounce: 0.4 }}
              className="w-24 h-24 bg-foreground rounded-[2rem] flex items-center justify-center shadow-2xl mb-8"
            >
              <FileText className="w-12 h-12 text-background" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="text-5xl font-extrabold tracking-tighter text-foreground"
            >
              ResumePro
            </motion.h1>
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "250px", opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3, ease: "circOut" }}
              className="h-1.5 bg-gradient-to-r from-green-500 via-yellow-500 to-purple-600 rounded-full mt-8 shadow-lg shadow-yellow-500/20"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />

      {/* Navbar */}
      <nav className="w-full z-50 py-6 px-8 flex justify-between items-center max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">ResumePro</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/tools/ats-score" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">ATS Optimization</Link>
          <Link href="/tools/cover-letter" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Cover Letters</Link>
          <Link href="/tools/mock-interview" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Interviews</Link>
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

      {/* Hero Section */}
      <main className="max-w-[1400px] w-full mx-auto px-8 flex flex-col lg:flex-row items-center justify-between gap-8 pt-2 pb-8 relative z-10">
        
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center mb-4 lg:mb-0">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl xl:text-[4.5rem] font-extrabold tracking-tighter leading-[1.1] mb-6"
          >
            Let your <br />
            <motion.span 
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-yellow-600 to-purple-800 dark:from-green-400 dark:via-orange-400 dark:to-purple-500 bg-[length:200%_auto] inline-block py-2 drop-shadow-sm"
            >
              AI career companion
            </motion.span> <br />
            get started.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl font-medium text-muted-foreground mb-8 max-w-lg leading-relaxed"
          >
            Upload your resume and tell ResumePro what you want to achieve. From ATS optimization to mock interviews.
          </motion.p>

          {/* Floating Interactive Input Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`w-full max-w-xl p-4 bg-stone-100 dark:bg-stone-900 border-2 rounded-[2rem] shadow-2xl transition-all duration-300 relative z-30
              ${isDragging ? "border-orange-500 scale-[1.02] bg-stone-200 dark:bg-stone-800" : "border-stone-300 dark:border-stone-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx" 
            />

            <div className="min-h-[80px] flex items-center px-4">
              {file ? (
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-4 truncate">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">Ready for analysis</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-muted-foreground text-base md:text-lg font-medium pl-2 select-none">
                    Upload your resume here (.pdf, .docx)...
                  </span>
                </div>
              )}
            </div>

            {/* Bottom action bar of the input box */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between px-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Browse Files
                </button>
              </div>
              
              <button 
                onClick={analyzeResume}
                disabled={!file || isAnalyzing}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  file && !isAnalyzing 
                    ? "bg-foreground text-background hover:scale-110 shadow-md cursor-pointer" 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="absolute -bottom-8 left-0 text-red-500 text-xs font-bold w-full text-center">{error}</p>
            )}
          </motion.div>
        </div>

        {/* Right Content - 3D Mascot & Speech Bubble */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="w-full lg:w-1/2 flex items-center justify-center relative h-[350px] lg:h-[500px]"
        >
          <div className="relative w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center">
            
            {/* Animated Speech Bubble - Moved to the Left and Shifted Right */}
            <div className="absolute top-10 left-8 md:top-20 md:-left-4 lg:-left-2 z-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={adviceIndex}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-card border-2 border-border shadow-2xl rounded-3xl rounded-bl-none p-5 max-w-[220px]"
                >
                  <p className="text-sm font-bold text-foreground leading-relaxed">
                    "{ADVICE[adviceIndex]}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mascot Image with Radial Gradient Mask to completely remove box edges */}
            <motion.div
              key={`mascot-${adviceIndex}`} 
              animate={{ y: [0, -15, 0], scale: [1, 1.01, 1] }} 
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              style={
                mounted && theme === "dark"
                  ? {
                      WebkitMaskImage: "radial-gradient(circle closest-side, black 70%, transparent 98%)",
                      maskImage: "radial-gradient(circle closest-side, black 70%, transparent 98%)"
                    }
                  : {}
              }
            >
              <Image 
                src="/rabbit_resume.png"
                alt="AI Career Companion"
                fill
                className="object-contain mix-blend-multiply dark:mix-blend-normal contrast-105 brightness-[1.02]"
                priority
              />
            </motion.div>
            
          </div>
        </motion.div>
      </main>

      {/* New Scrollable Features Section */}
      <section className="w-full bg-card py-24 border-y border-border">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Elevate your job search</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              ResumePro acts as your personal AI recruiter. We analyze your experience, optimize your keywords, and prepare you for the toughest interviews.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">ATS Optimization</h3>
              <p className="text-muted-foreground font-medium">Beat the automated resume screeners. We analyze your keywords against industry standards to ensure your resume actually gets seen by a human.</p>
            </div>
            
            <div className="p-8 rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                <Layout className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cover Letter Gen</h3>
              <p className="text-muted-foreground font-medium">Stop wasting hours staring at a blank page. Instantly generate highly targeted cover letters customized for specific job descriptions.</p>
            </div>
            
            <div className="p-8 rounded-[2rem] bg-background border border-border shadow-sm hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mock Interviews</h3>
              <p className="text-muted-foreground font-medium">Practice makes perfect. Simulate real-world technical and behavioral interviews with our advanced AI persona.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
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

    </div>
  );
}
