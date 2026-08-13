import { NextResponse } from "next/server";

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const isGroqActive = typeof groqKey === "string" && 
                       groqKey.trim() !== "" && 
                       !groqKey.includes("your_groq_api_key_here") && 
                       !groqKey.includes("paste_your_groq_api_key_here");

  const isGeminiActive = typeof geminiKey === "string" && 
                         geminiKey.trim() !== "" && 
                         !geminiKey.includes("your_gemini_api_key_here") && 
                         !geminiKey.includes("paste_your_gemini_api_key_here");

  return NextResponse.json({
    status: "success",
    keys: {
      groq: isGroqActive ? "Active" : "Missing",
      gemini: isGeminiActive ? "Active" : "Missing (Optional)",
    }
  });
}
