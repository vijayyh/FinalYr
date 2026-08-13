"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  CheckCircle, 
  X, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus,
  Sparkles,
  FileText,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Metric {
  title: string;
  status: "PASS" | "FAIL";
  issueCount: number;
  issues: string[];
}

interface Category {
  name: string;
  scorePercentage: number;
  metrics: Metric[];
}

interface ATSResponse {
  overallScore: number;
  totalIssues: number;
  categories: Category[];
}

export default function ATSScorePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ATSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ groq: string; gemini: string } | null>(null);
  
  // Track which metric card drawer is expanded
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retrieve stored resume and keys on mount
  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) {
      setResumeText(storedText);
      setResumeInputMode("paste");
    }

    const fetchKeyStatus = async () => {
      try {
        const res = await fetch("/api/health/keys");
        if (res.ok) {
          const data = await res.json();
          setKeyStatus(data.keys);
        }
      } catch (err) {
        console.error("Failed to fetch API key status:", err);
      }
    };
    
    fetchKeyStatus();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".pdf") || droppedFile.name.endsWith(".docx")) {
        setFile(droppedFile);
        setError(null);
        await uploadAndExtract(droppedFile);
      } else {
        setError("Only PDF and DOCX files are supported.");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      await uploadAndExtract(selectedFile);
    }
  };

  const uploadAndExtract = async (targetFile: File) => {
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", targetFile);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to extract text from resume");
      }

      if (data.extracted_text) {
        setResumeText(data.extracted_text);
        localStorage.setItem("resumeText", data.extracted_text);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract resume text.");
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return setError("Please upload a resume or paste your resume text first.");
    if (!jobDescription.trim()) return setError("Please paste a target job description.");

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setExpandedMetric(null);

    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to analyze ATS compatibility.");
      }
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to calculate ATS score.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResumeText("");
    setError(null);
  };

  const toggleMetricDrawer = (title: string) => {
    setExpandedMetric(expandedMetric === title ? null : title);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <span>Optimization Engine</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">ATS Compatibility Checker</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-3xl">
          Evaluate your resume against specific job listings. Discover parsing optimization errors, missing impact metrics, spelling mistakes, and keyword overrepetition.
        </p>
      </div>

      {/* Developer Banner */}
      {keyStatus && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F4F1EA] border border-[#D1C9B9] rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5 text-xs font-extrabold text-stone-600 uppercase tracking-widest">
            <Activity className="w-4 h-4 text-orange-600" />
            <span>Developer API Keys:</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-stone-500">Groq:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                keyStatus.groq === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {keyStatus.groq}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-stone-500">Gemini:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                keyStatus.gemini === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {keyStatus.gemini}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-[#F4F1EA] p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm">
          
          <div className="flex items-center justify-between pb-4 border-b border-[#D1C9B9]/60">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-600" />
              Application Source
            </h3>
            
            <div className="flex bg-[#E5DFD3] p-0.5 rounded-lg border border-[#D1C9B9]">
              <button 
                onClick={() => setResumeInputMode("upload")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  resumeInputMode === "upload" ? "bg-black text-[#F4F1EA]" : "text-stone-600 hover:text-black"
                }`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setResumeInputMode("paste")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  resumeInputMode === "paste" ? "bg-black text-[#F4F1EA]" : "text-stone-600 hover:text-black"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Resume Upload / Paste */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Candidate Resume</label>
            
            {resumeInputMode === "upload" ? (
              <div 
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all min-h-[140px] ${
                  isDragging ? "border-orange-500 bg-orange-50/20" : "border-[#D1C9B9] hover:bg-[#E5DFD3]/40"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.docx" 
                />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold text-black">Extracting resume text...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-10 h-10 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl flex items-center justify-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-700" />
                    </div>
                    <p className="text-xs font-bold text-black truncate w-40 text-center">{file.name}</p>
                    <button 
                      onClick={clearFile}
                      className="mt-3 text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <UploadCloud className="w-6 h-6 text-stone-500 mb-2" />
                    <p className="text-xs font-bold text-black">Upload PDF / DOCX</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Drag-and-drop or browse</p>
                  </div>
                )}
              </div>
            ) : (
              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the raw text of your resume here..."
                className="w-full h-32 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors resize-none shadow-inner placeholder:text-stone-400 text-xs font-semibold"
              />
            )}
          </div>

          {/* Job Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Job Description</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste requirements, description details, or target keywords here..."
              className="w-full h-36 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors resize-none shadow-inner placeholder:text-stone-400 text-xs font-semibold"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200/50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || isUploading}
            className="w-full py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
                Calculating ATS Metrics...
              </>
            ) : (
              <>
                Calculate ATS Score
                <Zap className="w-4 h-4" />
              </>
            )}
          </button>

        </div>

        {/* Right Side: Score Dashboard */}
        <div className="lg:col-span-7">
          <div className="p-8 md:p-10 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5DFD3] rounded-full blur-3xl -mr-20 -mt-20 opacity-40 pointer-events-none" />
            
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6" />
                <h4 className="text-xl font-bold text-black mb-1">Scanning Resume & Job Spec</h4>
                <p className="text-xs text-stone-500 max-w-xs font-semibold uppercase tracking-wider">Evaluating structure, metrics, repetitions, and spelling</p>
              </div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8 flex-1 flex flex-col relative z-10"
              >
                
                {/* Top Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D1C9B9] pb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-6xl font-black tracking-tighter ${
                      result.overallScore >= 80 ? "text-green-800" : result.overallScore >= 60 ? "text-orange-600" : "text-red-700"
                    }`}>
                      {result.overallScore}/100
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-black">ATS Match Rating</div>
                      <div className="text-xs font-semibold text-stone-500 uppercase tracking-widest mt-0.5">
                        {result.overallScore >= 80 ? "Highly Compatible" : result.overallScore >= 60 ? "Average Match" : "Requires Revision"}
                      </div>
                    </div>
                  </div>
                  
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold border uppercase tracking-wider shadow-sm self-start sm:self-center ${
                    result.totalIssues === 0 
                      ? "bg-green-50 text-green-800 border-green-200" 
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}>
                    {result.totalIssues} {result.totalIssues === 1 ? "Issue" : "Issues"} Found
                  </span>
                </div>

                {/* Categories & Interactive Rows */}
                <div className="space-y-6 flex-1 overflow-y-auto pr-1">
                  {result.categories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-4">
                      {/* Category Header Row */}
                      <div className="flex items-center justify-between border-b border-[#D1C9B9]/40 pb-2">
                        <span className="text-xs font-black tracking-widest text-stone-500 uppercase">{cat.name}</span>
                        <span className="px-2.5 py-1 rounded bg-[#E5DFD3] text-stone-700 text-[10px] font-extrabold uppercase tracking-widest">
                          {cat.scorePercentage}% Score
                        </span>
                      </div>

                      {/* Metric Rows */}
                      <div className="space-y-3">
                        {cat.metrics.map((metric, metricIdx) => {
                          const isExpanded = expandedMetric === metric.title;
                          const isPass = metric.status === "PASS";
                          return (
                            <div 
                              key={metricIdx} 
                              className="border border-[#D1C9B9] rounded-2xl overflow-hidden bg-white/40 shadow-sm transition-all hover:bg-white/60"
                            >
                              {/* Clickable Header Row */}
                              <div 
                                onClick={() => toggleMetricDrawer(metric.title)}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3">
                                  {isPass ? (
                                    <div className="w-6 h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                                      <CheckCircle className="w-4 h-4 text-green-700" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                                      <X className="w-4 h-4 text-red-700" />
                                    </div>
                                  )}
                                  <span className="text-sm font-extrabold text-stone-900">{metric.title}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    isPass 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {isPass ? "No issues" : `${metric.issueCount} ${metric.issueCount === 1 ? "issue" : "issues"}`}
                                  </span>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                                </div>
                              </div>

                              {/* Expandable Issue Drawer */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="overflow-hidden bg-[#E5DFD3]/20 border-t border-[#D1C9B9]/60"
                                  >
                                    <div className="p-5 space-y-3.5">
                                      {metric.issues && metric.issues.length > 0 ? (
                                        <ul className="space-y-3">
                                          {metric.issues.map((issueStr, idx) => (
                                            <li key={idx} className="text-xs text-stone-700 font-semibold leading-relaxed flex items-start gap-2.5 bg-white/40 border border-[#D1C9B9]/40 p-3 rounded-xl shadow-inner">
                                              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                                              <span>{issueStr}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="text-xs text-green-700 font-bold flex items-center gap-2 py-1">
                                          <CheckCircle className="w-4 h-4" />
                                          <span>Outstanding check! No formatting or structural mistakes were detected in this metric.</span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ))}
                </div>

              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-20 h-20 rounded-3xl bg-[#E5DFD3] flex items-center justify-center mb-6 border border-[#D1C9B9] shadow-sm">
                  <ShieldCheck className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Ready for Scan</h3>
                <p className="text-stone-500 font-medium max-w-sm text-sm">
                  Upload a resume, paste requirements, and click compute to calculate your dynamic ATS performance report.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </motion.div>
  );
}
