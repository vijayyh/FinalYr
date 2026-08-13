"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Download, 
  UploadCloud, 
  CheckCircle, 
  X, 
  AlertCircle,
  RotateCcw,
  Briefcase,
  ChevronDown,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoverLetterPage() {
  const [jobRole, setJobRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  
  const [tone, setTone] = useState("Professional");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  
  const [keyStatus, setKeyStatus] = useState<{ groq: string; gemini: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check key health and load stored resume on mount
  useEffect(() => {
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

  const handleGenerate = async () => {
    if (!jobRole.trim()) return setError("Please enter the target role.");
    if (!companyName.trim()) return setError("Please enter the company name.");
    if (!resumeText.trim()) return setError("Please upload a resume or paste your resume text first.");

    setIsGenerating(true);
    setError(null);
    setLetter("");

    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          companyName,
          jobDescription,
          resumeText,
          tone
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to generate cover letter.");
      }

      if (data.letter) {
        setLetter(data.letter);
      } else {
        throw new Error("No letter content returned from API.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!letter) return;
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  };

  const handleDownloadPDF = () => {
    if (!letter) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return alert("Pop-up blocked. Please allow pop-ups to download the cover letter.");
    }

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter - ${jobRole} at ${companyName}</title>
          <style>
            @page {
              size: letter;
              margin: 1in;
            }
            body {
              font-family: 'Georgia', 'Garamond', serif;
              line-height: 1.6;
              color: #1c1917;
              font-size: 11pt;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 100%;
            }
            .date {
              margin-bottom: 20px;
            }
            .letter-content {
              white-space: pre-wrap;
              text-align: justify;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="date">${today}</div>
            <div class="letter-content">${letter}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clearFile = () => {
    setFile(null);
    setResumeText("");
    setError(null);
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
          <span>Letter Generator</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">Cover Letter Builder</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-3xl">
          Instantly generate human-sounding, professional cover letters tailored specifically to your target job role, company name, and background skills.
        </p>
      </div>

      {/* Developer Banner */}
      {keyStatus && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F4F1EA] border border-[#D1C9B9] rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5 text-xs font-extrabold text-stone-600 uppercase tracking-widest">
            <Activity className="w-4 h-4 text-orange-600" />
            <span>Developer Engine Status:</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-stone-500">Groq:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                keyStatus.groq === "Active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {keyStatus.groq}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-stone-500">Gemini:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                keyStatus.gemini === "Active" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {keyStatus.gemini}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Input Form */}
        <div className="lg:col-span-5 bg-[#F4F1EA] p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm flex flex-col gap-6">
          
          <div className="flex items-center gap-2 pb-4 border-b border-[#D1C9B9]/60">
            <Briefcase className="w-5 h-5 text-stone-700" />
            <h3 className="text-sm font-bold text-black uppercase tracking-wider">Target Application Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Role</label>
              <input 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Frontend Engineer"
                className="w-full bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors shadow-inner placeholder:text-stone-400 text-sm font-semibold"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Company Name</label>
              <input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google"
                className="w-full bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors shadow-inner placeholder:text-stone-400 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Tone Selection</label>
            </div>
            <div className="relative">
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full appearance-none bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors shadow-inner text-sm font-semibold pr-10"
              >
                <option value="Professional">Professional & Polished</option>
                <option value="Enthusiastic">Enthusiastic & Friendly</option>
                <option value="Executive">Executive & Authoritative</option>
                <option value="Direct/Punchy">Direct & Punchy</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Target Job Description (Optional)</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste requirements, description, or target keywords here..."
              className="w-full h-24 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors resize-none shadow-inner placeholder:text-stone-400 text-xs font-semibold"
            />
          </div>

          {/* Resume Source Input Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Resume Background</label>
              
              <div className="flex bg-[#E5DFD3] p-0.5 rounded-lg border border-[#D1C9B9]">
                <button 
                  onClick={() => setResumeInputMode("upload")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    resumeInputMode === "upload" 
                      ? "bg-black text-[#F4F1EA]" 
                      : "text-stone-600 hover:text-black"
                  }`}
                >
                  Upload File
                </button>
                <button 
                  onClick={() => setResumeInputMode("paste")}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    resumeInputMode === "paste" 
                      ? "bg-black text-[#F4F1EA]" 
                      : "text-stone-600 hover:text-black"
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {resumeInputMode === "upload" ? (
              <div 
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all min-h-[140px] ${
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
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs font-bold text-black">Extracting text...</p>
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
                    <p className="text-xs font-bold text-black">Upload PDF / DOCX Resume</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Drag-and-drop or browse</p>
                  </div>
                )}
              </div>
            ) : (
              <textarea 
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume details or skills background details..."
                className="w-full h-32 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-3.5 text-stone-900 focus:outline-none focus:border-stone-400 transition-colors resize-none shadow-inner placeholder:text-stone-400 text-xs font-semibold"
              />
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200/50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isUploading}
            className="w-full py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
                Generating Cover Letter...
              </>
            ) : (
              <>
                Generate Cover Letter
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>

        </div>

        {/* Right Output Preview */}
        <div className="lg:col-span-7 h-[700px] flex flex-col">
          <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5DFD3] rounded-full blur-3xl -mr-20 -mt-20 opacity-40 pointer-events-none" />
            
            {/* Output Header & Action Bar */}
            <div className="flex justify-between items-center border-b border-[#D1C9B9] pb-6 mb-6 relative z-10">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E5DFD3] flex items-center justify-center border border-[#D1C9B9]">
                  <FileText className="w-4 h-4 text-stone-700" />
                </div>
                Generated Preview
              </h3>
              
              {letter && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5DFD3] hover:bg-[#D1C9B9] border border-[#D1C9B9] text-stone-700 text-xs font-bold transition-colors shadow-sm" 
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-bold transition-colors shadow-sm" 
                    title="Print to PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E5DFD3] hover:bg-[#D1C9B9] border border-[#D1C9B9] text-stone-700 text-xs font-bold transition-colors shadow-sm" 
                    title="Regenerate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Letter Preview Sheet */}
            <div className="flex-1 rounded-2xl p-8 bg-white border border-[#D1C9B9] font-serif text-stone-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap overflow-y-auto shadow-inner relative z-10">
              {isGenerating ? (
                // Skeletons during generation
                <div className="space-y-6 py-4 animate-pulse">
                  <div className="h-4 bg-stone-200 rounded w-1/4 mb-10" />
                  <div className="h-4 bg-stone-200 rounded w-1/3" />
                  <div className="space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-4 bg-stone-200 rounded w-5/6" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-4 bg-stone-200 rounded w-full" />
                    <div className="h-4 bg-stone-200 rounded w-11/12" />
                  </div>
                  <div className="h-4 bg-stone-200 rounded w-1/4 pt-8" />
                  <div className="h-4 bg-stone-200 rounded w-1/6" />
                </div>
              ) : letter ? (
                letter
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-stone-400">
                  <FileText className="w-12 h-12 mb-4 opacity-40" />
                  <span className="italic font-sans text-sm font-semibold max-w-xs">
                    Your highly tailored cover letter will render on this page. Specify targets and click generate.
                  </span>
                </div>
              )}
            </div>
            
          </div>
        </div>

      </div>

    </motion.div>
  );
}
