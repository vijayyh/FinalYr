"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  TrendingUp,
  Award,
  Lightbulb,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";

type LinkedInSuggestions = {
  headline_suggestions: string[];
  about_summary: string;
  experience_tips: string[];
  keywords: string[];
};

export default function LinkedInOptimizerPage() {
  const [resumeText, setResumeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<LinkedInSuggestions | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) {
      setResumeText(storedText);
    }
  }, []);

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text or upload it from the Home page first.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tools/linkedin-optimizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setResults(data);
      } else {
        throw new Error(data.detail || "Failed to generate LinkedIn suggestions.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span>LinkedIn Optimizer</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-black mb-4 leading-tight">Profile Optimizer</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-3xl">
          Supercharge your LinkedIn profile. Transform your raw resume into a highly engaging, SEO-optimized LinkedIn presence that recruiters will love.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Area */}
        <div className="lg:col-span-5 bg-[#F4F1EA] p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Resume Text</label>
            </div>
            <textarea 
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here..."
              className="w-full h-80 bg-[#E5DFD3] border border-[#D1C9B9] rounded-xl p-4 text-stone-900 focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner placeholder:text-stone-400 text-sm font-semibold"
            />
            <p className="text-[10px] text-stone-500 font-medium">
              Pro tip: You can upload your resume on the Home page and we'll automatically pull it in here!
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !resumeText.trim()}
            className="w-full py-4 rounded-2xl bg-[#0a66c2] text-white hover:bg-[#004182] font-extrabold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Optimizing Profile...
              </>
            ) : (
              <>
                Generate LinkedIn Profile
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-7">
          {!results && !isGenerating ? (
            <div className="h-full min-h-[400px] rounded-[2rem] border-2 border-dashed border-[#D1C9B9] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-[#E5DFD3] rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-stone-400" />
              </div>
              <h3 className="text-xl font-extrabold text-stone-800 mb-2">Ready to Optimize</h3>
              <p className="text-stone-500 max-w-sm font-medium">
                Paste your resume and click generate to get AI-crafted headlines, about sections, and keyword strategies.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="h-full min-h-[400px] rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] flex flex-col items-center justify-center text-center p-8 space-y-6">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 border-4 border-[#D1C9B9] rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#0a66c2] rounded-full border-t-transparent animate-spin"></div>
                <Briefcase className="absolute inset-0 m-auto w-6 h-6 text-[#0a66c2]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-stone-800">Analyzing Experience</h3>
                <p className="text-stone-500 font-medium text-sm">Crafting the perfect first impression...</p>
              </div>
            </div>
          ) : results && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Headlines */}
              <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900">Headline Suggestions</h3>
                </div>
                <div className="space-y-3 relative z-10">
                  {results.headline_suggestions.map((headline, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 rounded-xl bg-[#F8F9FA] border border-stone-200 hover:border-blue-300 transition-colors group/item">
                      <p className="text-stone-800 font-medium pr-4">{headline}</p>
                      <button 
                        onClick={() => handleCopy(headline, `headline-${idx}`)}
                        className="text-stone-400 hover:text-blue-600 transition-colors shrink-0"
                      >
                        {copiedSection === `headline-${idx}` ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* About Summary */}
              <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-700" />
                    </div>
                    <h3 className="text-xl font-extrabold text-stone-900">"About" Summary</h3>
                  </div>
                  <button 
                    onClick={() => handleCopy(results.about_summary, 'about')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-stone-600 transition-colors"
                  >
                    {copiedSection === 'about' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedSection === 'about' ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="relative z-10 p-5 rounded-xl bg-[#F8F9FA] border border-stone-200 text-stone-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {results.about_summary}
                </div>
              </motion.div>

              {/* Experience Tips & Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-extrabold text-stone-900">Experience Tips</h3>
                  </div>
                  <ul className="space-y-4">
                    {results.experience_tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-stone-700 font-medium text-sm leading-relaxed">
                        <span className="text-amber-500 font-bold">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-[#D1C9B9] shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h3 className="text-lg font-extrabold text-stone-900">Top Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.keywords.map((kw, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-[#F4F1EA] border border-[#D1C9B9] rounded-lg text-xs font-bold text-stone-700 shadow-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
