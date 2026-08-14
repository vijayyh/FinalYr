"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-8 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-40 -mt-40 -z-10" />
      
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
            Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Templates</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Start with our field-tested, ATS-friendly templates designed by industry experts to get you hired faster.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-5xl">
          {/* Classic Template Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col group"
          >
            <div className="relative aspect-[1/1.4] w-full rounded-2xl overflow-hidden border-2 border-border shadow-xl group-hover:border-indigo-500/50 group-hover:shadow-[0_20px_40px_rgba(99,102,241,0.2)] transition-all duration-300 bg-white dark:bg-zinc-900 p-8 flex flex-col items-center justify-center">
              <div className="w-full h-full border border-gray-200 dark:border-zinc-800 bg-white p-4 shadow-sm relative pointer-events-none">
                <div className="w-1/2 h-4 bg-gray-300 dark:bg-gray-700 mb-2 mx-auto rounded" />
                <div className="w-1/3 h-2 bg-gray-200 dark:bg-gray-600 mb-8 mx-auto rounded" />
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 mb-2 rounded" />
                <div className="w-5/6 h-2 bg-gray-200 dark:bg-gray-600 mb-6 rounded" />
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 mb-2 rounded" />
                <div className="w-5/6 h-2 bg-gray-200 dark:bg-gray-600 mb-2 rounded" />
                <div className="w-4/6 h-2 bg-gray-200 dark:bg-gray-600 mb-6 rounded" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-zinc-900 opacity-60" />
              </div>
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                <Link href="/builder">
                  <button className="px-6 py-3 rounded-full bg-white text-black font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                    Use Template <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-2xl font-bold mb-2">The Classic</h3>
              <p className="text-muted-foreground">Clean, traditional, and ATS-optimized. Perfect for corporate roles.</p>
            </div>
          </motion.div>

          {/* More Templates Coming Soon */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col justify-center h-full"
          >
            <div className="glass p-8 rounded-[2rem] border-white/20 dark:border-white/10 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Why use our templates?</h3>
              <ul className="space-y-4 mb-8">
                {[
                  "Passes all modern ATS systems",
                  "AI-assisted content generation",
                  "Perfect typographic hierarchy",
                  "One-click export to PDF"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-bold text-foreground">More templates arriving soon!</p>
                <p className="text-xs text-muted-foreground mt-1">Creative and Modern layouts are currently in development.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
