"use client";

import React, { useState } from "react";
import { FileText, Sparkles, Copy, Download } from "lucide-react";

export default function CoverLetterPage() {
  const [jobRole, setJobRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letter, setLetter] = useState("");

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setLetter(`Dear Hiring Manager at ${companyName || '[Company Name]'},\n\nI am writing to express my strong interest in the ${jobRole || '[Job Role]'} position. With my robust background in software engineering and hands-on experience in modern web technologies, I am confident in my ability to make an immediate impact at your organization.\n\nIn my recent projects, I have successfully developed scalable full-stack applications using React, Next.js, and Node.js. My approach focuses on creating intuitive user interfaces while ensuring robust backend performance. I am particularly drawn to your team's innovative work and believe my technical skills and proactive mindset align perfectly with your goals.\n\nI look down to the opportunity to discuss how my background, skills, and certifications will be beneficial to your team.\n\nSincerely,\n[Your Name]`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-white mb-2">AI Cover Letter Generator</h1>
      <p className="text-zinc-400 mb-8">Generate a highly tailored cover letter based on your resume and target job.</p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Target Role</label>
            <input 
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Company Name</label>
            <input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? "Drafting..." : "Generate Cover Letter"}
            {!isGenerating && <Sparkles className="w-4 h-4" />}
          </button>
        </div>

        <div className="md:col-span-8 p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
          <div className="p-6 rounded-xl bg-[#0a0a0a] h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Generated Output
              </h3>
              {letter && (
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Copy">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 rounded-lg p-2 font-serif text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto">
              {letter ? letter : (
                <span className="text-zinc-600 italic">Your generated cover letter will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
