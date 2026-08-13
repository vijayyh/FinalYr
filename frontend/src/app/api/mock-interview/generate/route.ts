import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { jobRole, jobDescription = "", resumeText } = await request.json();

    if (!jobRole || !resumeText) {
      return NextResponse.json({ error: "Missing required fields: jobRole or resumeText" }, { status: 400 });
    }

    const prompt = `Act as an expert technical recruiter and hiring manager. Generate a list of 10 to 12 highly tailored interview questions for a candidate applying for the role of "${jobRole}".

Candidate Resume:
${resumeText}

Job Description:
${jobDescription || "Not provided (base questions strictly on the resume and standard expectations for this role)"}

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

    let questionsJSON = "";
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
            { role: "system", content: "You are an expert technical interviewer. Output only valid JSON." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      const data = await groqResponse.json();
      if (groqResponse.ok && data.choices && data.choices[0]?.message?.content) {
        questionsJSON = data.choices[0].message.content.trim();
      }
    }

    if (!questionsJSON) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && geminiKey.trim() !== "" && !geminiKey.includes("your_gemini_api_key_here")) {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          }),
        });

        const data = await geminiResponse.json();
        if (geminiResponse.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          questionsJSON = data.candidates[0].content.parts[0].text.trim();
        }
      }
    }

    if (questionsJSON) {
      const cleanJSONString = questionsJSON
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
        
      try {
        const parsed = JSON.parse(cleanJSONString);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", cleanJSONString);
        return NextResponse.json({ error: "Failed to parse questions" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "All model engines failed to generate questions." }, { status: 500 });
  } catch (err: any) {
    console.error("Generate questions error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
