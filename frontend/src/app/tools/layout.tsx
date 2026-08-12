"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, FileText, Mic, LayoutDashboard, Home } from "lucide-react";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Back to Home", href: "/", icon: <Home className="w-5 h-5" /> },
    { name: "ATS Score", href: "/tools/ats-score", icon: <ShieldCheck className="w-5 h-5" /> },
    { name: "Cover Letter", href: "/tools/cover-letter", icon: <FileText className="w-5 h-5" /> },
    { name: "Mock Interview", href: "/tools/mock-interview", icon: <Mic className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#E5DFD3] text-stone-900 relative overflow-hidden selection:bg-orange-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#D1C9B9] bg-[#F4F1EA] p-6 flex flex-col gap-8 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
            <LayoutDashboard className="w-5 h-5 text-[#F4F1EA]" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-black">ResumePro</span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out ${
                  isActive 
                    ? "bg-[#E5DFD3] text-black border border-[#D1C9B9] shadow-sm font-bold" 
                    : "text-stone-500 hover:bg-[#E5DFD3] hover:text-stone-900 border border-transparent font-semibold"
                } ${item.name === "Back to Home" ? "mb-6 border-b border-[#D1C9B9] pb-4 rounded-none bg-transparent hover:bg-transparent shadow-none border-t-0 border-l-0 border-r-0" : ""}`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 md:p-16 relative z-10">
        {children}
      </main>
    </div>
  );
}
