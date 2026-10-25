import { NextResponse } from "next/server";
import { callLLMJSON } from "@/lib/llm";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { question, userAnswer, jobRole, jobDescription, resumeText } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json({ error: "Missing question or userAnswer" }, { status: 400 });
    }

    const questionText = typeof question === "string" ? question : question.question;

    const prompt = `Act as an expert technical recruiter and hiring manager interviewing a candidate for the role of "${jobRole}".
You asked the candidate the following question:
"${questionText}"

The candidate provided the following answer:
"${String(userAnswer).slice(0, 6000)}"

Candidate's Resume Context (use this to evaluate if they accurately referenced their experience):
${String(resumeText || "").slice(0, 10000)}
${jobDescription ? `\nJob Description:\n${String(jobDescription).slice(0, 6000)}\n` : ""}
Evaluate the candidate's answer.
- Provide conversational, direct feedback addressing the candidate as "you".
- Format your feedback clearly, using bullet points for readability.
- Use emojis sparingly and only when necessary (e.g., one or two for praise or constructive feedback). Do not overuse them.
- If the answer is good, praise them and appreciate their specific points.
- If the answer is lacking or incorrect, gently correct them and point out what they missed or how they could improve (e.g., using the STAR method).
- IMPORTANT: If the candidate gives a highly inappropriate, disrespectful, or argumentative answer, issue a strict warning. If they continue to misbehave, set the "terminate" flag to true.

Output MUST be a valid JSON object matching this exact schema:
{
  "feedback": "string (your formatted feedback using bullet points)",
  "terminate": boolean (true ONLY if the candidate is extremely disrespectful or repeatedly argumentative, otherwise false)
}
`;

    try {
      const parsed = await callLLMJSON<{ feedback?: unknown; terminate?: unknown }>(prompt, {
        system: "You are an expert technical interviewer providing feedback. Output ONLY valid JSON.",
        temperature: 0.5,
        maxTokens: 1500,
      });
      if (typeof parsed.feedback !== "string" || !parsed.feedback.trim()) throw new Error("No feedback in response");
      return NextResponse.json({ feedback: parsed.feedback.trim(), terminate: parsed.terminate === true });
    } catch (err: any) {
      console.warn("Answer evaluation failed:", err.message);
      return NextResponse.json({
        feedback: "I couldn't reach the AI evaluator just now, so here's general guidance:\n- Structure your answer with the STAR method (Situation, Task, Action, Result).\n- Reference a concrete project from your resume.\n- Close with a measurable result where you can.",
        terminate: false,
        fallback: true,
      });
    }
  } catch (err: any) {
    console.error("Evaluate answer error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
