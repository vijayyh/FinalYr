"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ATSScorePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);

  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) setResumeText(storedText);
  }, []);

  const handleAnalyze = async () => {
    if (!jobDescription) return alert("Please enter a job description.");
    if (!resumeText) return alert("Please go to Home and upload a resume first.");

    setIsAnalyzing(true);
    try {
      const res = await fetch("http://localhost:8000/api/tools/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze ATS Score.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <span>Optimization Engine</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">ATS Compatibility Checker</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-2xl">Compare your resume against a specific job description to predict your ATS score and find missing keywords.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="flex flex-col gap-6">
          <div className="p-8 rounded-3xl bg-[#F4F1EA] border border-[#D1C9B9] text-center flex flex-col items-center justify-center h-48 border-dashed shadow-sm transition-all duration-300">
            {resumeText ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#E5DFD3] flex items-center justify-center mb-4 border border-[#D1C9B9]">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-lg font-bold text-black mb-1">Resume Uploaded</span>
                <span className="text-sm font-medium text-stone-500">Ready for analysis</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#E5DFD3] flex items-center justify-center mb-4 border border-[#D1C9B9]">
                  <UploadCloud className="w-6 h-6 text-stone-400" />
                </div>
                <span className="text-lg font-bold text-black mb-1">No Resume Found</span>
                <span className="text-sm font-medium text-stone-500">Please upload a resume on the Home page first</span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-stone-600 uppercase tracking-widest">Target Job Description</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-64 bg-[#F4F1EA] border border-[#D1C9B9] rounded-3xl p-6 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 resize-none shadow-sm placeholder:text-stone-400"
            />
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                Calculate ATS Score
                <Zap className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="p-10 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] relative overflow-hidden shadow-sm h-full flex flex-col">
          {result ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-col items-center mb-10 pb-8 border-b border-[#D1C9B9]">
                <div className={`text-7xl font-extrabold tracking-tight mb-3 ${result.score >= 80 ? 'text-green-700' : result.score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                  {result.score}%
                </div>
                <div className="px-6 py-2 rounded-full border border-[#D1C9B9] bg-[#E5DFD3] text-sm font-bold uppercase tracking-widest text-stone-600 shadow-sm">
                  {result.score >= 80 ? 'Great Match' : result.score >= 60 ? 'Fair Match' : 'Needs Work'}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Missing Keywords</h3>
                <ul className="flex flex-wrap gap-2">
                  {result.missingSkills && result.missingSkills.length > 0 ? (
                    result.missingSkills.map((skill: string, i: number) => (
                      <li key={i} className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-xl shadow-sm">{skill}</li>
                    ))
                  ) : (
                    <li className="text-sm font-medium text-stone-500">None detected! Excellent match.</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Top Strengths</h3>
                <ul className="flex flex-col gap-4">
                  {result.strengths && result.strengths.map((str: string, i: number) => (
                    <li key={i} className="text-base text-stone-700 font-medium leading-relaxed flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      {str}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#E5DFD3] flex items-center justify-center mb-6 border border-[#D1C9B9] shadow-sm">
                <ShieldCheck className="w-10 h-10 text-stone-400" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Awaiting Description</h3>
              <p className="text-stone-500 font-medium max-w-sm">Paste a job description and calculate your score to see detailed insights here.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
