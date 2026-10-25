import { NextResponse } from "next/server";
import { callLLMJSON } from "@/lib/llm";

export const maxDuration = 60;

// The LLM only *extracts* (JD keywords, language/format issues). The score itself is computed
// deterministically below so the same resume always gets the same score, and missing JD skills
// always cost points.

interface LLMFindings {
  jdKeywords: string[];
  parseIssues: string[];
  grammarIssues: string[];
  repetitionIssues: string[];
}

// Fallback keyword list used when the LLM is unavailable.
const COMMON_SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "kotlin", "swift", "sql",
  "react", "next.js", "angular", "vue", "node.js", "express", "django", "flask", "fastapi", "spring", "graphql", "rest",
  "html", "css", "tailwind", "redux", "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
  "git", "linux", "postgresql", "mysql", "mongodb", "redis", "kafka", "elasticsearch", "microservices", "machine learning",
  "deep learning", "tensorflow", "pytorch", "pandas", "numpy", "nlp", "llm", "data analysis", "power bi", "tableau",
  "excel", "figma", "agile", "scrum", "jira", "testing", "jest", "selenium", "system design", "security", "android", "ios",
];

const GENERIC_TERMS = new Set([
  "engineer", "engineering", "developer", "development", "software", "experience", "team", "skills", "senior", "junior",
  "communication", "teamwork", "problem solving", "leadership", "must have", "requirements", "role", "work",
]);

const ACTION_VERBS = [
  "led", "managed", "developed", "built", "created", "designed", "implemented", "worked", "responsible", "helped",
  "improved", "handled", "used", "made", "assisted",
];

function normalize(s: string): string {
  return ` ${s.toLowerCase().replace(/[^a-z0-9+#/.\s-]/g, " ").replace(/\s+/g, " ")} `;
}

/** True if the keyword (or a common variant, e.g. "Node.js" ↔ "node"/"nodejs") appears in the resume. */
function hasKeyword(resumeNorm: string, keyword: string): boolean {
  const k = keyword.toLowerCase().trim();
  const variants = new Set([k, k.replace(/\.js$/, ""), k.replace(/\./g, ""), k.replace(/\s+/g, ""), k.replace(/-/g, " ")]);
  for (const v of variants) {
    if (v.length < 2) continue;
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(resumeNorm)) return true;
  }
  return false;
}

/** Achievement statements: bullet lines if the resume uses bullets, otherwise sentences of 6+ words. */
function statementsOf(resume: string): string[] {
  const bulletRe = /^\s*[•\-*–·>▪●◦]\s+/;
  const lines = resume.split(/\n/);
  const bullets = lines.filter((l) => bulletRe.test(l));
  const source = bullets.length >= 3 ? bullets : resume.split(/\n|(?<=[.;])\s+(?=[A-Z])/);
  return source
    .map((s) => s.replace(bulletRe, "").trim())
    .filter((s) => s.split(/\s+/).length >= 6);
}

/** Strips years and month names so "Jan 2021 - 2025" doesn't count as a measurable result. */
const withoutDates = (s: string) =>
  s.replace(/\b(19|20)\d{2}\b/g, "").replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, "");

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const issueScore = (count: number, perIssue = 12) => clamp(100 - count * perIssue);

function metric(title: string, issues: string[]) {
  return { title, status: issues.length === 0 ? "PASS" : "FAIL", issueCount: issues.length, issues };
}

export async function POST(request: Request) {
  try {
    const { resumeText, jobDescription = "" } = await request.json();

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide your resume text (at least a few lines) so it can be analysed." },
        { status: 400 }
      );
    }

    const resume = resumeText.slice(0, 15000);
    const jd = String(jobDescription).slice(0, 8000);
    const hasJD = jd.trim().length > 20;

    // ── 1. LLM extraction (best effort) ──────────────────────────────────────────
    let findings: LLMFindings = { jdKeywords: [], parseIssues: [], grammarIssues: [], repetitionIssues: [] };
    let llmAvailable = true;
    try {
      const prompt = `You are an ATS (applicant tracking system) auditor. Analyse the resume${hasJD ? " against the job description" : ""}.
Return ONLY a JSON object with this exact shape:
{
  "jdKeywords": string[],      // ${hasJD ? "10-25 concrete hard skills, tools, technologies, certifications and domain terms the job description requires. Each must appear in the job description text itself (do not infer). Short canonical names (e.g. \"Kubernetes\", \"GraphQL\", \"CI/CD\"). No soft skills, no generic words." : "return []"}
  "parseIssues": string[],     // formatting that breaks ATS parsers: tables, columns, graphics, odd symbols, missing standard headings, contact info in odd places. Empty if none.
  "grammarIssues": string[],   // exact spelling/grammar mistakes, quoting the wrong text and the fix. Empty if none. Do not invent errors.
  "repetitionIssues": string[] // overused verbs/phrases or keyword stuffing, with counts. Empty if none.
}
Be strict but factual: only report problems that actually exist in the text.

RESUME:
${resume}
${hasJD ? `\nJOB DESCRIPTION:\n${jd}` : ""}`;
      const raw = await callLLMJSON<Partial<LLMFindings>>(prompt, {
        system: "You are a precise ATS analysis engine. Output only JSON.",
        temperature: 0.1,
        maxTokens: 2000,
        timeoutMs: 30000,
      });
      const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : []);
      findings = {
        jdKeywords: strArr(raw.jdKeywords).slice(0, 30),
        parseIssues: strArr(raw.parseIssues).slice(0, 10),
        grammarIssues: strArr(raw.grammarIssues).slice(0, 15),
        repetitionIssues: strArr(raw.repetitionIssues).slice(0, 10),
      };
    } catch (err: any) {
      llmAvailable = false;
      console.warn("ATS LLM extraction failed, using rule-based analysis only:", err?.message);
    }

    const resumeNorm = normalize(resume);

    // ── 2. Keyword match ─────────────────────────────────────────────────────────
    // Only keep keywords that literally appear in the JD, so the LLM can't invent requirements.
    const jdNorm = normalize(jd);
    let keywords = findings.jdKeywords.filter((k) => hasKeyword(jdNorm, k) && !GENERIC_TERMS.has(k.toLowerCase().trim()));
    if (hasJD && keywords.length < 3) {
      keywords = [...keywords, ...COMMON_SKILLS.filter((s) => hasKeyword(jdNorm, s))];
    }
    keywords = Array.from(new Map(keywords.map((k) => [k.toLowerCase(), k])).values());
    const matched = keywords.filter((k) => hasKeyword(resumeNorm, k));
    const missing = keywords.filter((k) => !hasKeyword(resumeNorm, k));
    const keywordScore = keywords.length ? clamp((matched.length / keywords.length) * 100) : 100;

    // ── 3. Quantified impact ─────────────────────────────────────────────────────
    const statements = statementsOf(resume);
    const quantRe = /\d|%|\$|₹|€|£|\b(one|two|three|four|five|ten|hundred|thousand|million|billion)\b/i;
    const unquantified = statements.filter((s) => !quantRe.test(withoutDates(s)));
    const quantRatio = statements.length ? (statements.length - unquantified.length) / statements.length : 0;
    const quantScore = clamp((quantRatio / 0.8) * 100); // 80%+ quantified statements = full marks

    // ── 4. Sections & contact ────────────────────────────────────────────────────
    const sectionChecks: [string, RegExp][] = [
      ["Email address", /[\w.+-]+@[\w-]+\.[\w.]+/],
      ["Phone number", /(\+?\d[\d\s().-]{8,}\d)/],
      ["Work experience section", /\b(experience|employment|work history|internship)/i],
      ["Education section", /\b(education|university|college|degree|b\.?tech|b\.?s\.?|bachelor|master|ph\.?d)/i],
      ["Skills section", /\b(skills|technologies|tech stack|tools)\b/i],
    ];
    const missingSections = sectionChecks.filter(([, re]) => !re.test(resume)).map(([name]) => `Missing: ${name}`);
    const sectionScore = clamp(100 - missingSections.length * 20);

    // ── 5. Length ────────────────────────────────────────────────────────────────
    const words = resume.trim().split(/\s+/).length;
    const lengthIssues: string[] = [];
    let lengthScore = 100;
    if (words < 150) { lengthScore = 30; lengthIssues.push(`Resume is very short (${words} words). Aim for 350–800 words.`); }
    else if (words < 300) { lengthScore = 70; lengthIssues.push(`Resume is brief (${words} words). Add more detail on projects and impact (aim for 350–800).`); }
    else if (words > 1200) { lengthScore = 70; lengthIssues.push(`Resume is long (${words} words). Trim to 1–2 pages (≈ 400–900 words).`); }

    // ── 6. Repetition (rule-based + LLM) ─────────────────────────────────────────
    const verbCounts = ACTION_VERBS.map((v) => [v, (resumeNorm.match(new RegExp(` ${v} `, "g")) || []).length] as const);
    const ruleRepetition = verbCounts.filter(([, c]) => c >= 3).map(([v, c]) => `"${v}" is used ${c} times — vary your action verbs.`);
    const repetitionIssues = Array.from(new Set([...ruleRepetition, ...findings.repetitionIssues]));

    const grammarScore = issueScore(findings.grammarIssues.length, 10);
    const repetitionScore = issueScore(repetitionIssues.length, 15);
    const parseScore = issueScore(findings.parseIssues.length, 15);

    // ── 7. Weighted overall ──────────────────────────────────────────────────────
    const weights = hasJD
      ? { keyword: 0.45, quant: 0.2, section: 0.1, grammar: 0.08, repetition: 0.05, parse: 0.06, length: 0.06 }
      : { keyword: 0, quant: 0.3, section: 0.25, grammar: 0.15, repetition: 0.1, parse: 0.1, length: 0.1 };
    const rawScore = clamp(
      keywordScore * weights.keyword + quantScore * weights.quant + sectionScore * weights.section +
      grammarScore * weights.grammar + repetitionScore * weights.repetition + parseScore * weights.parse +
      lengthScore * weights.length
    );
    // A resume missing a large share of the JD's keywords can never read as "Highly Compatible" (UI threshold 80).
    const overallScore = hasJD && keywordScore < 70 ? Math.min(rawScore, 74) : rawScore;

    const quantIssues = unquantified.slice(0, 8).map((s) => `No measurable result: "${s.length > 110 ? s.slice(0, 110) + "…" : s}"`);

    const categories = [
      ...(hasJD
        ? [{
            name: "KEYWORD MATCH",
            scorePercentage: keywordScore,
            metrics: [
              metric("Job Description Keywords", missing.map((k) => `Missing keyword: ${k}`)),
            ],
          }]
        : []),
      {
        name: "CONTENT",
        scorePercentage: clamp((quantScore * 2 + grammarScore + repetitionScore) / 4),
        metrics: [
          metric("Quantifying Impact", quantIssues),
          metric("Repetition", repetitionIssues),
          metric("Spelling & Grammar", findings.grammarIssues),
        ],
      },
      {
        name: "FORMAT & STRUCTURE",
        scorePercentage: clamp((parseScore + sectionScore + lengthScore) / 3),
        metrics: [
          metric("ATS Parse Rate", findings.parseIssues),
          metric("Sections & Contact Info", missingSections),
          metric("Length", lengthIssues),
        ],
      },
    ];

    return NextResponse.json({
      overallScore,
      totalIssues: categories.reduce((n, c) => n + c.metrics.reduce((m, x) => m + x.issueCount, 0), 0),
      categories,
      keywordMatch: hasJD ? { score: keywordScore, matched, missing } : null,
      llmAvailable,
    });
  } catch (err: any) {
    console.error("ATS API handler error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
