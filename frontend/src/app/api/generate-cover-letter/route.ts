import { NextResponse } from "next/server";
import { callLLM } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { jobRole, companyName, jobDescription = "", resumeText = "", tone = "Professional" } = await request.json();

    if (!jobRole || !companyName) {
      return NextResponse.json({ error: "Missing required fields: jobRole or companyName" }, { status: 400 });
    }

    const systemPrompt = `You are an expert career consultant and professional resume writer.
Draft a highly tailored, short, crisp, and direct cover letter for a candidate applying for the role of "${jobRole}" at "${companyName}".
Adopt a "${tone}" tone throughout the letter.

Strict Rules:
1. Word Count & Length: Strictly limit the cover letter to 150 to 200 words, structured into exactly 3 short, direct paragraphs.
2. No Fluff: Do NOT include generic introductory fluff or filler phrases (e.g., REMOVE phrases like "I am writing to express my interest...", "I am a motivated candidate...", "I believe technology changes the world..."). Start immediately with facts.
3. Structure:
   - Paragraph 1 (Immediate Hook): State the target role, company, and top 2 relevant core skills/achievements directly from the candidate's resume (1-2 sentences max).
   - Paragraph 2 (Key Impact): Detail exactly 1 standout project or work experience directly matching the target job description, mentioning concrete tools used and quantifiable metrics/results (2-3 sentences max).
   - Paragraph 3 (Closing): A single direct closing sentence with a call to action and a request for an interview (1 sentence max).
4. No Hallucinations: Extract ONLY facts, projects, tools, and metrics directly present in the candidate's resume. Do not invent any details. Never add a number, percentage, or metric (e.g. cost savings, uptime) that does not appear word-for-word in the resume; if no metric exists, describe the impact qualitatively.
5. Format: Output ONLY the letter text (salutation, the three paragraphs, and closing). Do not include markdown blocks, notes, date placeholders, or meta-commentary.
6. If the resume is very short, still write the best possible letter from what is there. Never refuse or explain; always output a letter.

Candidate Resume Text:
${String(resumeText).slice(0, 12000) || "Not provided (use general software engineering skills matching the role)"}

Target Job Description:
${String(jobDescription).slice(0, 8000) || "Not provided (optimize for standard skills required for the role)"}
`;

    try {
      const { text } = await callLLM(systemPrompt, {
        system: "You are a professional cover letter helper.",
        temperature: 0.4,
        maxTokens: 4000, // medium reasoning tokens count against this budget
        reasoningEffort: "medium",
      });
      const letter = text.replace(/^```\w*\s*/, "").replace(/\s*```$/, "").trim();
      return NextResponse.json({ status: "success", letter });
    } catch (err: any) {
      return NextResponse.json({
        status: "error",
        message: "Could not generate cover letter right now. Please try again in a moment.",
        details: err.message,
      }, { status: 503 });
    }
  } catch (err: any) {
    console.error("API handler failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
