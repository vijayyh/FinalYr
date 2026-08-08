"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, FileText, Mic, Briefcase, LayoutDashboard, Home, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Back to Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "ATS Score", href: "/tools/ats-score", icon: <ShieldCheck className="w-5 h-5" /> },
    { name: "Cover Letter", href: "/tools/cover-letter", icon: <FileText className="w-5 h-5" /> },
    { name: "Mock Interview", href: "/tools/mock-interview", icon: <Mic className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-background relative overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-foreground/10 bg-background/50 backdrop-blur-xl p-6 flex flex-col gap-8 z-20">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-indigo-500" />
          <span className="text-xl font-bold tracking-tight">ResumeAI Tools</span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20" 
                    : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                } ${item.name === "Back to Home" ? "mb-4 border-b border-foreground/10 pb-4 rounded-none bg-transparent" : ""}`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle Button */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-foreground/60 hover:bg-foreground/5 hover:text-foreground border border-transparent mt-auto"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 relative z-10">
         <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
