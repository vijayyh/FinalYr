"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookmarkCheck, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Plus, 
  RefreshCw, 
  RotateCcw, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  User, 
  ArrowRight, 
  Check, 
  History, 
  Calendar,
  X,
  Target
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface TrackedSkill {
  id: string;
  user_id: string;
  skill_name: string;
  category: string;
  source: string;
  status: "to_learn" | "in_progress" | "mastered" | "removed";
  target_role: string;
  notes: string;
  created_at: string;
  updated_at: string;
  removed_at?: string | null;
  removal_reason?: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  skill_id: string;
  skill_name: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function SkillTrackerPage() {
  const { currentUser, availableUsers, switchUser, refreshTrackedCount } = useUser();

  const [skills, setSkills] = useState<TrackedSkill[]>([]);
  const [removedSkills, setRemovedSkills] = useState<TrackedSkill[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    total_active: 0,
    to_learn: 0,
    in_progress: 0,
    mastered: 0,
    removed: 0,
  });

  const [activeTab, setActiveTab] = useState<"all" | "to_learn" | "in_progress" | "mastered" | "history">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newCategory, setNewCategory] = useState("Technical");
  const [newTargetRole, setNewTargetRole] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [removingSkill, setRemovingSkill] = useState<TrackedSkill | null>(null);
  const [removalReason, setRemovalReason] = useState("Mastered / Acquired");
  const [customRemovalReason, setCustomRemovalReason] = useState("");

  const [switchUserInput, setSwitchUserInput] = useState("");
  const [showSwitchUser, setShowSwitchUser] = useState(false);

  const fetchTrackerData = async () => {
    if (!currentUser?.userId) return;
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // Fetch active skills & stats
      const skillsRes = await fetch(`${API_URL}/api/tracker/skills?user_id=${encodeURIComponent(currentUser.userId)}`);
      if (skillsRes.ok) {
        const data = await skillsRes.json();
        setSkills(data.skills || []);
        if (data.stats) setStats(data.stats);
      }

      // Fetch removal history & audit log
      const historyRes = await fetch(`${API_URL}/api/tracker/history?user_id=${encodeURIComponent(currentUser.userId)}`);
      if (historyRes.ok) {
        const data = await historyRes.json();
        setActivityLogs(data.history || []);
        setRemovedSkills(data.removed_skills || []);
      }
    } catch (err) {
      console.error("Failed to load tracker data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [currentUser?.userId]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tracker/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.userId,
          skill_name: newSkillName.trim(),
          category: newCategory,
          source: "Manual",
          status: "to_learn",
          target_role: newTargetRole,
          notes: newNotes,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewSkillName("");
        setNewTargetRole("");
        setNewNotes("");
        await fetchTrackerData();
        await refreshTrackedCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (skillId: string, status: "to_learn" | "in_progress" | "mastered") => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/api/tracker/skills/${skillId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchTrackerData();
        await refreshTrackedCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmRemoveSkill = async () => {
    if (!removingSkill) return;
    const finalReason = removalReason === "Other" ? customRemovalReason : removalReason;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${API_URL}/api/tracker/skills/${removingSkill.id}?user_id=${encodeURIComponent(currentUser.userId)}&reason=${encodeURIComponent(finalReason || "Removed by user")}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setRemovingSkill(null);
        setCustomRemovalReason("");
        await fetchTrackerData();
        await refreshTrackedCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreSkill = async (skillId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${API_URL}/api/tracker/skills/${skillId}/restore?user_id=${encodeURIComponent(currentUser.userId)}`,
        { method: "POST" }
      );

      if (res.ok) {
        await fetchTrackerData();
        await refreshTrackedCount();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "N/A";
    try {
      const date = new Date(ts);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const calculateDuration = (created?: string, removed?: string | null) => {
    if (!created || !removed) return "recently";
    try {
      const start = new Date(created).getTime();
      const end = new Date(removed).getTime();
      const diffMs = Math.max(0, end - start);
      const mins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ${hours % 24}h`;
      if (hours > 0) return `${hours}h ${mins % 60}m`;
      return `${Math.max(1, mins)} min`;
    } catch {
      return "tracked";
    }
  };

  const filteredSkills = skills.filter((s) => {
    const matchesSearch = s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.notes.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    return s.status === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      
      {/* Header & User Profile Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#D1C9B9] pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F4F1EA] border border-[#D1C9B9] text-xs font-bold text-stone-600 mb-3 uppercase tracking-widest shadow-sm">
            <BookmarkCheck className="w-4 h-4 text-indigo-600" />
            <span>Multi-User Competency Tracker</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
            Skill Tracker & Removal Audit
          </h1>
          <p className="text-sm md:text-base text-stone-600 mt-2 max-w-2xl">
            Track competencies added from the Skill Gap Analyzer, organize learning progress, and maintain a timestamped removal audit trail.
          </p>
        </div>

        {/* User Switcher Card */}
        <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500">
              Active User Session
            </span>
            <button
              onClick={() => setShowSwitchUser(!showSwitchUser)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {showSwitchUser ? "Done" : "Switch User"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-black truncate">{currentUser.name}</h4>
              <p className="text-xs text-stone-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          {showSwitchUser && (
            <div className="pt-2 border-t border-[#D1C9B9] space-y-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase">Profiles:</span>
              <div className="flex flex-wrap gap-1.5">
                {availableUsers.map((userEmail) => (
                  <button
                    key={userEmail}
                    onClick={() => {
                      switchUser(userEmail);
                      setShowSwitchUser(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      currentUser.userId === userEmail || currentUser.email === userEmail
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-stone-200 hover:bg-stone-300 text-stone-800"
                    }`}
                  >
                    {userEmail.split("@")[0]}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (switchUserInput.trim()) {
                    switchUser(switchUserInput.trim());
                    setSwitchUserInput("");
                    setShowSwitchUser(false);
                  }
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  type="text"
                  placeholder="Or enter new username/email"
                  value={switchUserInput}
                  onChange={(e) => setSwitchUserInput(e.target.value)}
                  className="flex-1 bg-white border border-[#D1C9B9] rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-black text-white text-xs font-bold rounded-lg hover:bg-stone-800"
                >
                  Go
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div 
          onClick={() => setActiveTab("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "all" 
              ? "bg-black text-white border-black scale-[1.02]" 
              : "bg-[#F4F1EA] text-stone-800 border-[#D1C9B9] hover:border-black/50"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 block mb-1">
            Total Active
          </span>
          <div className="text-3xl font-black">{stats.total_active}</div>
        </div>

        <div 
          onClick={() => setActiveTab("to_learn")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "to_learn" 
              ? "bg-orange-600 text-white border-orange-600 scale-[1.02]" 
              : "bg-[#F4F1EA] text-orange-950 border-[#D1C9B9] hover:border-orange-500"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 block mb-1">
            To Learn
          </span>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400 group-hover:text-white">
            {stats.to_learn}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("in_progress")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "in_progress" 
              ? "bg-blue-600 text-white border-blue-600 scale-[1.02]" 
              : "bg-[#F4F1EA] text-blue-950 border-[#D1C9B9] hover:border-blue-500"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 block mb-1">
            In Progress
          </span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {stats.in_progress}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("mastered")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "mastered" 
              ? "bg-green-700 text-white border-green-700 scale-[1.02]" 
              : "bg-[#F4F1EA] text-green-950 border-[#D1C9B9] hover:border-green-600"
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 block mb-1">
            Mastered
          </span>
          <div className="text-3xl font-black text-green-700 dark:text-green-400">
            {stats.mastered}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("history")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            activeTab === "history" 
              ? "bg-red-700 text-white border-red-700 scale-[1.02]" 
              : "bg-[#F4F1EA] text-red-950 border-[#D1C9B9] hover:border-red-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-70 block mb-1">
              Removed Audit
            </span>
            <Clock className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="text-3xl font-black text-red-700 dark:text-red-400">
            {stats.removed}
          </div>
        </div>

      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#E5DFD3] rounded-2xl border border-[#D1C9B9] overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "all" ? "bg-white text-black shadow-sm" : "text-stone-600 hover:text-black"
            }`}
          >
            All Active ({stats.total_active})
          </button>
          <button
            onClick={() => setActiveTab("to_learn")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "to_learn" ? "bg-white text-black shadow-sm" : "text-stone-600 hover:text-black"
            }`}
          >
            To Learn ({stats.to_learn})
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "in_progress" ? "bg-white text-black shadow-sm" : "text-stone-600 hover:text-black"
            }`}
          >
            In Progress ({stats.in_progress})
          </button>
          <button
            onClick={() => setActiveTab("mastered")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "mastered" ? "bg-white text-black shadow-sm" : "text-stone-600 hover:text-black"
            }`}
          >
            Mastered ({stats.mastered})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "history" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:text-red-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Removed History ({stats.removed})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tracked skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F1EA] border border-[#D1C9B9] rounded-xl pl-9 pr-3 py-2 text-xs text-black focus:outline-none focus:border-stone-800 transition-colors placeholder:text-stone-400"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-black text-white hover:bg-stone-800 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm shrink-0 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>

          <Link
            href="/tools/skill-gap"
            className="px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-all flex items-center gap-1 shadow-sm shrink-0"
            title="Analyze more skills in Skill Gap Analyzer"
          >
            <span>Run Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Tab Content: Active Skills vs Removed History */}
      {activeTab !== "history" ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-16 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] text-center flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-bold text-stone-500">Loading your tracked skills...</p>
            </div>
          ) : filteredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSkills.map((skill) => (
                <motion.div
                  key={skill.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 rounded-[1.8rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm flex flex-col justify-between group hover:border-stone-500/50 transition-all hover:shadow-md relative overflow-hidden"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-200/70 border border-[#D1C9B9] text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                        {skill.category || "Technical"}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(skill.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    {/* Skill Title */}
                    <h3 className="text-xl font-black text-black tracking-tight mb-2">
                      {skill.skill_name}
                    </h3>

                    {/* Source / Target role */}
                    <div className="space-y-1 mb-4">
                      {skill.source && (
                        <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          Source: <span className="font-bold text-stone-700">{skill.source}</span>
                        </p>
                      )}
                      {skill.target_role && (
                        <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                          <Target className="w-3 h-3 text-stone-400 shrink-0" />
                          Target: <span className="font-bold text-stone-700">{skill.target_role}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="pt-4 border-t border-[#D1C9B9]/70 flex items-center justify-between gap-3">
                    
                    {/* Status Dropdown */}
                    <div className="relative flex-1">
                      <select
                        value={skill.status}
                        onChange={(e) => handleUpdateStatus(skill.id, e.target.value as any)}
                        className={`w-full text-xs font-extrabold px-3 py-1.5 rounded-xl border appearance-none cursor-pointer focus:outline-none transition-colors ${
                          skill.status === "mastered"
                            ? "bg-green-100 border-green-300 text-green-800"
                            : skill.status === "in_progress"
                            ? "bg-blue-100 border-blue-300 text-blue-800"
                            : "bg-orange-100 border-orange-300 text-orange-800"
                        }`}
                      >
                        <option value="to_learn">🟡 To Learn</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="mastered">🟢 Mastered</option>
                      </select>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      onClick={() => {
                        setRemovingSkill(skill);
                        setRemovalReason("Mastered / Acquired");
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                      title="Remove skill from active tracker (timestamp will be logged)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-[2rem] bg-[#F4F1EA] border-2 border-dashed border-[#D1C9B9] text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-200/60 flex items-center justify-center mb-4">
                <BookmarkCheck className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">No skills in this category</h3>
              <p className="text-xs text-stone-500 max-w-md mb-6 leading-relaxed">
                Run the Skill Gap Analyzer to identify and automatically track missing competencies, or manually add a skill.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/tools/skill-gap"
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-orange-300" />
                  <span>Explore Skill Gap Analyzer</span>
                </Link>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#D1C9B9] text-black text-xs font-bold hover:bg-stone-100 transition-all"
                >
                  Add Manually
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* REMOVED SKILLS & AUDIT LOG TAB */
        <div className="space-y-10">
          
          {/* Section 1: Removed Skills with exact timestamps and duration */}
          <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1C9B9] pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Removal Log & Timestamps</span>
                </div>
                <h3 className="text-2xl font-black text-black">Removed Competencies Audit</h3>
                <p className="text-xs text-stone-600 mt-1">
                  Every removed skill is preserved with its exact removal timestamp, reason, and time spent in active tracking.
                </p>
              </div>

              <span className="px-4 py-2 rounded-xl bg-white border border-[#D1C9B9] text-xs font-bold text-black shadow-xs shrink-0">
                {removedSkills.length} Total Removed
              </span>
            </div>

            {removedSkills.length > 0 ? (
              <div className="divide-y divide-[#D1C9B9]/60">
                {removedSkills.map((item) => (
                  <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-black">{item.skill_name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-extrabold uppercase">
                          {item.category || "Technical"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold">
                          Reason: {item.removal_reason || "Removed"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-500 font-medium">
                        <span className="flex items-center gap-1 text-red-700 font-bold">
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                          Removed At: {formatTimestamp(item.removed_at)}
                        </span>
                        <span>
                          Added: {formatTimestamp(item.created_at)}
                        </span>
                        <span className="font-semibold text-stone-700">
                          Active Duration: {calculateDuration(item.created_at, item.removed_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreSkill(item.id)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#D1C9B9] text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 shrink-0"
                      title="Restore back to active skills"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Restore Skill</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h4 className="text-base font-bold text-black mb-1">No Removed Skills Yet</h4>
                <p className="text-xs text-stone-500">
                  When you remove skills from the tracker, their exact removal timestamps and reasons will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Complete Activity Timeline */}
          <div className="p-8 rounded-[2rem] bg-[#F4F1EA] border border-[#D1C9B9] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#D1C9B9] pb-4">
              <div>
                <h4 className="text-lg font-black text-black">Action Timeline</h4>
                <p className="text-xs text-stone-500">Chronological history of additions, status progressions, and removals</p>
              </div>
              <History className="w-5 h-5 text-stone-400" />
            </div>

            {activityLogs.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D1C9B9]">
                {activityLogs.map((log) => (
                  <div key={log.id} className="relative flex items-start gap-4">
                    <span 
                      className={`w-5 h-5 rounded-full border-2 border-[#F4F1EA] flex items-center justify-center shrink-0 -ml-[19px] ${
                        log.action === "removed"
                          ? "bg-red-500"
                          : log.action === "restored"
                          ? "bg-indigo-500"
                          : log.action === "status_changed"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    />
                    <div className="bg-white/80 p-4 rounded-xl border border-[#D1C9B9] flex-1 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-black">
                          {log.skill_name} <span className="uppercase text-[10px] font-bold text-stone-500">({log.action})</span>
                        </span>
                        <span className="text-[11px] font-semibold text-stone-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">No activity recorded yet.</p>
            )}
          </div>

        </div>
      )}

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {removingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F4F1EA] border border-[#D1C9B9] rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-red-600 font-black text-lg">
                  <AlertCircle className="w-6 h-6" />
                  <span>Remove Tracked Skill</span>
                </div>
                <button
                  onClick={() => setRemovingSkill(null)}
                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-800">
                  Are you sure you want to remove <span className="font-black text-black">"{removingSkill.skill_name}"</span> from active tracking?
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  The exact removal time and reason will be recorded in your audit history.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                  Select Reason for Removal:
                </label>
                <div className="space-y-2">
                  {[
                    "Mastered / Acquired",
                    "No longer required for target job",
                    "Too advanced / Deprioritized",
                    "Duplicate entry",
                    "Other"
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        removalReason === reason
                          ? "bg-red-50 border-red-300 text-red-900 shadow-xs"
                          : "bg-white border-[#D1C9B9] text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="removalReason"
                        checked={removalReason === reason}
                        onChange={() => setRemovalReason(reason)}
                        className="accent-red-600"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {removalReason === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter custom reason..."
                    value={customRemovalReason}
                    onChange={(e) => setCustomRemovalReason(e.target.value)}
                    className="w-full bg-white border border-[#D1C9B9] rounded-xl p-3 text-xs text-black focus:outline-none focus:border-red-500"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D1C9B9]">
                <button
                  type="button"
                  onClick={() => setRemovingSkill(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D1C9B9] bg-white text-stone-700 text-xs font-bold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemoveSkill}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm"
                >
                  Confirm & Track Removal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Skill Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F4F1EA] border border-[#D1C9B9] rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-black font-black text-lg">
                  <BookmarkCheck className="w-6 h-6 text-indigo-600" />
                  <span>Add Skill to Tracker</span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSkill} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kubernetes, React Native, PyTorch"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full bg-white border border-[#D1C9B9] rounded-xl p-3 text-sm text-black focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-white border border-[#D1C9B9] rounded-xl p-3 text-xs font-bold text-black focus:outline-none"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Framework">Framework</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Cloud">Cloud</option>
                      <option value="Architecture">Architecture</option>
                      <option value="Soft Skill">Soft Skill</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                      Target Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Backend"
                      value={newTargetRole}
                      onChange={(e) => setNewTargetRole(e.target.value)}
                      className="w-full bg-white border border-[#D1C9B9] rounded-xl p-3 text-xs text-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1">
                    Notes / Target Learning Date
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Recommended bridge skill from Skill Gap Analyzer..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-white border border-[#D1C9B9] rounded-xl p-3 text-xs text-black focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D1C9B9]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D1C9B9] bg-white text-stone-700 text-xs font-bold hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-black hover:bg-stone-800 text-white text-xs font-extrabold shadow-sm"
                  >
                    Add to Tracker
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
