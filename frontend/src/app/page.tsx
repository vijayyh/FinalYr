"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, FileText, CheckCircle, ArrowRight, Sparkles, Briefcase, Zap, ShieldCheck, ExternalLink } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setAnalysisResult(data);
      if (data.extracted_text) {
        localStorage.setItem("resumeText", data.extracted_text);
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Failed to analyze resume. Please make sure the backend is running.");
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
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-6 max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold tracking-tight text-white">ResumeAI.</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-zinc-400">
          <Link href="/tools/ats-score" className="hover:text-white transition-colors">ATS Score</Link>
          <Link href="/tools/cover-letter" className="hover:text-white transition-colors">Cover Letter</Link>
          <Link href="/tools/mock-interview" className="hover:text-white transition-colors">Mock Interview</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative mt-16 mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-md">
          <Zap className="w-3 h-3" />
          <span>Powered by Gemini API & Real-time Job Search</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-center max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 mb-6">
          Unlock Your Career Potential with AI Insights
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 text-center max-w-2xl mb-12">
          Upload your resume to get instant AI analysis and a live list of companies currently hiring that match your profile.
        </p>

        {/* Upload Component */}
        <div className="w-full max-w-2xl group">
          <div 
            className={`relative p-8 md:p-12 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out backdrop-blur-sm flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden
              ${isDragging 
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" 
                : file 
                  ? "border-green-500/50 bg-green-500/5 hover:border-green-400" 
                  : "border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx" 
            />

            {file ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
                <p className="text-sm text-zinc-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex gap-4">
                  <button 
                    className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                    onClick={(e) => { e.stopPropagation(); analyzeResume(); }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing & Fetching Jobs..." : "Analyze Resume"}
                    {!isAnalyzing && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <button 
                    className="px-6 py-2.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setAnalysisResult(null); }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drag & drop your resume here
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Supports PDF, DOCX (Max 5MB)
                </p>
                <button className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors">
                  Browse Files
                </button>
              </div>
            )}
          </div>
          
          {analysisResult && (
            <div className="mt-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-indigo-400" />
                  Live Job Matches
                </h2>
                <span className="text-sm text-zinc-400">Target Role: <strong className="text-white">{analysisResult.parsed_data.job_title}</strong></span>
              </div>
              
              <div className="flex flex-col gap-4">
                {analysisResult.jobs && analysisResult.jobs.length > 0 ? (
                  analysisResult.jobs.map((job: any, index: number) => (
                    <div key={index} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{job.job_title}</h3>
                        <p className="text-sm text-zinc-400">{job.employer_name}</p>
                      </div>
                      <a 
                        href={job.job_apply_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        Apply Direct
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center text-zinc-400">
                    No live jobs found at the moment or API limit reached.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24">
          <Link href="/tools/ats-score">
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
              title="ATS Optimization"
              description="See exactly how applicant tracking systems read your resume and fix parsing errors."
            />
          </Link>
          <Link href="/tools/cover-letter">
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-purple-400" />}
              title="Auto Cover Letters"
              description="Generate customized, high-converting cover letters for specific job links in seconds."
            />
          </Link>
          <Link href="/tools/mock-interview">
            <FeatureCard 
              icon={<Briefcase className="w-6 h-6 text-indigo-400" />}
              title="Mock Interviews"
              description="Generate tailored interview questions based on your resume and target role."
            />
          </Link>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors h-full cursor-pointer">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
