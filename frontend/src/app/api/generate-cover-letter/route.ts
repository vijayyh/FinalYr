import { NextResponse } from "next/server";

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
4. No Hallucinations: Extract ONLY facts, projects, tools, and metrics directly present in the candidate's resume. Do not invent any details.
5. Format: Output ONLY the letter text (salutation, the three paragraphs, and closing). Do not include markdown blocks, notes, date placeholders, or meta-commentary.

Candidate Resume Text:
${resumeText || "Not provided (use general software engineering skills matching the role)"}

Target Job Description:
${jobDescription || "Not provided (optimize for standard skills required for the role)"}
`;

    let letter = "";
    const errors: Record<string, string> = {};

    // 1. Try Groq API
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== "" && !groqKey.includes("your_groq_api_key_here")) {
      try {
        console.log("Attempting Cover Letter generation with Groq API...");
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a professional cover letter helper." },
              { role: "user", content: systemPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        const data = await groqResponse.json();
        
        if (groqResponse.ok && data.choices && data.choices[0]?.message?.content) {
          letter = data.choices[0].message.content.trim();
          console.log("Successfully generated cover letter with Groq llama-3.3-70b-versatile!");
        } else {
          // If 70b failed, try 8b fallback
          console.warn("Groq 70b failed, trying llama3-8b-8192 fallback...");
          const groqResponseFallback = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama3-8b-8192",
              messages: [
                { role: "system", content: "You are a professional cover letter helper." },
                { role: "user", content: systemPrompt }
              ],
              temperature: 0.7,
              max_tokens: 1500,
            }),
          });
          const dataFallback = await groqResponseFallback.json();
          if (groqResponseFallback.ok && dataFallback.choices && dataFallback.choices[0]?.message?.content) {
            letter = dataFallback.choices[0].message.content.trim();
            console.log("Successfully generated cover letter with Groq llama3-8b-8192!");
          } else {
            const errorMsg = dataFallback.error?.message || data.error?.message || "Invalid response format";
            errors.groq = `Groq API Error: ${errorMsg}`;
          }
        }
      } catch (err: any) {
        errors.groq = `Groq API Network Error: ${err.message || err}`;
      }
    } else {
      errors.groq = "Groq API Key is unconfigured or missing.";
    }

    // 2. Fallback to Google Gemini API
    if (!letter) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && geminiKey.trim() !== "" && !geminiKey.includes("your_gemini_api_key_here")) {
        try {
          console.log("Attempting Cover Letter generation with Gemini API (Fallback)...");
          // Try gemini-2.0-flash first
          let geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500
              }
            }),
          });

          let data = await geminiResponse.json();

          // Try gemini-1.5-flash as secondary fallback if 2.0 fails or isn't available
          if (!geminiResponse.ok || !data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            console.warn("Gemini 2.0 Flash failed, trying gemini-1.5-flash fallback...");
            geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
              }),
            });
            data = await geminiResponse.json();
          }

          if (geminiResponse.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            letter = data.candidates[0].content.parts[0].text.trim();
            console.log("Successfully generated cover letter with Gemini API!");
          } else {
            const errorMsg = data.error?.message || "Invalid response format";
            errors.gemini = `Gemini API Error: ${errorMsg}`;
          }
        } catch (err: any) {
          errors.gemini = `Gemini API Network Error: ${err.message || err}`;
        }
      } else {
        errors.gemini = "Gemini API Key is unconfigured or missing.";
      }
    }

    if (letter) {
      return NextResponse.json({ status: "success", letter });
    }

    // Both failed
    return NextResponse.json({
      status: "error",
      message: "Could not generate cover letter. All model engines failed to process the request.",
      details: errors
    }, { status: 500 });

  } catch (err: any) {
    console.error("API handler failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
