"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, CheckCircle, Zap, ShieldCheck } from "lucide-react";

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
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-foreground mb-2">ATS Compatibility Checker</h1>
      <p className="text-foreground/60 mb-8">Compare your resume against a specific job description to predict your ATS score and find missing keywords.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-foreground/5 backdrop-blur-xl border border-foreground/10 text-center flex flex-col items-center justify-center h-48 border-dashed hover:border-indigo-500/50 hover:bg-foreground/10 transition-colors">
            {resumeText ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                <span className="text-sm font-medium text-foreground mb-1">Resume Uploaded</span>
                <span className="text-xs text-foreground/50">Ready for analysis</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-indigo-400 mb-3" />
                <span className="text-sm font-medium text-foreground mb-1">No Resume Found</span>
                <span className="text-xs text-foreground/50">Please upload a resume on the Home page first</span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground/80">Target Job Description</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-48 bg-background border border-foreground/10 rounded-xl p-4 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-inner"
            />
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {isAnalyzing ? "Analyzing..." : "Calculate ATS Score"}
            {!isAnalyzing && <Zap className="w-4 h-4" />}
          </button>
        </div>

        {/* Results Panel */}
        <div className="p-8 rounded-2xl bg-foreground/5 backdrop-blur-xl border border-foreground/10 relative overflow-hidden shadow-2xl">
          {result ? (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-col items-center mb-8">
                <div className={`text-6xl font-bold mb-2 ${result.score >= 80 ? 'text-green-500' : result.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {result.score}%
                </div>
                <div className={`text-sm font-medium px-3 py-1 rounded-full ${result.score >= 80 ? 'bg-green-500/10 text-green-500' : result.score >= 60 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                  {result.score >= 80 ? 'Great Match' : result.score >= 60 ? 'Fair Match' : 'Needs Work'}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-foreground/10 pb-2">Missing Keywords</h3>
                <ul className="flex flex-wrap gap-2">
                  {result.missingSkills && result.missingSkills.map((skill: string, i: number) => (
                    <li key={i} className="text-xs bg-red-500/10 text-red-500 dark:text-red-400 px-3 py-1.5 rounded-md border border-red-500/20">{skill}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-foreground/10 pb-2">Top Strengths</h3>
                <ul className="flex flex-col gap-2">
                  {result.strengths && result.strengths.map((str: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {str}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <ShieldCheck className="w-16 h-16 text-foreground/40 mb-4" />
              <p className="text-foreground/60">Paste a job description to see your score.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
