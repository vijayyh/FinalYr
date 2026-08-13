"use client";

import React, { useState } from "react";
import { FileText, Sparkles, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function CoverLetterPage() {
  const [jobRole, setJobRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [resumeText, setResumeText] = useState<string | null>(null);

  React.useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) setResumeText(storedText);
  }, []);

  const handleGenerate = async () => {
    if (!jobRole || !companyName) return alert("Please enter both target role and company name.");
    if (!resumeText) return alert("Please go to Home and upload a resume first.");

    setIsGenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tools/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
          company_name: companyName,
          resume_text: resumeText,
        }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate cover letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <span>Letter Generator</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">AI Cover Letters</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-2xl">Generate a highly tailored, professional cover letter based on your uploaded resume and target job.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-stone-600 uppercase tracking-widest">Target Role</label>
            <input 
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full bg-[#F4F1EA] border border-[#D1C9B9] rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 shadow-sm placeholder:text-stone-400"
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-stone-600 uppercase tracking-widest">Company Name</label>
            <input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google"
              className="w-full bg-[#F4F1EA] border border-[#D1C9B9] rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 shadow-sm placeholder:text-stone-400"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
                Drafting...
              </>
            ) : (
              <>
                Generate Cover Letter
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-8 h-[600px]">
          <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5DFD3] rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-[#D1C9B9] pb-6 mb-6 relative z-10">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E5DFD3] flex items-center justify-center border border-[#D1C9B9]">
                  <FileText className="w-4 h-4 text-stone-700" />
                </div>
                Generated Output
              </h3>
              {letter && (
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-xl bg-[#E5DFD3] hover:bg-[#D1C9B9] border border-[#D1C9B9] text-stone-700 transition-colors shadow-sm" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 rounded-xl bg-black hover:bg-stone-800 text-white transition-colors shadow-sm" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 rounded-2xl p-8 bg-white border border-[#D1C9B9] font-serif text-stone-800 text-base leading-loose whitespace-pre-wrap overflow-y-auto shadow-inner relative z-10">
              {letter ? letter : (
                <div className="flex flex-col items-center justify-center h-full text-center text-stone-400">
                  <FileText className="w-12 h-12 mb-4 opacity-50" />
                  <span className="italic">Your highly tailored cover letter will appear here...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
