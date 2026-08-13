import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { question, userAnswer, jobRole, jobDescription, resumeText } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json({ error: "Missing question or userAnswer" }, { status: 400 });
    }

    const prompt = `Act as an expert technical recruiter and hiring manager interviewing a candidate for the role of "${jobRole}".
You asked the candidate the following question:
"${question.question}"

The candidate provided the following answer:
"${userAnswer}"

Candidate's Resume Context (use this to evaluate if they accurately referenced their experience):
${resumeText}

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

    let evaluationJSON = "";
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
            { role: "system", content: "You are an expert technical interviewer providing feedback. Output ONLY valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      });

      const data = await groqResponse.json();
      if (groqResponse.ok && data.choices && data.choices[0]?.message?.content) {
        evaluationJSON = data.choices[0].message.content.trim();
      }
    }

    if (!evaluationJSON) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && geminiKey.trim() !== "" && !geminiKey.includes("your_gemini_api_key_here")) {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5 }
          }),
        });

        const data = await geminiResponse.json();
        if (geminiResponse.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          evaluationJSON = data.candidates[0].content.parts[0].text.trim();
        }
      }
    }

    if (evaluationJSON) {
      const cleanJSONString = evaluationJSON
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
        
      try {
        const parsed = JSON.parse(cleanJSONString);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", cleanJSONString);
        return NextResponse.json({ error: "Failed to parse feedback" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "All model engines failed to evaluate." }, { status: 500 });
  } catch (err: any) {
    console.error("Evaluate answer error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
