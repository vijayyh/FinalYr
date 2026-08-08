"use client";

import React, { useState, useEffect } from "react";
import { Mic, RefreshCw, AlertCircle } from "lucide-react";

export default function MockInterviewPage() {
  const [role, setRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [resumeText, setResumeText] = useState<string | null>(null);

  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) setResumeText(storedText);
  }, []);

  const handleGenerate = async () => {
    if (!role) return alert("Please enter a target job role.");
    if (!resumeText) return alert("Please go to Home and upload a resume first.");

    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:8000/api/tools/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: role,
          resume_text: resumeText,
        }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate mock interview questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-foreground mb-2">AI Mock Interview Prep</h1>
      <p className="text-foreground/60 mb-8">Generate tailored interview questions based on your resume and the role you are applying for.</p>

      {!resumeText && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">No resume found. Please go to the Home page and upload a resume first to get tailored questions.</p>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-foreground/5 backdrop-blur-xl border border-foreground/10 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-xl">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-foreground/80 mb-2 block">Target Job Role</label>
          <input 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            className="w-full bg-background border border-foreground/10 rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-500/25"
        >
          {isGenerating ? "Generating..." : "Generate Questions"}
          {!isGenerating && <Mic className="w-4 h-4" />}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Your Tailored Questions</h3>
            <button onClick={handleGenerate} className="text-sm text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          
          {questions.map((q, i) => (
            <div key={i} className="p-5 rounded-xl bg-foreground/5 backdrop-blur-md border border-foreground/10 hover:border-indigo-500/30 transition-all duration-300 group flex gap-4 shadow-sm hover:shadow-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium mb-3">{q}</p>
                <textarea 
                  className="w-full h-24 rounded-lg bg-background/50 border border-foreground/10 p-3 text-sm text-foreground resize-none focus:outline-none focus:border-indigo-500/50 shadow-inner"
                  placeholder="Jot down your talking points here..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
