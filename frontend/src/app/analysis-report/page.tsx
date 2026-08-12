"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { 
  Briefcase, 
  ArrowLeft, 
  CheckCircle2, 
  Target, 
  ExternalLink,
  Zap,
  FileText,
  AlertCircle
} from "lucide-react";

export default function AnalysisReport() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const storedData = localStorage.getItem("analysisResult");
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (e) {
        console.error("Failed to parse analysis result", e);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#E5DFD3] text-stone-900">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-600 font-medium">Preparing your professional analysis...</p>
      </div>
    );
  }

  const { parsed_data, jobs } = data;
  const { 
    job_title, 
    ats_score,
    executive_summary,
    skills, 
    key_strengths, 
    areas_for_improvement,
    formatting_feedback 
  } = parsed_data || {};

  // Animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#E5DFD3] text-stone-900 selection:bg-orange-200">
      
      {/* Professional Navbar */}
      <nav className="w-full bg-[#F4F1EA] border-b border-[#D1C9B9] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-[#E5DFD3] transition-colors text-stone-600 hover:text-stone-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-4 h-4 text-[#F4F1EA]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-black">ResumePro</span>
            </div>
          </div>
          
          {ats_score && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-stone-600 uppercase tracking-widest">ATS Match</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E5DFD3] border border-[#D1C9B9] rounded-full shadow-sm">
                <Target className="w-4 h-4 text-green-700" />
                <span className="font-bold text-green-800">{ats_score}/100</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {/* Header & Executive Summary */}
          <motion.div variants={item} className="space-y-6">
            <div>
              <p className="text-orange-700 font-semibold tracking-wide uppercase text-sm mb-2">Comprehensive Analysis</p>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black">
                Targeting: <span className="text-stone-500 font-light">{job_title || 'Professional Role'}</span>
              </h1>
            </div>
            
            {executive_summary && (
              <div className="bg-[#F4F1EA] p-8 rounded-2xl shadow-sm border border-[#D1C9B9]">
                <h3 className="text-lg font-bold text-black mb-3">Executive Summary</h3>
                <p className="text-stone-700 leading-relaxed text-lg">{executive_summary}</p>
              </div>
            )}
          </motion.div>

          {/* Skills Section */}
          {skills && skills.length > 0 && (
            <motion.div variants={item}>
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Core Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <span key={i} className="px-4 py-2 rounded-xl bg-[#F4F1EA] border border-[#D1C9B9] text-stone-800 text-sm font-semibold shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Key Strengths */}
            <motion.div variants={item} className="bg-[#F4F1EA] p-8 rounded-3xl shadow-sm border border-[#D1C9B9]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#E5DFD3] flex items-center justify-center border border-[#D1C9B9]">
                  <Zap className="w-6 h-6 text-green-700" />
                </div>
                <h2 className="text-2xl font-bold text-black">Key Strengths</h2>
              </div>
              
              <div className="space-y-6">
                {key_strengths && key_strengths.length > 0 ? (
                  key_strengths.map((strength: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-black text-lg mb-1">{strength.title}</h4>
                        <p className="text-stone-600 leading-relaxed">{strength.explanation}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-500">No specific strengths detected.</p>
                )}
              </div>
            </motion.div>

            {/* Areas for Improvement */}
            <motion.div variants={item} className="bg-[#F4F1EA] p-8 rounded-3xl shadow-sm border border-[#D1C9B9] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl -mr-20 -mt-20 opacity-40 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#E5DFD3] flex items-center justify-center border border-[#D1C9B9]">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-black">Actionable Feedback</h2>
              </div>
              
              <div className="space-y-6 relative z-10">
                {areas_for_improvement && areas_for_improvement.length > 0 ? (
                  areas_for_improvement.map((area: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#E5DFD3] flex items-center justify-center shrink-0 border border-[#D1C9B9]">
                        <div className="w-2 h-2 rounded-full bg-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-lg mb-1">{area.title}</h4>
                        <p className="text-stone-600 leading-relaxed">{area.explanation || area.actionable_advice}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-500">Your resume looks solid. Consider adding more metrics.</p>
                )}
              </div>

              {formatting_feedback && (
                <div className="mt-8 p-4 bg-[#E5DFD3] rounded-xl border border-[#D1C9B9] relative z-10 shadow-inner">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">Formatting</span>
                  <p className="text-sm text-stone-700">{formatting_feedback}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Live Jobs Section */}
          <motion.div variants={item} className="pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-black flex items-center gap-3 mb-2">
                  Recommended Opportunities
                </h2>
                <p className="text-stone-600">Real-time job listings matching your analyzed profile.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs && jobs.length > 0 ? (
                jobs.map((job: any, index: number) => (
                  <motion.div 
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    key={index} 
                    className="p-6 rounded-3xl bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                  >
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-[#E5DFD3] rounded-xl border border-[#D1C9B9] flex items-center justify-center mb-4">
                        <Briefcase className="w-6 h-6 text-stone-600" />
                      </div>
                      <h3 className="text-xl font-bold text-black mb-1 line-clamp-2">{job.job_title}</h3>
                      <p className="text-stone-700 font-medium">{job.employer_name}</p>
                      {job.job_city && (
                        <p className="text-sm text-stone-500 mt-2">{job.job_city}, {job.job_country}</p>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <a 
                        href={job.job_apply_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        Apply on Company Site
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full p-12 rounded-3xl bg-[#F4F1EA] border border-[#D1C9B9] border-dashed text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-[#E5DFD3] rounded-full flex items-center justify-center mb-4 border border-[#D1C9B9]">
                    <Briefcase className="w-8 h-8 text-stone-500" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">No live jobs found right now</h3>
                  <p className="text-stone-600 max-w-md">We couldn't find matching roles from our live provider. Check your RapidAPI limits or try again later.</p>
                </div>
              )}
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
