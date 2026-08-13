"use client";

import React, { useState } from "react";
import { Mic, Briefcase, Video, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MockInterviewPage() {
  const [jobRole, setJobRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [resumeText, setResumeText] = useState<string | null>(null);

  React.useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) setResumeText(storedText);
  }, []);

  const handleGenerate = async () => {
    if (!jobRole) return alert("Please enter a target role.");
    if (!resumeText) return alert("Please go to Home and upload a resume first.");

    setIsGenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tools/mock-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_role: jobRole,
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <span>Interview Prep</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">Mock Interviews</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-2xl">Practice with highly tailored, role-specific questions generated directly from your unique experience.</p>
      </div>

      <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm mb-10 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-bold text-stone-600 uppercase tracking-widest mb-3 block">Target Role</label>
          <input 
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Senior Frontend Developer"
            className="w-full bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-stone-400 transition-all duration-300 shadow-inner placeholder:text-stone-500"
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-[#F4F1EA] border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Questions
              <Mic className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {questions.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-stone-500" />
            Your Tailored Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map((q, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5DFD3] rounded-full blur-2xl -mr-10 -mt-10 opacity-50" />
                <div className="flex gap-3 mb-6 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-[#E5DFD3] border border-[#D1C9B9] text-xs font-bold text-stone-600 uppercase tracking-wider">
                    {q.focus}
                  </span>
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                    q.difficulty === 'Hard' ? 'bg-red-50 text-red-700 border-red-200' : 
                    q.difficulty === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-black leading-relaxed relative z-10">{q.question}</h4>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="p-16 rounded-[2rem] bg-transparent border-2 border-dashed border-[#D1C9B9] text-center flex flex-col items-center justify-center text-stone-500">
          <div className="w-20 h-20 rounded-3xl bg-[#F4F1EA] flex items-center justify-center mb-6 border border-[#D1C9B9] shadow-sm">
            <Mic className="w-10 h-10 text-stone-400" />
          </div>
          <p className="font-medium max-w-md">Enter a target role and click generate to receive your customized interview questions.</p>
        </div>
      )}
    </motion.div>
  );
}
