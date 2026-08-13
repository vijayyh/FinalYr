"use client";

import React from "react";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E5DFD3] text-stone-900 relative selection:bg-orange-200 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
