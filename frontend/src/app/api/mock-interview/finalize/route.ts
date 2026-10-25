import { NextResponse } from "next/server";
import { callLLMJSON } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { allQnA, jobRole } = await request.json();

    if (!allQnA || !Array.isArray(allQnA) || allQnA.length === 0) {
      return NextResponse.json({ error: "Missing or invalid QnA history" }, { status: 400 });
    }

    const qnaText = allQnA.map((item: any, index: number) => `
Q${index + 1} (${item.question?.difficulty ?? "?"} - ${item.question?.focus ?? "?"}): ${item.question?.question ?? item.question}
Candidate's Answer: ${String(item.answer ?? "").slice(0, 3000)}
`).join("\n");

    const prompt = `Act as an expert technical recruiter and hiring manager. Review the following transcript of a mock interview for the role of "${jobRole}".

Interview Transcript:
${qnaText}

Evaluate the candidate's overall performance.
- Carefully calculate a final integer score out of 10.
- This score MUST reflect BOTH the quality of their answers AND the quantity of questions they completed. If they ended the interview early after only 1 or 2 questions, their score should be significantly lower (e.g., 2/10), regardless of how good that single answer was.
- Provide 3 to 5 actionable pieces of advice for improvement, focusing on their communication, technical depth, and structure.

Output MUST be a valid JSON object matching this exact schema:
{
  "score": number (integer from 0 to 10),
  "advice": [
    "string (actionable advice 1)",
    "string (actionable advice 2)"
  ],
  "summary": "string (A short 2-3 sentence overall summary of their performance)"
}
`;

    try {
      const parsed = await callLLMJSON<{ score?: unknown; advice?: unknown; summary?: unknown }>(prompt, {
        system: "You are an expert technical interviewer summarizing an interview. Output ONLY valid JSON.",
        temperature: 0.4,
        maxTokens: 1500,
      });
      const score = Math.max(0, Math.min(10, Math.round(Number(parsed.score))));
      if (!Number.isFinite(score)) throw new Error("Invalid score");
      const advice = Array.isArray(parsed.advice) ? parsed.advice.filter((a): a is string => typeof a === "string") : [];
      return NextResponse.json({
        score,
        advice,
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
      });
    } catch (err: any) {
      console.warn("Interview summary failed:", err.message);
      return NextResponse.json({
        score: Math.min(10, allQnA.length),
        advice: [
          "Use the STAR method (Situation, Task, Action, Result) for behavioral questions.",
          "Back up technical answers with specifics from your own projects.",
          "Quantify results wherever you can (time saved, users, performance gains).",
        ],
        summary: "The AI reviewer was unavailable, so this is a general summary. Your score reflects how many questions you completed.",
        fallback: true,
      });
    }
  } catch (err: any) {
    console.error("Finalize interview error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
