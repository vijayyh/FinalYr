import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { allQnA, jobRole } = await request.json();

    if (!allQnA || !Array.isArray(allQnA) || allQnA.length === 0) {
      return NextResponse.json({ error: "Missing or invalid QnA history" }, { status: 400 });
    }

    const qnaText = allQnA.map((item: any, index: number) => `
Q${index + 1} (${item.question.difficulty} - ${item.question.focus}): ${item.question.question}
Candidate's Answer: ${item.answer}
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

    let finalJSON = "";
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey && groqKey.trim() !== "" && !groqKey.includes("your_groq_api_key_here")) {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert technical interviewer summarizing an interview. Output ONLY valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4,
          response_format: { type: "json_object" },
        }),
      });

      const data = await groqResponse.json();
      if (groqResponse.ok && data.choices && data.choices[0]?.message?.content) {
        finalJSON = data.choices[0].message.content.trim();
      }
    }

    if (!finalJSON) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && geminiKey.trim() !== "" && !geminiKey.includes("your_gemini_api_key_here")) {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 }
          }),
        });

        const data = await geminiResponse.json();
        if (geminiResponse.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          finalJSON = data.candidates[0].content.parts[0].text.trim();
        }
      }
    }

    if (finalJSON) {
      const cleanJSONString = finalJSON
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
        
      try {
        const parsed = JSON.parse(cleanJSONString);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", cleanJSONString);
        return NextResponse.json({ error: "Failed to parse final overview" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "All model engines failed to finalize." }, { status: 500 });
  } catch (err: any) {
    console.error("Finalize interview error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
