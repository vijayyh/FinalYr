"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  CheckCircle, 
  Zap, 
  GitFork, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  FileText, 
  X, 
  AlertCircle,
  Network,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RoadmapItem {
  skill: string;
  path: string[];
}

interface AnalysisResult {
  status: string;
  user_skills: string[];
  target_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  bridge_skills: string[];
  jaccard_overlap: number;
  roadmap: RoadmapItem[];
}

export default function SkillGapPage() {
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored resume text if available
  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) {
      setResumeText(storedText);
      setResumeInputMode("paste");
    }
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
    if (!resumeText.trim()) {
      return setError("Please upload a resume or paste your resume details first.");
    }
    if (!jobDescription.trim()) {
      return setError("Please paste the target job description.");
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tools/skill-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to analyze skill gaps.");
      }

      setResult(data);
      setTimeout(() => {
        document.getElementById("results-dashboard")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please check the backend connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResumeText("");
    setError(null);
  };

  const getNodeStyles = (nodeName: string, isTarget: boolean, matchedSkills: string[]) => {
    const isMatched = matchedSkills.includes(nodeName);
    if (isMatched) {
      return {
        bg: "bg-green-50 border-green-300 text-green-800",
        badge: "bg-green-200 text-green-800",
        label: "Acquired"
      };
    }
    if (isTarget) {
      return {
        bg: "bg-red-50 border-red-300 text-red-800",
        badge: "bg-red-200 text-red-800",
        label: "Target Gap"
      };
    }
    return {
      bg: "bg-blue-50 border-blue-300 text-blue-800",
      badge: "bg-blue-200 text-blue-800",
      label: "Bridge Skill"
    };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-12"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <GitFork className="w-3.5 h-3.5" />
          <span>Graph-based Skill Gap Analysis</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">Skill Gap Analyzer</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-3xl">
          Evaluate your resume against target jobs using a directed prerequisite skill graph. Discover target gaps, find bridging skills, and explore tailored learning paths.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Box: Resume Input */}
        <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-600" />
              1. Your Resume
            </h3>
            
            <div className="flex bg-[#E5DFD3] p-1 rounded-xl border border-[#D1C9B9]">
              <button 
                onClick={() => setResumeInputMode("upload")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  resumeInputMode === "upload" 
                    ? "bg-black text-[#F4F1EA] shadow-sm" 
                    : "text-stone-600 hover:text-black"
                }`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setResumeInputMode("paste")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  resumeInputMode === "paste" 
                    ? "bg-black text-[#F4F1EA] shadow-sm" 
                    : "text-stone-600 hover:text-black"
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between min-h-[300px]">
            {resumeInputMode === "upload" ? (
              <div 
                className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all ${
                  isDragging 
                    ? "border-orange-500 bg-orange-50/20" 
                    : "border-[#D1C9B9] hover:bg-[#E5DFD3]/40"
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
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="font-bold text-black">Extracting resume skills...</p>
                    <p className="text-xs text-stone-500 mt-1">Reading PDF / DOCX contents</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center w-full max-w-xs">
                    <div className="w-14 h-14 bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl flex items-center justify-center mb-4">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                    </div>
                    <p className="font-bold text-black truncate w-full text-center">{file.name}</p>
                    <p className="text-xs text-stone-500 mt-1 font-semibold uppercase tracking-wider">Skills Loaded</p>
                    
                    <button 
                      onClick={clearFile}
                      className="mt-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100/50 text-xs font-bold transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center w-full"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#E5DFD3] flex items-center justify-center mb-4 border border-[#D1C9B9] shadow-inner">
                      <UploadCloud className="w-7 h-7 text-stone-500" />
                    </div>
                    <p className="text-base font-bold text-black mb-1">Drag & Drop Resume here</p>
                    <p className="text-xs text-stone-500 mb-4">or click to browse from device</p>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 py-1 rounded bg-[#E5DFD3]">
                      Supports PDF, DOCX
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <textarea 
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume details, technical background, work experience, or a bulleted list of your technical skills here..."
                  className="w-full flex-1 min-h-[250px] bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl p-5 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 resize-none shadow-inner placeholder:text-stone-400 text-sm font-medium leading-relaxed"
                />
              </div>
            )}
            
            {resumeText && (
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 border border-green-200/50 p-3.5 rounded-xl">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Resume content is loaded and ready. ({resumeText.length} characters)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Box: Target JD */}
        <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-stone-600" />
              2. Target Job Description
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="flex-1 flex flex-col">
              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description or role requirements here to find the core technical competencies they are looking for..."
                className="w-full flex-1 min-h-[250px] bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl p-5 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 resize-none shadow-inner placeholder:text-stone-400 text-sm font-medium leading-relaxed"
              />
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200/50 p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || isUploading}
          className="px-10 py-5 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-extrabold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-md hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
              Analyzing Skill Graph & Gaps...
            </>
          ) : (
            <>
              Analyze Skill Graph & Gap
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Output Dashboard */}
      <AnimatePresence>
        {result && (
          <motion.div 
            id="results-dashboard"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-12 pt-8"
          >
            {/* Top Row Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Overlap Gauge */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 pointer-events-none" />
                
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6">Skill Graph Overlap</h4>
                
                <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      stroke="#E5DFD3" 
                      strokeWidth="10" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      stroke={result.jaccard_overlap >= 70 ? "#15803d" : result.jaccard_overlap >= 40 ? "#ea580c" : "#b91c1c"} 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={376.9}
                      initial={{ strokeDashoffset: 376.9 }}
                      animate={{ strokeDashoffset: 376.9 - (376.9 * result.jaccard_overlap) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-black">{result.jaccard_overlap}%</span>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Jaccard Index</span>
                  </div>
                </div>
                
                <p className="text-xs font-semibold text-stone-600 mt-2">
                  {result.jaccard_overlap >= 70 ? "Excellent compatibility!" : result.jaccard_overlap >= 40 ? "Good match, with addressable gaps." : "Significant gaps identified."}
                </p>
              </div>

              {/* Matched Count */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Matched Skills</h4>
                  <span className="p-2 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  </span>
                </div>

                <div className="my-6">
                  <div className="text-5xl font-black text-green-800">{result.matched_skills.length}</div>
                  <p className="text-sm font-bold text-stone-800 mt-1">Skills align perfectly</p>
                </div>

                <p className="text-xs text-stone-500 font-medium">
                  These technical skills extracted from your resume match target job requirements.
                </p>
              </div>

              {/* Missing Count */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 pointer-events-none" />
                
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Target Gaps</h4>
                  <span className="p-2 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-700" />
                  </span>
                </div>

                <div className="my-6">
                  <div className="text-5xl font-black text-red-800">{result.missing_skills.length}</div>
                  <p className="text-sm font-bold text-stone-800 mt-1">Missing competencies</p>
                </div>

                <p className="text-xs text-stone-500 font-medium">
                  Key requirements in the job description that were not detected in your resume.
                </p>
              </div>

            </div>

            {/* Middle Section: Learning Roadmap */}
            <div className="p-8 md:p-10 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#D1C9B9] pb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-black flex items-center gap-2.5">
                    <Network className="w-6 h-6 text-stone-700 animate-pulse" />
                    Interactive Learning Roadmap
                  </h3>
                  <p className="text-sm text-stone-600 mt-1">
                    Prerequisite graph relationships mapping how to leverage your existing knowledge to unlock target skills.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Acquired</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Bridge</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Gap</span>
                </div>
              </div>

              {result.roadmap && result.roadmap.length > 0 ? (
                <div className="space-y-8 divide-y divide-[#D1C9B9]/60">
                  {result.roadmap.map((item, index) => (
                    <div key={index} className="pt-6 first:pt-0 flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-full md:w-1/4">
                        <div className="px-4 py-2 bg-stone-200/50 border border-[#D1C9B9] rounded-xl text-center md:text-left">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Path Target</span>
                          <span className="text-base font-bold text-black">{item.skill}</span>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-3/4 flex-1">
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 p-4 bg-[#E5DFD3]/40 border border-[#D1C9B9] rounded-2xl shadow-inner min-h-[80px]">
                          {item.path.map((step, stepIdx) => {
                            const isTarget = step === item.skill;
                            const styles = getNodeStyles(step, isTarget, result.user_skills);
                            return (
                              <React.Fragment key={stepIdx}>
                                {stepIdx > 0 && (
                                  <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" />
                                )}
                                <div className={`px-4 py-2.5 rounded-xl border flex flex-col items-start min-w-[120px] transition-all shadow-sm ${styles.bg}`}>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 ${styles.badge}`}>
                                    {styles.label}
                                  </span>
                                  <span className="text-sm font-extrabold tracking-tight">{step}</span>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-[#D1C9B9] rounded-2xl flex flex-col items-center">
                  <Award className="w-12 h-12 text-stone-400 mb-3" />
                  <h4 className="text-lg font-bold text-black mb-1">No Roadmap Paths Required</h4>
                  <p className="text-xs text-stone-500 max-w-sm">
                    No clear paths found matching current prerequisite links, or your acquired skills cover target requirements.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Section: Breakdown Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Matched Card */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b border-[#D1C9B9] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Matched Skills</h3>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Acquired & Aligned</p>
                  </div>
                </div>

                <div className="flex-1">
                  {result.matched_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {result.matched_skills.map((skill, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-medium leading-relaxed italic">No exact matched skills found. Adjust keywords in your resume.</p>
                  )}
                </div>
              </div>

              {/* Missing Card */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b border-[#D1C9B9] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Missing Gaps</h3>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Actionable Needs</p>
                  </div>
                </div>

                <div className="flex-1">
                  {result.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {result.missing_skills.map((skill, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-medium leading-relaxed italic">No missing skills detected! High compatibility.</p>
                  )}
                </div>
              </div>

              {/* Bridge Card */}
              <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6 border-b border-[#D1C9B9] pb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Implicit Bridge Skills</h3>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Recommended steps</p>
                  </div>
                </div>

                <div className="flex-1">
                  {result.bridge_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {result.bridge_skills.map((skill, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 font-medium leading-relaxed italic">No additional bridge prerequisite skills identified.</p>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
