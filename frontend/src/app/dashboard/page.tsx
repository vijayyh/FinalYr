import React from "react";
import Link from "next/link";
import { 
  Target, 
  FileText, 
  Zap, 
  Layout, 
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart3,
  GitFork
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-x-hidden pt-12">
      
      {/* Background Decorators */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-40 animate-pulse -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="max-w-[1200px] w-full mx-auto px-8 relative z-10 pb-20">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Career Hub</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Track your progress, build new resumes, and practice interviews all in one place.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Recent Analysis Card */}
          <div className="md:col-span-2 glass p-8 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-colors" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Recent Analysis</h2>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold mb-1">Software Engineer Resume</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Analyzed just now
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block mb-1">ATS Score</span>
                  <div className="text-3xl font-extrabold text-green-500">85<span className="text-lg text-muted-foreground">/100</span></div>
                </div>
                
                <Link href="/analysis-report" className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform shadow-md">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass p-8 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-lg flex flex-col justify-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">3 Resumes</h4>
                <p className="text-sm text-muted-foreground">Optimized this week</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-lg">5 Interviews</h4>
                <p className="text-sm text-muted-foreground">Mock sessions completed</p>
              </div>
            </div>
          </div>

        </div>

        {/* Tools Section */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" /> Professional Tools
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/builder" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-purple-500/50">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">Resume Builder</h3>
              <p className="text-sm text-muted-foreground">Create a stunning, ATS-friendly resume from scratch.</p>
            </div>
          </Link>
          
          <Link href="/tools/cover-letter" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-blue-500/50">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">Cover Letter</h3>
              <p className="text-sm text-muted-foreground">Generate tailored cover letters instantly with AI.</p>
            </div>
          </Link>

          <Link href="/tools/mock-interview" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-green-500/50">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">Mock Interview</h3>
              <p className="text-sm text-muted-foreground">Practice real scenarios with our advanced AI persona.</p>
            </div>
          </Link>

          <Link href="/tools/ats-score" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-orange-500/50">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">ATS Check</h3>
              <p className="text-sm text-muted-foreground">Scan your resume against any job description.</p>
            </div>
          </Link>

          <Link href="/tools/skill-gap" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-orange-500/50">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                <GitFork className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">Skill Gap</h3>
              <p className="text-sm text-muted-foreground">Map prerequisite skills and visual roadmap pathways.</p>
            </div>
          </Link>

          <Link href="/tools/linkedin-optimizer" className="group">
            <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-sky-500/50">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4 group-hover:bg-sky-500 transition-colors">
                <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold mb-2">LinkedIn Optimizer</h3>
              <p className="text-sm text-muted-foreground">Transform your LinkedIn profile into a recruiter magnet.</p>
            </div>
          </Link>
        </div>

      </main>
    </div>
  );
}
