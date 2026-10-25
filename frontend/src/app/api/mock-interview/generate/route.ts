import { NextResponse } from "next/server";
import { callLLMJSON } from "@/lib/llm";

export const maxDuration = 60;

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Tricky", "Open-Ended"];

const FALLBACK_QUESTIONS = [
  { id: 1, question: "Walk me through your background and the project on your resume you're most proud of.", difficulty: "Easy", focus: "Background" },
  { id: 2, question: "Tell me about a time you had to learn a new technology quickly. How did you approach it?", difficulty: "Easy", focus: "Behavioral" },
  { id: 3, question: "Describe the hardest bug you've faced and how you found and fixed it.", difficulty: "Medium", focus: "Problem Solving" },
  { id: 4, question: "How do you make sure the code you ship is reliable and maintainable?", difficulty: "Medium", focus: "Engineering Practices" },
  { id: 5, question: "Describe a disagreement with a teammate about a technical decision. How was it resolved?", difficulty: "Medium", focus: "Behavioral" },
  { id: 6, question: "How would you design a scalable architecture for a high-traffic web application?", difficulty: "Hard", focus: "System Design" },
  { id: 7, question: "Pick a project from your resume: what would you change if it had to handle 10x the load?", difficulty: "Hard", focus: "Project Deep-Dive" },
  { id: 8, question: "If you had to ship a feature by tomorrow but knew it had a known edge-case bug, what would you do?", difficulty: "Tricky", focus: "Trade-offs" },
  { id: 9, question: "Where do you see yourself growing in this role over the next two years?", difficulty: "Open-Ended", focus: "Vision" },
];

export async function POST(request: Request) {
  try {
    const { jobRole, jobDescription = "", resumeText } = await request.json();

    if (!jobRole || !resumeText) {
      return NextResponse.json({ error: "Missing required fields: jobRole or resumeText" }, { status: 400 });
    }

    const prompt = `Act as an expert technical recruiter and hiring manager. Generate a list of 10 to 12 highly tailored interview questions for a candidate applying for the role of "${jobRole}".

Candidate Resume:
${String(resumeText).slice(0, 12000)}

Job Description:
${String(jobDescription).slice(0, 8000) || "Not provided (base questions strictly on the resume and standard expectations for this role)"}

Requirements for Questions:
- Generate 10 to 12 questions in total.
- Order them by difficulty progression:
  1. The first 2-3 questions MUST be "Easy" (ice breakers, basic background/resume review).
  2. The next 3-4 questions MUST be "Medium" (core technical or behavioral scenarios).
  3. The next 3-4 questions MUST be "Hard" (in-depth technical, system design, or complex problem-solving based on their resume projects).
  4. Include exactly 1 "Tricky" question (edge cases, difficult trade-offs).
  5. Include exactly 1 or 2 "Open-Ended" questions (vision, culture fit, or high-level architecture).
- The output MUST be a valid JSON object matching this exact schema (no markdown formatting, no comments, no extra text):
{
  "questions": [
    {
      "id": 1,
      "question": "string (the interview question)",
      "difficulty": "Easy" | "Medium" | "Hard" | "Tricky" | "Open-Ended",
      "focus": "string (e.g., 'React.js', 'System Design', 'Behavioral', 'Project Deep-Dive')"
    }
  ]
}
`;

    try {
      const parsed = await callLLMJSON<{ questions?: any[] }>(prompt, {
        system: "You are an expert technical interviewer. Output ONLY valid JSON.",
        temperature: 0.7,
        maxTokens: 3000,
      });
      const questions = (parsed.questions ?? [])
        .filter((q) => q && typeof q.question === "string" && q.question.trim())
        .map((q, i) => ({
          id: i + 1,
          question: q.question.trim(),
          difficulty: DIFFICULTIES.includes(q.difficulty) ? q.difficulty : "Medium",
          focus: typeof q.focus === "string" && q.focus.trim() ? q.focus.trim() : "General",
        }));
      if (questions.length >= 3) return NextResponse.json({ questions });
      throw new Error("Too few valid questions returned");
    } catch (err: any) {
      console.warn("Question generation failed, using fallback set:", err.message);
      return NextResponse.json({ questions: FALLBACK_QUESTIONS, fallback: true });
    }
  } catch (err: any) {
    console.error("Generate questions error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
