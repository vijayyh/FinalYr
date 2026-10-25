"use client";

import React, { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence, animate, useInView, useReducedMotion, Variants } from "framer-motion";
import {
  Target, FileText, Zap, Layout, Sparkles, ArrowRight, Clock, BarChart3, GitFork, BookmarkCheck,
  TrendingUp, Activity as ActivityIcon, Mic, Trash2, Lightbulb,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
  Activity, ActivityType, activitySnapshot, activityServerSnapshot, subscribeActivity, clearActivity,
} from "@/lib/activity";

// ── Config ──────────────────────────────────────────────────────────────────────

const TYPE_META: Record<ActivityType, { label: string; icon: React.ElementType; color: string; href: string }> = {
  ats: { label: "ATS Check", icon: Target, color: "#f97316", href: "/tools/ats-score" },
  "cover-letter": { label: "Cover Letter", icon: Layout, color: "#3b82f6", href: "/tools/cover-letter" },
  interview: { label: "Mock Interview", icon: Mic, color: "#22c55e", href: "/tools/mock-interview" },
  resume: { label: "Resume Builder", icon: FileText, color: "#a855f7", href: "/builder" },
  linkedin: { label: "LinkedIn", icon: Sparkles, color: "#0ea5e9", href: "/tools/linkedin-optimizer" },
  "skill-gap": { label: "Skill Gap", icon: GitFork, color: "#eab308", href: "/tools/skill-gap" },
};

const TOOLS = [
  { href: "/builder", title: "Resume Builder", desc: "Create an ATS-friendly resume from scratch with AI-polished bullets.", icon: FileText, color: "#a855f7" },
  { href: "/tools/ats-score", title: "ATS Check", desc: "Score your resume against any job description, keyword by keyword.", icon: Target, color: "#f97316" },
  { href: "/tools/cover-letter", title: "Cover Letter", desc: "Tailored, fact-checked cover letters in seconds.", icon: Layout, color: "#3b82f6" },
  { href: "/tools/mock-interview", title: "Mock Interview", desc: "Practice questions built from your resume, with live feedback.", icon: Zap, color: "#22c55e" },
  { href: "/tools/skill-gap", title: "Skill Gap", desc: "See exactly which skills stand between you and the role.", icon: GitFork, color: "#eab308" },
  { href: "/tools/skill-tracker", title: "Skill Tracker", desc: "Track the skills you're learning and watch the list shrink.", icon: BookmarkCheck, color: "#6366f1" },
  { href: "/tools/linkedin-optimizer", title: "LinkedIn Optimizer", desc: "Turn your profile into a recruiter magnet.", icon: Sparkles, color: "#0ea5e9" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(ts).toLocaleDateString();
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const scoreColor = (s: number) => (s >= 80 ? "#22c55e" : s >= 60 ? "#f97316" : "#ef4444");

// ── Motion primitives ──────────────────────────────────────────────────────────

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 26 } },
};

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = `${Math.round(v)}${suffix}`; },
    });
    return () => controls.stop();
  }, [inView, value, suffix, reduce]);
  return <span ref={ref}>0{suffix}</span>;
}

function ScoreRing({ score, size = 168 }: { score: number | null; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const pct = score === null ? 0 : score / 100;
  const color = score === null ? "var(--muted-foreground)" : scoreColor(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tracking-tight" style={{ color: score === null ? undefined : color }}>
          {score === null ? "—" : <CountUp value={score} />}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Readiness</span>
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 320, h = 96, pad = 8;
  if (points.length === 0) return null;
  const pts = points.length === 1 ? [points[0], points[0]] : points;
  // Zoom the y-axis to the data (±10 pts) so small improvements are visible.
  const lo = Math.max(0, Math.min(...pts) - 10);
  const hi = Math.min(100, Math.max(...pts) + 10);
  const yOf = (p: number) => h - pad - ((p - lo) / Math.max(hi - lo, 1)) * (h - pad * 2);
  const xy = pts.map((p, i) => [pad + (i * (w - pad * 2)) / (pts.length - 1), yOf(p)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${h} L${xy[0][0].toFixed(1)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#spark-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
      <motion.path
        d={line} fill="none" stroke="#6366f1" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
      />
      {xy.map(([x, y], i) => (
        <motion.circle
          key={i} cx={x} cy={y} r={4} fill="#6366f1" stroke="var(--background)" strokeWidth={2}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + (i / xy.length) * 1.1, type: "spring", stiffness: 400 }}
        />
      ))}
    </svg>
  );
}

function AnimatedBackdrop() {
  const reduce = useReducedMotion();
  const orbs = [
    { cls: "top-[-10%] right-[-5%] w-[520px] h-[520px] from-indigo-500/25 via-purple-500/15", x: [0, -60, 0], y: [0, 40, 0], d: 18 },
    { cls: "bottom-[-10%] left-[-8%] w-[460px] h-[460px] from-sky-500/20 via-blue-500/10", x: [0, 50, 0], y: [0, -30, 0], d: 22 },
    { cls: "top-[35%] left-[40%] w-[300px] h-[300px] from-fuchsia-500/15 via-pink-500/5", x: [0, 40, -30, 0], y: [0, -40, 20, 0], d: 26 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--muted-foreground) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at top, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 20%, transparent 70%)",
        }}
      />
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl bg-gradient-to-br to-transparent ${o.cls}`}
          animate={reduce ? undefined : { x: o.x, y: o.y }}
          transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser, trackedSkillsCount } = useUser();
  const activity = useSyncExternalStore(subscribeActivity, activitySnapshot, activityServerSnapshot);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const stats = useMemo(() => {
    const byType = (t: ActivityType) => activity.filter((a) => a.type === t);
    const latestScore = (t: ActivityType) => byType(t).find((a) => typeof a.score === "number")?.score;
    const parts = [latestScore("ats"), latestScore("interview"), latestScore("skill-gap")].filter(
      (s): s is number => typeof s === "number"
    );
    const atsHistory = byType("ats").filter((a) => typeof a.score === "number").slice(0, 10).reverse().map((a) => a.score as number);
    return {
      readiness: parts.length ? Math.round(parts.reduce((x, y) => x + y, 0) / parts.length) : null,
      latestATS: latestScore("ats"),
      latestInterview: latestScore("interview"),
      atsHistory,
      counts: {
        ats: byType("ats").length,
        interview: byType("interview").length,
        "cover-letter": byType("cover-letter").length,
        resume: byType("resume").length,
      },
    };
  }, [activity]);

  const nextSteps = useMemo(() => {
    const steps: { text: string; href: string; cta: string }[] = [];
    if (stats.counts.resume === 0 && stats.counts.ats === 0)
      steps.push({ text: "Start by building your resume, or upload an existing one to the ATS checker.", href: "/builder", cta: "Build resume" });
    if (stats.latestATS === undefined)
      steps.push({ text: "Run an ATS check against a job you want to see your keyword match.", href: "/tools/ats-score", cta: "Check ATS" });
    else if (stats.latestATS < 80)
      steps.push({ text: `Your last ATS score was ${stats.latestATS}. Add the missing keywords and quantify more bullets.`, href: "/tools/ats-score", cta: "Improve score" });
    if (stats.latestInterview === undefined)
      steps.push({ text: "Practice a mock interview tailored to your resume.", href: "/tools/mock-interview", cta: "Start interview" });
    else if (stats.latestInterview < 70)
      steps.push({ text: `Interview score ${Math.round(stats.latestInterview / 10)}/10. Another round with STAR-structured answers will help.`, href: "/tools/mock-interview", cta: "Practice again" });
    if (trackedSkillsCount > 0)
      steps.push({ text: `You're tracking ${trackedSkillsCount} skill${trackedSkillsCount === 1 ? "" : "s"} to learn. Mark them done as you go.`, href: "/tools/skill-tracker", cta: "Open tracker" });
    if (stats.counts["cover-letter"] === 0)
      steps.push({ text: "Generate a tailored cover letter for your next application.", href: "/tools/cover-letter", cta: "Write letter" });
    return steps.slice(0, 3);
  }, [stats, trackedSkillsCount]);

  const firstName = (currentUser?.name || "there").split(" ")[0];
  const statTiles = [
    { label: "ATS checks", value: stats.counts.ats, icon: Target, color: "#f97316" },
    { label: "Interviews", value: stats.counts.interview, icon: Mic, color: "#22c55e" },
    { label: "Cover letters", value: stats.counts["cover-letter"], icon: Layout, color: "#3b82f6" },
    { label: "Skills tracked", value: trackedSkillsCount, icon: BookmarkCheck, color: "#6366f1" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-x-hidden pt-12">
      <AnimatedBackdrop />

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1200px] w-full mx-auto px-4 sm:px-8 relative z-10 pb-20"
      >
        {/* Header */}
        <motion.div variants={rise} className="mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-indigo-500"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {mounted ? greeting() : "Welcome"}, {firstName}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Your{" "}
            <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#6366f1)] bg-[length:300%_100%] animate-[gradient-pan_6s_linear_infinite]">
              Career Hub
            </span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Every check, letter and interview you run shows up here, so you can see your progress at a glance.
          </p>
        </motion.div>

        {/* Top row: readiness + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            variants={rise}
            className="glass p-6 sm:p-8 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-lg flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <ScoreRing score={stats.readiness} />
            <h2 className="text-lg font-bold mt-5">Career readiness</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-[16rem]">
              {stats.readiness === null
                ? "Run an ATS check or a mock interview to get your first score."
                : "Average of your latest ATS, interview and skill-match scores."}
            </p>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {statTiles.map((t) => (
              <motion.div
                key={t.label}
                variants={rise}
                whileHover={{ y: -4 }}
                className="glass p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md relative overflow-hidden group"
              >
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: t.color }}
                />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${t.color}1f` }}>
                  <t.icon className="w-5 h-5" style={{ color: t.color }} />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  <CountUp value={t.value} />
                </div>
                <p className="text-sm font-semibold text-muted-foreground mt-1">{t.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Middle row: trend + next steps + activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <motion.div variants={rise} className="lg:col-span-2 glass p-6 sm:p-8 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-lg">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">ATS score trend</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    {stats.atsHistory.length <= 1 ? "Run more checks to see your trend" : `Your last ${stats.atsHistory.length} checks`}
                  </p>
                </div>
              </div>
              {stats.latestATS !== undefined && (
                <div className="text-right">
                  <div className="text-3xl font-extrabold" style={{ color: scoreColor(stats.latestATS) }}>
                    <CountUp value={stats.latestATS} />
                    <span className="text-base text-muted-foreground">/100</span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Latest</p>
                </div>
              )}
            </div>
            {stats.atsHistory.length > 0 ? (
              <Sparkline points={stats.atsHistory} />
            ) : (
              <div className="h-24 rounded-2xl border border-dashed border-border flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" /> No ATS checks yet.
                <Link href="/tools/ats-score" className="font-bold text-indigo-500 hover:underline">Run one →</Link>
              </div>
            )}

            {nextSteps.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Suggested next steps
                </h3>
                <div className="space-y-2">
                  {nextSteps.map((s, i) => (
                    <motion.div
                      key={s.text}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <Link
                        href={s.href}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 rounded-2xl bg-card/60 border border-border hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors group"
                      >
                        <span className="text-sm font-medium">{s.text}</span>
                        <span className="shrink-0 text-xs font-bold text-indigo-500 flex items-center gap-1">
                          {s.cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={rise} className="glass p-6 sm:p-8 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-indigo-500" /> Recent activity
              </h2>
              {activity.length > 0 && (
                <button
                  onClick={() => { if (confirm("Clear your activity history on this device?")) clearActivity(); }}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  title="Clear history"
                  aria-label="Clear activity history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {activity.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
                <Clock className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nothing yet. Use any tool and it will appear here.</p>
              </div>
            ) : (
              <ol className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                <AnimatePresence initial={false}>
                  {activity.slice(0, 6).map((a: Activity, i) => {
                    const meta = TYPE_META[a.type];
                    if (!meta) return null;
                    return (
                      <motion.li
                        key={a.id}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.06 } }}
                        exit={{ opacity: 0, x: -16 }}
                        className="relative flex items-start gap-3"
                      >
                        <div
                          className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background"
                          style={{ background: `${meta.color}22` }}
                        >
                          <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                        <Link href={meta.href} className="min-w-0 flex-1 group">
                          <p className="text-sm font-semibold truncate group-hover:text-indigo-500 transition-colors">{a.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {mounted ? timeAgo(a.at) : ""}
                            {typeof a.score === "number" && (
                              <span className="font-bold" style={{ color: scoreColor(a.score) }}>· {a.score}/100</span>
                            )}
                          </p>
                        </Link>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            )}
          </motion.div>
        </div>

        {/* Tools */}
        <motion.h2 variants={rise} className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" /> Professional tools
        </motion.h2>
        <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map((t) => (
            <motion.div key={t.href} variants={rise} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}>
              <Link href={t.href} className="group block h-full">
                <div className="glass h-full p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-md hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(120% 80% at 0% 0%, ${t.color}1a, transparent 60%)` }}
                  />
                  <div className="relative">
                    <motion.div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                      style={{ background: `${t.color}1a` }}
                      whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    >
                      <t.icon className="w-5 h-5" style={{ color: t.color }} />
                    </motion.div>
                    <h3 className="font-bold mb-2 flex items-center gap-1">
                      {t.title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>
    </div>
  );
}
