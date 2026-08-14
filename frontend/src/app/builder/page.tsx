"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, Download } from "lucide-react";

type Personal = { name: string; email: string; phone: string; linkedin: string };
type Education = { degree: string; university: string; year: string };
type Experience = { job_title: string; company: string; date: string; description: string };

type FormData = {
  personal: Personal;
  education: Education[];
  experience: Experience[];
  skills: string;
};

type GeneratedResume = {
  personal: Personal;
  summary: string;
  education: Education[];
  experience: (Experience & { bullets: string[] })[];
  skills: string[];
};

const STEPS = ["Personal Details", "Education", "Experience", "Skills", "Preview"];

export default function BuilderPage() {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    personal: { name: "", email: "", phone: "", linkedin: "" },
    education: [{ degree: "", university: "", year: "" }],
    experience: [{ job_title: "", company: "", date: "", description: "" }],
    skills: ""
  });

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      personal: { ...formData.personal, [e.target.name]: e.target.value }
    });
  };

  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newEdu = [...formData.education];
    newEdu[index] = { ...newEdu[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, education: newEdu });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: "", university: "", year: "" }]
    });
  };

  const removeEducation = (index: number) => {
    const newEdu = formData.education.filter((_, i) => i !== index);
    setFormData({ ...formData, education: newEdu });
  };

  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newExp = [...formData.experience];
    newExp[index] = { ...newExp[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, experience: newExp });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, { job_title: "", company: "", date: "", description: "" }]
    });
  };

  const removeExperience = (index: number) => {
    const newExp = formData.experience.filter((_, i) => i !== index);
    setFormData({ ...formData, experience: newExp });
  };

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/build-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.status === "success") {
        setGeneratedResume(data.data);
        setStep(4); // Move to preview
      } else {
        alert("Failed to generate resume. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to the backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  const nextStep = () => {
    if (step === 3) {
      generateResume();
    } else {
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8 print:py-0 print:px-0 print:bg-white">
      <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
        
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-8 relative print:hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 transition-all duration-300 -z-10" 
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                step >= i ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "bg-card border-2 border-border text-muted-foreground"
              }`}>
                {step > i ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-xs mt-2 font-medium hidden md:block ${step >= i ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass rounded-[2rem] p-6 md:p-10 shadow-2xl border border-white/20 dark:border-white/10 relative min-h-[500px] print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:bg-none print:block">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-[2rem] z-50">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold animate-pulse">AI is polishing your resume...</h3>
              <p className="text-muted-foreground mt-2">Enhancing verbs, fixing grammar, and generating summary.</p>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              
              {/* STEP 1: Personal */}
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Personal Details</h2>
                    <p className="text-muted-foreground">Let's start with the basics.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Full Name</label>
                      <input name="name" value={formData.personal.name} onChange={handlePersonalChange} className="w-full p-3 rounded-xl bg-card border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Email</label>
                      <input name="email" value={formData.personal.email} onChange={handlePersonalChange} className="w-full p-3 rounded-xl bg-card border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Phone</label>
                      <input name="phone" value={formData.personal.phone} onChange={handlePersonalChange} className="w-full p-3 rounded-xl bg-card border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold">LinkedIn / Website</label>
                      <input name="linkedin" value={formData.personal.linkedin} onChange={handlePersonalChange} className="w-full p-3 rounded-xl bg-card border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="linkedin.com/in/johndoe" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Education */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Education</h2>
                    <p className="text-muted-foreground">Where did you study?</p>
                  </div>
                  {formData.education.map((edu, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-card border border-border relative">
                      {formData.education.length > 1 && (
                        <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Degree / Major</label>
                          <input name="degree" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="B.S. Computer Science" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">University / School</label>
                          <input name="university" value={edu.university} onChange={(e) => handleEducationChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="Stanford University" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold">Graduation Year</label>
                          <input name="year" value={edu.year} onChange={(e) => handleEducationChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="2024" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addEducation} className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2 font-bold">
                    <Plus className="w-5 h-5" /> Add Another Education
                  </button>
                </div>
              )}

              {/* STEP 3: Experience */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Experience</h2>
                    <p className="text-muted-foreground">Don't worry about making it sound perfect. Just write what you did, and our AI will polish it!</p>
                  </div>
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="p-6 rounded-2xl bg-card border border-border relative">
                      {formData.experience.length > 1 && (
                        <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Job Title</label>
                          <input name="job_title" value={exp.job_title} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="Software Engineer" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Company</label>
                          <input name="company" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="Google" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold">Dates (e.g., Jan 2021 - Present)</label>
                          <input name="date" value={exp.date} onChange={(e) => handleExperienceChange(index, e)} className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none" placeholder="Jan 2021 - Present" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold flex items-center justify-between">
                            Description
                            <span className="text-xs text-indigo-500 font-normal">AI will rewrite this</span>
                          </label>
                          <textarea 
                            name="description" 
                            value={exp.description} 
                            onChange={(e) => handleExperienceChange(index, e)} 
                            className="w-full p-3 rounded-xl bg-background border border-border focus:border-indigo-500 outline-none min-h-[100px]" 
                            placeholder="I built a new feature that increased sales. I fixed bugs using React. I managed a team of 3." 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addExperience} className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2 font-bold">
                    <Plus className="w-5 h-5" /> Add Another Experience
                  </button>
                </div>
              )}

              {/* STEP 4: Skills */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">Skills & Technologies</h2>
                    <p className="text-muted-foreground">List your core skills separated by commas.</p>
                  </div>
                  <div className="space-y-2">
                    <textarea 
                      value={formData.skills} 
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })} 
                      className="w-full p-4 rounded-2xl bg-card border border-border focus:border-indigo-500 outline-none min-h-[150px] leading-relaxed" 
                      placeholder="React, Next.js, Node.js, Python, TypeScript, SQL, Project Management..." 
                    />
                  </div>
                </div>
              )}

              {/* STEP 5: PREVIEW */}
              {step === 4 && generatedResume && (
                <div className="space-y-6 print:space-y-0">
                  <div className="flex items-center justify-between print:hidden">
                    <h2 className="text-2xl font-bold text-green-500 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" /> Resume Generated!
                    </h2>
                    <button onClick={downloadPDF} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg">
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto pb-8 print:overflow-visible print:pb-0">
                    <div className="min-w-[800px] w-full flex justify-center print:min-w-0 print:w-auto print:block">
                      {/* A4 Classic Resume Preview */}
                      <div id="resume-preview" className="w-[816px] h-[1056px] bg-white text-black p-12 shadow-2xl shrink-0 font-serif leading-relaxed print:w-auto print:h-auto print:shadow-none print:p-0 print:m-0">
                        
                        {/* Header */}
                        <div className="text-center border-b-2 border-black pb-4 mb-4">
                          <h1 className="text-4xl font-bold mb-2 uppercase tracking-wide">{generatedResume.personal.name}</h1>
                          <div className="text-sm flex items-center justify-center gap-4 text-gray-700">
                            {generatedResume.personal.email && <span>{generatedResume.personal.email}</span>}
                            {generatedResume.personal.phone && <span>• {generatedResume.personal.phone}</span>}
                            {generatedResume.personal.linkedin && <span>• {generatedResume.personal.linkedin}</span>}
                          </div>
                        </div>

                        {/* Summary */}
                        {generatedResume.summary && (
                          <div className="mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-2">Professional Summary</h2>
                            <p className="text-sm">{generatedResume.summary}</p>
                          </div>
                        )}

                        {/* Experience */}
                        {generatedResume.experience && generatedResume.experience.length > 0 && (
                          <div className="mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3">Professional Experience</h2>
                            <div className="space-y-4">
                              {generatedResume.experience.map((exp, i) => (
                                <div key={i}>
                                  <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-base font-bold">{exp.job_title}</h3>
                                    <span className="text-sm italic">{exp.date}</span>
                                  </div>
                                  <div className="text-sm font-semibold mb-2">{exp.company}</div>
                                  <ul className="list-disc pl-5 text-sm space-y-1">
                                    {exp.bullets.map((b, idx) => (
                                      <li key={idx} className="pl-1">{b}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        {generatedResume.education && generatedResume.education.length > 0 && (
                          <div className="mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3">Education</h2>
                            <div className="space-y-3">
                              {generatedResume.education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                  <div>
                                    <h3 className="text-base font-bold">{edu.university}</h3>
                                    <div className="text-sm">{edu.degree}</div>
                                  </div>
                                  <span className="text-sm italic">{edu.year}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        {generatedResume.skills && generatedResume.skills.length > 0 && (
                          <div>
                            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-2">Skills</h2>
                            <p className="text-sm">{generatedResume.skills.join(" • ")}</p>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between print:hidden">
            {step > 0 ? (
              <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            
            <button 
              onClick={nextStep} 
              disabled={isGenerating}
              className="px-6 py-3 rounded-xl bg-foreground text-background font-bold hover:bg-foreground/90 transition-transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              {step === 3 ? "Generate with AI" : "Next Step"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
