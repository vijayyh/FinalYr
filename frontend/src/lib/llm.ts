// Shared LLM provider chain for API routes: Groq (gpt-oss-120b → 20b) → Gemini (3.6-flash → flash-lite).
// Every provider call is isolated (timeout + try/catch) so one failing provider always falls through to the next.

type ReasoningEffort = "low" | "medium" | "high";

export interface LLMOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  reasoningEffort?: ReasoningEffort;
  timeoutMs?: number;
}

export interface LLMResult {
  text: string;
  provider: string;
}

const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-flash-lite-latest"];

function usableKey(key: string | undefined, placeholder: string): string | null {
  if (!key || key.trim() === "" || key.includes(placeholder)) return null;
  return key.trim();
}

async function fetchJSON(url: string, init: RequestInit, timeoutMs: number) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

async function callGroq(model: string, key: string, prompt: string, opts: LLMOptions): Promise<string> {
  const messages = [
    ...(opts.system ? [{ role: "system", content: opts.system }] : []),
    { role: "user", content: prompt },
  ];
  const { ok, data } = await fetchJSON(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        reasoning_effort: opts.reasoningEffort ?? "low",
        temperature: opts.temperature ?? 0.5,
        max_tokens: opts.maxTokens ?? 2000,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      }),
    },
    opts.timeoutMs ?? 25000
  );
  const choice = data?.choices?.[0];
  const text = choice?.message?.content?.trim();
  if (!ok) throw new Error(data?.error?.message || `HTTP error`);
  if (!text) throw new Error(choice?.finish_reason === "length" ? "token budget used up by reasoning" : "empty response");
  if (choice?.finish_reason === "length" && !opts.json) throw new Error("response truncated");
  return text;
}

async function callGemini(model: string, key: string, prompt: string, opts: LLMOptions): Promise<string> {
  const fullPrompt = opts.system ? `${opts.system}\n\n${prompt}` : prompt;
  const { ok, data } = await fetchJSON(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.5,
          maxOutputTokens: opts.maxTokens ?? 2000,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
          ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: "minimal" } } : {}),
        },
      }),
    },
    opts.timeoutMs ?? 25000
  );
  // Join every non-thought part; thinking models may split the answer across parts.
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
  if (!ok || !text) throw new Error(data?.error?.message || "empty response");
  return text;
}

/** Runs the provider chain. Throws with per-provider errors if every provider fails. */
export async function callLLM(prompt: string, opts: LLMOptions = {}): Promise<LLMResult> {
  const errors: string[] = [];
  const groqKey = usableKey(process.env.GROQ_API_KEY, "your_groq_api_key_here");
  const geminiKey = usableKey(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, "your_gemini_api_key_here");

  const attempts: [string, () => Promise<string>][] = [
    ...(groqKey ? GROQ_MODELS.map((m) => [`groq:${m}`, () => callGroq(m, groqKey, prompt, opts)] as [string, () => Promise<string>]) : []),
    ...(geminiKey ? GEMINI_MODELS.map((m) => [`gemini:${m}`, () => callGemini(m, geminiKey, prompt, opts)] as [string, () => Promise<string>]) : []),
  ];
  if (attempts.length === 0) throw new Error("No LLM API keys configured (GROQ_API_KEY / GEMINI_API_KEY).");

  for (const [provider, attempt] of attempts) {
    try {
      const text = await attempt();
      if (opts.json) parseJSON(text); // validate before accepting, so malformed JSON falls through
      console.log(`LLM success via ${provider}`);
      return { text, provider };
    } catch (err: any) {
      errors.push(`${provider}: ${err?.message || err}`);
      console.warn(`LLM attempt failed (${provider}):`, err?.message || err);
    }
  }
  throw new Error(`All LLM providers failed — ${errors.join(" | ")}`);
}

/** Parses JSON from an LLM response, tolerating ```json fences and leading/trailing prose. */
export function parseJSON<T = any>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Response was not valid JSON");
  }
}

/** Convenience: run the chain and return parsed JSON. */
export async function callLLMJSON<T = any>(prompt: string, opts: LLMOptions = {}): Promise<T> {
  const { text } = await callLLM(prompt, { ...opts, json: true });
  return parseJSON<T>(text);
}
