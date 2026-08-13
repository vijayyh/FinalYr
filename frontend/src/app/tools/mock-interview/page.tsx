"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Briefcase, Video, AlertCircle, ArrowRight, CheckCircle2, Play, CornerDownLeft, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type InterviewStatus = 'setup' | 'generating' | 'interviewing' | 'evaluating' | 'feedback' | 'finalizing' | 'finished';

type Question = {
  id: number;
  question: string;
  difficulty: string;
  focus: string;
};

type QnA = {
  question: Question;
  answer: string;
  feedback?: string;
};

export default function MockInterviewPage() {
  const [status, setStatus] = useState<InterviewStatus>('setup');
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  
  const [qnaHistory, setQnaHistory] = useState<QnA[]>([]);
  const [finalReview, setFinalReview] = useState<any>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedText = localStorage.getItem("resumeText");
    if (storedText) setResumeText(storedText);
  }, []);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (status === 'feedback' || status === 'interviewing') {
      setTimeout(scrollToBottom, 100);
    }
  }, [status, qnaHistory]);

  const handleStartInterview = async () => {
    if (!jobRole) return alert("Please enter a target role.");
    if (!resumeText) return alert("Please go to Home and upload a resume first.");

    setStatus('generating');
    try {
      const res = await fetch(`/api/mock-interview/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRole, jobDescription, resumeText }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setQnaHistory([]);
        setCurrentIndex(0);
        setStatus('interviewing');
      } else {
        throw new Error("Failed to generate valid questions.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate mock interview questions.");
      setStatus('setup');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    
    const currentQuestion = questions[currentIndex];
    
    // Optimistically update history
    const newHistory = [...qnaHistory, { question: currentQuestion, answer: currentAnswer }];
    setQnaHistory(newHistory);
    setStatus('evaluating');

    try {
      const res = await fetch(`/api/mock-interview/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          userAnswer: currentAnswer,
          jobRole,
          jobDescription,
          resumeText
        }),
      });
      const data = await res.json();
      
      if (data.feedback) {
        newHistory[newHistory.length - 1].feedback = data.feedback;
        setQnaHistory([...newHistory]);
        
        if (data.terminate) {
          alert("The AI Interviewer has terminated the interview due to inappropriate responses.");
          handleFinalize();
        } else {
          setStatus('feedback');
        }
      } else {
        console.error("Evaluation error:", data);
        alert(data.error || "Failed to evaluate answer. Proceeding to next question.");
        newHistory[newHistory.length - 1].feedback = "Oops, I had trouble evaluating that response! But let's keep moving forward.";
        setQnaHistory([...newHistory]);
        setStatus('feedback');
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to evaluate answer due to a network error. Proceeding to next question.");
      newHistory[newHistory.length - 1].feedback = "Oops, I had trouble evaluating that response! But let's keep moving forward.";
      setQnaHistory([...newHistory]);
      setStatus('feedback');
    }
  };

  const handleNextQuestion = () => {
    setCurrentAnswer("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setStatus('interviewing');
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    setStatus('finalizing');
    try {
      const res = await fetch(`/api/mock-interview/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allQnA: qnaHistory, jobRole }),
      });
      const data = await res.json();
      if (data.score !== undefined || data.rating) {
        setFinalReview(data);
        setStatus('finished');
      } else {
        throw new Error("Failed to finalize");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to compile final report.");
      setStatus('finished');
    }
  };

  const handleRestart = () => {
    setStatus('setup');
    setQnaHistory([]);
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setFinalReview(null);
  };

  const renderBadge = (difficulty: string) => {
    const diff = difficulty.toLowerCase();
    if (diff.includes('hard') || diff.includes('tricky')) return 'bg-red-50 text-red-700 border-red-200';
    if (diff.includes('medium')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-6 uppercase tracking-widest shadow-sm">
          <span>Interview Prep</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-black mb-4 leading-tight">Interactive Mock Interview</h1>
        <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
          Step into the hot seat. Practice answering tailored questions with real-time AI feedback to perfect your delivery before the real thing.
        </p>
      </div>

      {status === 'setup' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col gap-6"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-sm font-bold text-stone-600 uppercase tracking-widest mb-3 block">Target Role</label>
              <input 
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-stone-400 transition-all shadow-inner placeholder:text-stone-500 font-medium"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-bold text-stone-600 uppercase tracking-widest mb-3 block">Job Description (Optional)</label>
            <textarea 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here so we can ask highly specific scenario questions..."
              className="w-full h-32 bg-[#E5DFD3] border border-[#D1C9B9] rounded-2xl p-4 text-stone-900 focus:outline-none focus:border-stone-400 transition-all shadow-inner placeholder:text-stone-500 resize-none font-medium"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleStartInterview}
              className="px-8 py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              Start Mock Interview
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>
        </motion.div>
      )}

      {(status === 'generating' || status === 'finalizing') && (
        <div className="p-16 rounded-[2rem] bg-transparent border-2 border-dashed border-[#D1C9B9] text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#F4F1EA] flex items-center justify-center mb-6 border border-[#D1C9B9] shadow-sm">
            <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="font-bold text-xl text-stone-800 max-w-md">
            {status === 'generating' ? 'Analyzing your resume and building custom questions...' : 'Compiling your final interview report...'}
          </p>
        </div>
      )}

      {(status === 'interviewing' || status === 'evaluating' || status === 'feedback') && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-[#F4F1EA] px-6 py-4 rounded-2xl border border-[#D1C9B9] shadow-sm">
            <span className="font-bold text-stone-800 tracking-tight">Question {currentIndex + 1} of {questions.length}</span>
            <button 
              onClick={handleFinalize}
              className="text-xs font-bold text-stone-500 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              End Early
            </button>
          </div>

          <div className="flex flex-col gap-6 mb-8">
            {/* Show History */}
            {qnaHistory.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                {/* Question Bubble */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-black shrink-0 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white border border-[#D1C9B9] rounded-2xl rounded-tl-none p-5 shadow-sm">
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-stone-500 uppercase tracking-widest">{item.question.focus}</span>
                      <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest ${renderBadge(item.question.difficulty)}`}>{item.question.difficulty}</span>
                    </div>
                    <p className="text-stone-800 font-medium leading-relaxed">{item.question.question}</p>
                  </div>
                </div>
                
                {/* Answer Bubble */}
                <div className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-blue-600 shrink-0 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 max-w-[85%] bg-blue-50 border border-blue-200 rounded-2xl rounded-tr-none p-5 shadow-sm text-blue-900 font-medium whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </div>

                {/* Feedback Bubble */}
                {item.feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 shrink-0 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 max-w-[85%] bg-green-50 border border-green-200 rounded-2xl rounded-tl-none p-5 shadow-sm text-green-900 leading-relaxed font-medium">
                      {item.feedback}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}

            {/* Current Question Bubble (if not in feedback for this question yet) */}
            {status !== 'feedback' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black shrink-0 flex items-center justify-center shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 bg-white border-2 border-stone-300 rounded-2xl rounded-tl-none p-6 shadow-md relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5DFD3] rounded-full blur-2xl -mr-10 -mt-10 opacity-30 pointer-events-none" />
                   <div className="flex gap-2 mb-4 relative z-10">
                    <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      {questions[currentIndex].focus}
                    </span>
                    <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-widest ${renderBadge(questions[currentIndex].difficulty)}`}>
                      {questions[currentIndex].difficulty}
                    </span>
                  </div>
                  <p className="text-xl text-black font-extrabold leading-relaxed relative z-10">{questions[currentIndex].question}</p>
                </div>
              </motion.div>
            )}

            {/* Interaction Area */}
            {status === 'interviewing' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-end gap-3">
                <div className="w-full relative">
                  <textarea 
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 bg-white border-2 border-stone-300 rounded-2xl p-5 text-stone-900 focus:outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-stone-400 resize-none font-medium text-lg leading-relaxed"
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    Take your time
                  </div>
                </div>
                <button 
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim()}
                  className="px-8 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {status === 'evaluating' && (
              <div className="mt-4 flex justify-center py-8">
                 <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#E5DFD3] text-stone-600 font-bold text-sm">
                    <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
                    Evaluating your response...
                 </div>
              </div>
            )}

            {status === 'feedback' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex justify-end">
                <button 
                  onClick={handleNextQuestion}
                  className="px-8 py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {currentIndex + 1 < questions.length ? 'Next Question' : 'View Final Report'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            
            <div ref={endOfMessagesRef} />
          </div>
        </div>
      )}

      {status === 'finished' && finalReview && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-stone-200 rounded-[2rem] p-10 shadow-xl"
        >
          <div className="text-center mb-10">
            <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              {/* SVG Background Track */}
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="transparent" 
                  stroke="#E5DFD3" 
                  strokeWidth="8" 
                />
                {/* Animated Progress Ring */}
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="transparent" 
                  stroke="url(#gradient)" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "283", strokeDashoffset: "283" }}
                  animate={{ strokeDashoffset: 283 - (283 * (finalReview.score ?? parseInt(finalReview.rating) ?? 0)) / 10 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
              </svg>
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="relative z-10 flex flex-col items-center justify-center"
              >
                <span className="text-4xl font-extrabold text-black">
                  {finalReview.score !== undefined ? finalReview.score : (finalReview.rating ? finalReview.rating.split('/')[0] : 0)}
                  <span className="text-lg text-stone-400">/10</span>
                </span>
              </motion.div>
            </div>
            <h2 className="text-3xl font-extrabold text-black mb-4">Interview Complete</h2>
            <p className="text-lg text-stone-600 font-medium max-w-2xl mx-auto">{finalReview.summary}</p>
          </div>

          <div className="bg-[#F4F1EA] rounded-3xl p-8 mb-10">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Areas for Improvement
            </h3>
            <ul className="space-y-4">
              {finalReview.advice?.map((adv: string, i: number) => (
                <li key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-white border border-[#D1C9B9] shrink-0 flex items-center justify-center text-xs font-bold text-stone-500 mt-1">
                    {i + 1}
                  </div>
                  <p className="text-stone-800 font-medium leading-relaxed">{adv}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleRestart}
              className="px-8 py-4 rounded-2xl bg-black text-[#F4F1EA] hover:bg-stone-800 font-bold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <RefreshCcw className="w-4 h-4" /> Start New Interview
            </button>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
