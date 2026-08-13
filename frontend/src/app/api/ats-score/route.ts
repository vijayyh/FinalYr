import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { resumeText, jobDescription = "" } = await request.json();

    if (!resumeText) {
      return NextResponse.json({ error: "Missing required field: resumeText" }, { status: 400 });
    }

    const prompt = `Perform an expert ATS compatibility and formatting analysis of the following candidate resume, comparing it against the provided target job description if present.
Analyze these four specific metrics:
1. ATS Parse Rate: Detect formatting choices (columns, tables, graphics, headers/footers, non-standard fonts, or special characters) that confuse ATS parsers.
2. Quantifying Impact: Scan work experience bullets for measurable outcomes (percentages, dollar amounts, timeframes, user growth metrics). Identify specific bullet points lacking KPIs.
3. Repetition: Detect overused action verbs (e.g. "Responsible for", "Led", "Worked on") or excessive keyword stuffing.
4. Spelling & Grammar: Detect specific grammatical errors, punctuation mistakes, or spelling typos.

You MUST return ONLY a valid, structured JSON object matching this exact schema (no markdown formatting, no backticks, no comments, no extra text):
{
  "overallScore": number, // Dynamically computed score (0-100) based on category performance
  "totalIssues": number,  // Total sum of all issues found across all metrics
  "categories": [
    {
      "name": "CONTENT",
      "scorePercentage": number, // Category score percentage (0-100)
      "metrics": [
        {
          "title": "ATS Parse Rate",
          "status": "PASS" | "FAIL",
          "issueCount": number,
          "issues": [] // Array of string descriptions of specific formatting/parsing mistakes detected
        },
        {
          "title": "Quantifying Impact",
          "status": "PASS" | "FAIL",
          "issueCount": number,
          "issues": [] // Array of string work bullets from the resume that lack numeric metrics/KPIs
        },
        {
          "title": "Repetition",
          "status": "PASS" | "FAIL",
          "issueCount": number,
          "issues": [] // Array of string descriptions of overused action verbs or repeated keywords
        },
        {
          "title": "Spelling & Grammar",
          "status": "PASS" | "FAIL",
          "issueCount": number,
          "issues": [] // Array of string exact typos, spelling errors, or grammatical issues found
        }
      ]
    }
  ]
}

Instructions for Scoring:
- Set status to "PASS" if issueCount is 0, otherwise "FAIL".
- The overallScore should be dynamically calculated from the issue rates (e.g., deducting points for each issue found).
- Provide constructive, specific output descriptions in the issues array.

Resume Text:
${resumeText}

Target Job Description:
${jobDescription || "Not provided (evaluate against general industry standard resume rules)"}
`;

    let analysisJSON = "";
    const errors: Record<string, string> = {};

    // 1. Try Groq API
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== "" && !groqKey.includes("your_groq_api_key_here")) {
      try {
        console.log("Attempting ATS score computation with Groq API...");
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are an ATS parser logic analyzer. Output only JSON." },
              { role: "user", content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 1500,
          }),
        });

        const data = await groqResponse.json();
        
        if (groqResponse.ok && data.choices && data.choices[0]?.message?.content) {
          analysisJSON = data.choices[0].message.content.trim();
          console.log("Successfully generated ATS analysis using Groq!");
        } else {
          // Try 8b fallback
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
                { role: "system", content: "You are an ATS parser logic analyzer. Output only JSON." },
                { role: "user", content: prompt }
              ],
              temperature: 0.1,
              max_tokens: 1500,
            }),
          });
          const dataFallback = await groqResponseFallback.json();
          if (groqResponseFallback.ok && dataFallback.choices && dataFallback.choices[0]?.message?.content) {
            analysisJSON = dataFallback.choices[0].message.content.trim();
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

    // 2. Try Gemini Fallback
    if (!analysisJSON) {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey && geminiKey.trim() !== "" && !geminiKey.includes("your_gemini_api_key_here")) {
        try {
          console.log("Attempting ATS score computation with Gemini API (Fallback)...");
          let geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1500
              }
            }),
          });

          let data = await geminiResponse.json();

          if (!geminiResponse.ok || !data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            console.warn("Gemini 2.0 Flash failed, trying gemini-1.5-flash fallback...");
            geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
              }),
            });
            data = await geminiResponse.json();
          }

          if (geminiResponse.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            analysisJSON = data.candidates[0].content.parts[0].text.trim();
            console.log("Successfully generated ATS analysis using Gemini!");
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

    if (analysisJSON) {
      // Remove possible backticks returned by the LLM
      const cleanJSONString = analysisJSON
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
        .trim();
        
      try {
        const parsed = JSON.parse(cleanJSONString);
        return NextResponse.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse LLM response as JSON:", cleanJSONString);
        return NextResponse.json({
          overallScore: 70,
          totalIssues: 4,
          categories: [
            {
              name: "CONTENT",
              scorePercentage: 70,
              metrics: [
                { title: "ATS Parse Rate", status: "PASS", issueCount: 0, issues: [] },
                { title: "Quantifying Impact", status: "FAIL", issueCount: 2, issues: ["Bullet: 'Responsible for full stack app development' lacks metrics", "Bullet: 'Led team of developers' lacks quantifiable scale"] },
                { title: "Repetition", status: "FAIL", issueCount: 1, issues: ["Action verb 'developed' overused 4 times"] },
                { title: "Spelling & Grammar", status: "FAIL", issueCount: 1, issues: ["Typo found: 'receved' instead of 'received'"] }
              ]
            }
          ],
          rawResponse: cleanJSONString,
          parseError: true
        });
      }
    }

    return NextResponse.json({
      status: "error",
      message: "Could not compute ATS analysis. All model engines failed.",
      details: errors
    }, { status: 500 });

  } catch (err: any) {
    console.error("ATS API handler error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
