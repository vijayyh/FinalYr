import axios from 'axios';

// Defaults to the deployed backend so the app works over any network without
// requiring the phone and dev machine to share a Wi-Fi network. Override with
// EXPO_PUBLIC_API_URL (see .env.example) to point at a local backend during development.
const PRODUCTION_API_URL = "https://resumepro-backend-cthc.onrender.com";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return PRODUCTION_API_URL;
};

export const API_URL = getBaseUrl();

export const uploadResume = async (fileUri: string, fileName: string, mimeType: string) => {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: mimeType || "application/pdf",
  } as any);

  try {
    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.response?.data?.detail || error.message}`);
  }
};

export const atsScore = async (resumeText: string, jobDescription: string) => {
  const response = await fetch(`${API_URL}/api/tools/ats-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });
  if (!response.ok) throw new Error("ATS score request failed");
  return response.json();
};

export const generateCoverLetter = async (jobRole: string, companyName: string, resumeText: string) => {
  const response = await fetch(`${API_URL}/api/tools/cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_role: jobRole, company_name: companyName, resume_text: resumeText }),
  });
  if (!response.ok) throw new Error("Cover letter request failed");
  return response.json();
};

export const generateMockInterview = async (jobRole: string, resumeText: string) => {
  const response = await fetch(`${API_URL}/api/tools/mock-interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_role: jobRole, resume_text: resumeText }),
  });
  if (!response.ok) throw new Error("Mock interview request failed");
  return response.json();
};

export const analyzeSkillGap = async (resumeText: string, jobDescription: string) => {
  const response = await fetch(`${API_URL}/api/tools/skill-gap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });
  if (!response.ok) throw new Error("Skill gap request failed");
  return response.json();
};

export const optimizeLinkedIn = async (resumeText: string) => {
  const response = await fetch(`${API_URL}/api/tools/linkedin-optimizer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText }),
  });
  if (!response.ok) throw new Error("LinkedIn optimizer request failed");
  return response.json();
};

export const buildResume = async (payload: {
  personal: Record<string, string>;
  education: { degree: string; university: string; year: string }[];
  experience: { job_title: string; company: string; date: string; description: string }[];
  skills: string;
}) => {
  const response = await fetch(`${API_URL}/api/build-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Resume builder request failed");
  return response.json();
};
