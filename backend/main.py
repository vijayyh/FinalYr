import os
import json
import sqlite3
import uuid
from datetime import datetime
import fitz  # PyMuPDF
import requests
import networkx as nx
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import google.generativeai as genai
try:
    import groq
except ImportError:
    groq = None

load_dotenv()

app = FastAPI(title="Resume AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Gemini if key is provided and not placeholder
if GEMINI_API_KEY and GEMINI_API_KEY != "paste_your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-3.6-flash')
else:
    model = None
    print("WARNING: Gemini API key not found. Using mocked AI responses.")

# Initialize Groq if key is provided and library is installed
if groq and GROQ_API_KEY and GROQ_API_KEY != "paste_your_groq_api_key_here":
    groq_client = groq.Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None
    print("WARNING: Groq API key not found or library not installed. Will fallback to Gemini or mock.")

GROQ_MODEL = "openai/gpt-oss-20b"

def call_llm(prompt: str, json_object: bool = False, system: str = None, temperature: float = None) -> str:
    """Provider abstraction: try Groq first, fall back to Gemini. Raises RuntimeError if both fail
    (or neither is configured) so callers can fall back to mock data as before."""
    errors = []

    if groq_client:
        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            kwargs = {"messages": messages, "model": GROQ_MODEL}
            if json_object:
                kwargs["response_format"] = {"type": "json_object"}
            if temperature is not None:
                kwargs["temperature"] = temperature
            response = groq_client.chat.completions.create(**kwargs)
            return response.choices[0].message.content.strip()
        except Exception as e:
            errors.append(f"Groq: {e}")

    if model:
        try:
            generation_config = {"temperature": temperature} if temperature is not None else None
            response = model.generate_content(prompt, generation_config=generation_config)
            text = response.text.strip()
            if text.startswith("```"):
                text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return text
        except Exception as e:
            errors.append(f"Gemini: {e}")

    raise RuntimeError(" | ".join(errors) if errors else "No LLM provider configured (missing GROQ_API_KEY/GEMINI_API_KEY)")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
    return text

def get_jobs_from_jsearch(query: str):
    if not RAPIDAPI_KEY or RAPIDAPI_KEY == "paste_your_rapidapi_key_here":
        return [
            {"job_title": "Frontend Engineer", "employer_name": "Google", "job_apply_link": "https://careers.google.com"},
            {"job_title": "React Developer", "employer_name": "Meta", "job_apply_link": "https://metacareers.com"}
        ]
    
    url = "https://jsearch.p.rapidapi.com/search"
    querystring = {"query": f"{query} near me", "page": "1", "num_pages": "1"}
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }
    try:
        response = requests.get(url, headers=headers, params=querystring)
        data = response.json()
        if "data" in data:
            return data["data"][:5]
    except Exception as e:
        print(f"Job search error: {e}")
    return []

@app.get("/")
def read_root():
    return {"message": "Welcome to the Resume AI API"}

@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")
    
    contents = await file.read()
    extracted_text = extract_text_from_pdf(contents)
    
    # Use LLM to extract skills and job title
    parsed_data = {
        "job_title": "Software Engineer", 
        "ats_score": 85,
        "executive_summary": "This candidate demonstrates a strong foundation in modern web development, particularly in frontend technologies. Their experience aligns well with mid-level Software Engineering roles. However, there is a lack of quantifiable metrics in their work experience, which could hinder their performance in automated screening systems.",
        "skills": ["React", "Python", "TypeScript", "Node.js"],
        "key_strengths": [
            {"title": "Frontend Architecture", "explanation": "Extensive use of React and modern state management tools indicates the ability to build scalable user interfaces."},
            {"title": "Problem Solving", "explanation": "Past projects show a strong pattern of identifying inefficiencies and implementing technical solutions."},
            {"title": "Fast Learner", "explanation": "The timeline of projects indicates an ability to quickly pick up new frameworks and deliver results."}
        ],
        "areas_for_improvement": [
            {"title": "Cloud Deployment", "explanation": "There is a lack of experience with AWS, GCP, or Azure. Consider getting a basic cloud certification."},
            {"title": "Testing", "explanation": "No mention of Jest, Cypress, or unit testing frameworks. Adding these will significantly boost your profile."},
            {"title": "Quantifiable Metrics", "explanation": "Your experience lacks numbers. Instead of saying 'improved performance', state 'reduced load time by 40%'."}
        ],
        "formatting_feedback": "The resume is well-structured but could benefit from more concise bullet points rather than paragraphs in the experience section."
    }
    
    prompt = f"""Analyze this resume text in extreme detail and act as an expert technical recruiter and career coach.
Return ONLY a highly detailed JSON object matching this exact structure:
{{
    "job_title": "The most likely target job title (e.g. Senior Frontend Developer)", 
    "ats_score": A number between 0 and 100 representing ATS compatibility,
    "executive_summary": "A detailed 3-4 sentence paragraph summarizing the candidate's overall profile, career trajectory, and market readiness.",
    "skills": ["An array of the top 5-8 technical or soft skills extracted"],
    "key_strengths": [
        {{"title": "Short title of strength", "explanation": "A detailed 2-sentence explanation of why this is a strength based on the resume."}},
        (Provide exactly 3 strengths)
    ],
    "areas_for_improvement": [
        {{"title": "Short title of weakness/gap", "explanation": "A detailed 2-sentence explanation and actionable advice on how to improve this."}},
        (Provide exactly 3 areas for improvement)
    ],
    "formatting_feedback": "A 1-2 sentence constructive critique on the resume's format, grammar, or readability."
}}
Resume Text: {extracted_text[:3000]}"""

    try:
        clean_text = call_llm(prompt, json_object=True)
        parsed_data = json.loads(clean_text)
    except Exception as e:
        print(f"LLM parsing error: {e}")
            
    jobs = get_jobs_from_jsearch(parsed_data.get("job_title", "Software Engineer"))
            
    return {
        "status": "success",
        "parsed_data": parsed_data,
        "jobs": jobs,
        "extracted_text": extracted_text
    }

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/api/tools/ats-score")
async def ats_score(req: ATSRequest):
    prompt = f"Compare this resume against the job description. Return ONLY valid JSON format like {{\"score\": 85, \"missingSkills\": [\"skill1\", \"skill2\"], \"strengths\": [\"str1\", \"str2\"]}}. Resume: {req.resume_text[:2000]} Job Desc: {req.job_description[:2000]}"
    try:
        clean_text = call_llm(prompt, json_object=True)
        return json.loads(clean_text)
    except Exception as e:
        print(f"ATS LLM Error: {e}")
            
    return {
        "score": 85,
        "missingSkills": ["Kubernetes (mock)"],
        "strengths": ["React (mock)"]
    }

class CoverLetterRequest(BaseModel):
    job_role: str
    company_name: str
    resume_text: str = ""

@app.post("/api/tools/cover-letter")
async def generate_cover_letter(req: CoverLetterRequest):
    prompt = f"Write a professional cover letter for the role of {req.job_role} at {req.company_name} based on this resume summary: {req.resume_text[:2000]}"
    try:
        letter = call_llm(prompt)
        return {"letter": letter}
    except Exception as e:
        print(f"Cover Letter LLM Error: {e}")
    
    return {"letter": f"Dear Hiring Manager at {req.company_name},\n\n[MOCKED] I am writing to apply for the {req.job_role} role..."}

class MockInterviewRequest(BaseModel):
    job_role: str
    resume_text: str = ""

@app.post("/api/tools/mock-interview")
async def generate_mock_interview(req: MockInterviewRequest):
    prompt = f"Generate 5 tough interview questions for a {req.job_role} based on this resume: {req.resume_text[:2000]}. Return ONLY a JSON object containing an array of objects under the key 'questions'. Each object must have keys 'question', 'focus', and 'difficulty'. Example: {{\"questions\": [{{\"question\": \"...\", \"focus\": \"Architecture\", \"difficulty\": \"Hard\"}}]}}"
    try:
        clean_text = call_llm(prompt, json_object=True)
        return json.loads(clean_text)
    except Exception as e:
        print(f"Mock Interview LLM Error: {e}")
        
    return {"questions": [
        {"question": "Mock Question 1?", "focus": "Technical", "difficulty": "Medium"},
        {"question": "Mock Question 2?", "focus": "Behavioral", "difficulty": "Hard"}
    ]}

class SkillGapRequest(BaseModel):
    resume_text: str
    job_description: str

# Node standardization mapping
SKILL_MAP = {
    "python": "Python",
    "py": "Python",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "nosql": "NoSQL",
    "tailwind": "TailwindCSS",
    "tailwindcss": "TailwindCSS",
    "css": "CSS",
    "html": "HTML"
}

def standardize_skills(skills):
    standardized = set()
    for s in skills:
        s_clean = s.strip().lower()
        if s_clean in SKILL_MAP:
            standardized.add(SKILL_MAP[s_clean])
        else:
            standardized.add(s.strip().title())
    return list(standardized)

def extract_skills_with_ai(text: str) -> list[str]:
    if not text.strip():
        return []
    prompt = f"""Extract a clean list of technical skills, programming languages, libraries, frameworks, tools, databases, and core concepts mentioned in the following text.
Return ONLY a valid JSON array of strings, for example: ["Python", "React", "Docker", "Machine Learning"]. Do not include any explanations, introduction, or markdown backticks.
Text: {text[:4000]}"""
    try:
        clean_text = call_llm(prompt).removeprefix("```json").removesuffix("```").strip()
        if clean_text.startswith("["):
            return json.loads(clean_text)
        else:
            start = clean_text.find("[")
            end = clean_text.rfind("]") + 1
            if start != -1 and end != -1:
                return json.loads(clean_text[start:end])
    except Exception as e:
        print(f"Error extracting skills: {e}")
    
    keywords = ["python", "javascript", "typescript", "react", "next.js", "node.js", "docker", "kubernetes", "aws", "django", "flask", "fastapi", "machine learning", "deep learning", "pytorch", "tensorflow", "sql", "postgresql", "mongodb", "tailwind", "css", "html"]
    found = []
    text_lower = text.lower()
    for kw in keywords:
        if kw in text_lower:
            found.append(kw)
    return standardize_skills(found)

# Build directed graph for prerequisites
G_skill = nx.DiGraph()
edges = [
    ("Python", "Web Frameworks"),
    ("Python", "Data Science"),
    ("Python", "Automation"),
    ("Web Frameworks", "Django"),
    ("Web Frameworks", "Flask"),
    ("Web Frameworks", "FastAPI"),
    ("Data Science", "Machine Learning"),
    ("Data Science", "Data Visualization"),
    ("Machine Learning", "Deep Learning"),
    ("Machine Learning", "Natural Language Processing"),
    ("Deep Learning", "PyTorch"),
    ("Deep Learning", "TensorFlow"),
    ("JavaScript", "React"),
    ("JavaScript", "Node.js"),
    ("JavaScript", "TypeScript"),
    ("React", "Next.js"),
    ("React", "Redux"),
    ("TypeScript", "Next.js"),
    ("SQL", "PostgreSQL"),
    ("SQL", "Database Design"),
    ("Database Design", "NoSQL"),
    ("NoSQL", "MongoDB"),
    ("Docker", "Kubernetes"),
    ("Docker", "CI/CD"),
    ("HTML", "CSS"),
    ("CSS", "TailwindCSS")
]
G_skill.add_edges_from(edges)

from typing import List, Dict, Optional, Any

class ExperienceModel(BaseModel):
    job_title: str
    company: str
    date: str
    description: str

class EducationModel(BaseModel):
    degree: str
    university: str
    year: str

class ResumeBuilderRequest(BaseModel):
    personal: Dict[str, str]
    education: List[EducationModel]
    experience: List[ExperienceModel]
    skills: str

@app.post("/api/build-resume")
async def build_resume(req: ResumeBuilderRequest):
    prompt = f"""
You are an expert resume writer. The user has provided their raw resume details.
Your task is to:
1. Enhance the experience bullet points using strong action verbs and quantifiable metrics where possible. Make them sound professional and impactful.
2. Generate a professional summary based on the provided details.
3. Fix any grammar and spelling issues.

Return ONLY a valid JSON object with the following structure, and nothing else (no markdown wrappers around the JSON):
{{
    "personal": {{
        "name": "...",
        "email": "...",
        "phone": "...",
        "linkedin": "..."
    }},
    "summary": "...",
    "education": [
        {{"degree": "...", "university": "...", "year": "..."}}
    ],
    "experience": [
        {{
            "job_title": "...",
            "company": "...",
            "date": "...", 
            "bullets": ["Enhanced bullet 1", "Enhanced bullet 2"]
        }}
    ],
    "skills": ["Skill 1", "Skill 2"]
}}

Raw Data:
Personal: {req.personal}
Education: {[e.model_dump() for e in req.education]}
Experience: {[e.model_dump() for e in req.experience]}
Skills: {req.skills}
"""
    try:
        response_text = call_llm(
            prompt,
            system="You are a helpful API that outputs only valid JSON.",
            temperature=0.3,
        )
        if response_text.startswith("```json"):
            response_text = response_text.strip("`").replace("json\n", "", 1)
        
        resume_data = json.loads(response_text)
        return {"status": "success", "data": resume_data}
    except Exception as e:
        print(f"Error generating resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate resume from LLM.")

@app.post("/api/tools/skill-gap")
async def analyze_skill_gap(req: SkillGapRequest):
    user_skills_raw = extract_skills_with_ai(req.resume_text)
    target_skills_raw = extract_skills_with_ai(req.job_description)
    
    user_skills = standardize_skills(user_skills_raw)
    target_skills = standardize_skills(target_skills_raw)
    
    user_expanded = set(user_skills)
    for skill in user_skills:
        if G_skill.has_node(skill):
            user_expanded.update(nx.ancestors(G_skill, skill))
            
    target_expanded = set(target_skills)
    for skill in target_skills:
        if G_skill.has_node(skill):
            target_expanded.update(nx.ancestors(G_skill, skill))
            
    if not user_expanded and not target_expanded:
        jaccard_overlap = 0.0
    else:
        intersection = user_expanded.intersection(target_expanded)
        union = user_expanded.union(target_expanded)
        jaccard_overlap = round((len(intersection) / len(union)) * 100, 1)
        
    matched_skills = [s for s in target_skills if s in user_skills]
    missing_skills = [s for s in target_skills if s not in user_skills]
    
    paths = []
    bridge_skills = set()
    
    for m in missing_skills:
        if not G_skill.has_node(m):
            continue
            
        shortest_path = None
        shortest_len = float('inf')
        
        for u in user_skills:
            if G_skill.has_node(u) and nx.has_path(G_skill, u, m):
                try:
                    path = nx.shortest_path(G_skill, source=u, target=m)
                    if len(path) < shortest_len:
                        shortest_len = len(path)
                        shortest_path = path
                except nx.NetworkXNoPath:
                    pass
                    
        if shortest_path:
            paths.append({
                "skill": m,
                "path": shortest_path
            })
            for node in shortest_path[1:-1]:
                bridge_skills.add(node)
        else:
            preds = list(G_skill.predecessors(m))
            if preds:
                paths.append({
                    "skill": m,
                    "path": [preds[0], m]
                })
                bridge_skills.add(preds[0])
                
    bridge_skills = [b for b in bridge_skills if b not in user_skills]
    
    return {
        "status": "success",
        "user_skills": user_skills,
        "target_skills": target_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "bridge_skills": list(bridge_skills),
        "jaccard_overlap": jaccard_overlap,
        "roadmap": paths
    }

@app.post("/api/skill-gap")
async def analyze_skill_gap_alt(req: SkillGapRequest):
    return await analyze_skill_gap(req)

class LinkedInOptimizerRequest(BaseModel):
    resume_text: str

@app.post("/api/tools/linkedin-optimizer")
async def optimize_linkedin(req: LinkedInOptimizerRequest):
    prompt = f"""Act as an expert LinkedIn recruiter and profile optimizer. Based on the following resume text, generate actionable insights to optimize the user's LinkedIn profile. 
Return ONLY a valid JSON object matching this exact structure:
{{
    "headline_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    "about_summary": "A compelling, first-person 'About' summary.",
    "experience_tips": ["Tip 1", "Tip 2", "Tip 3"],
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}
Resume Text: {req.resume_text[:3000]}"""

    try:
        clean_text = call_llm(prompt, json_object=True)
        return json.loads(clean_text)
    except Exception as e:
        print(f"LinkedIn Optimizer LLM Error: {e}")
    
    return {
        "headline_suggestions": ["Software Engineer at Tech", "Full Stack Developer", "Experienced Web Developer"],
        "about_summary": "I am a skilled software engineer with experience in building web applications.",
        "experience_tips": ["Add more metrics", "Use action verbs", "Highlight teamwork"],
        "keywords": ["React", "Python", "JavaScript", "SQL", "Cloud"]
    }

# ==========================================================
# SKILL TRACKER API & PERSISTENCE (SQLite)
# ==========================================================
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tracker.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_tracker_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tracked_skills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        category TEXT DEFAULT 'Technical',
        source TEXT DEFAULT 'Skill Gap Analyzer',
        status TEXT DEFAULT 'to_learn',
        target_role TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        removed_at TEXT,
        removal_reason TEXT
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_tracked_skills_user ON tracked_skills(user_id);")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skill_activity_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skill_activity_user ON skill_activity_log(user_id);")
    conn.commit()
    conn.close()

init_tracker_db()

class AddSkillRequest(BaseModel):
    user_id: str
    skill_name: str
    category: str = "Technical"
    source: str = "Skill Gap Analyzer"
    status: str = "to_learn"
    target_role: str = ""
    notes: str = ""

class BatchAddSkillRequest(BaseModel):
    user_id: str
    skills: list[str]
    category: str = "Technical"
    source: str = "Skill Gap Analyzer"
    target_role: str = ""

class UpdateSkillRequest(BaseModel):
    status: str | None = None
    notes: str | None = None
    category: str | None = None

class RemoveSkillRequest(BaseModel):
    user_id: str
    reason: str = "Removed by user"

@app.get("/api/tracker/users")
def get_tracker_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT user_id FROM tracked_skills ORDER BY user_id ASC")
    rows = cursor.fetchall()
    conn.close()
    return {"users": [r["user_id"] for r in rows]}

@app.get("/api/tracker/skills")
def get_tracked_skills(user_id: str, include_removed: bool = False):
    conn = get_db()
    cursor = conn.cursor()
    if include_removed:
        cursor.execute("SELECT * FROM tracked_skills WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    else:
        cursor.execute("SELECT * FROM tracked_skills WHERE user_id = ? AND status != 'removed' ORDER BY created_at DESC", (user_id,))
    skills = [dict(r) for r in cursor.fetchall()]
    
    # Calculate stats
    cursor.execute("SELECT status, count(*) as count FROM tracked_skills WHERE user_id = ? GROUP BY status", (user_id,))
    counts = {r["status"]: r["count"] for r in cursor.fetchall()}
    conn.close()
    
    stats = {
        "total_active": sum(v for k, v in counts.items() if k != "removed"),
        "to_learn": counts.get("to_learn", 0),
        "in_progress": counts.get("in_progress", 0),
        "mastered": counts.get("mastered", 0),
        "removed": counts.get("removed", 0)
    }
    return {"skills": skills, "stats": stats}

@app.post("/api/tracker/skills")
def add_tracked_skill(req: AddSkillRequest):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    # Check if this skill already exists for this user
    cursor.execute("SELECT * FROM tracked_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)", (req.user_id, req.skill_name.strip()))
    existing = cursor.fetchone()
    
    if existing:
        existing_dict = dict(existing)
        if existing_dict["status"] == "removed":
            # Reactivate
            cursor.execute("""
                UPDATE tracked_skills 
                SET status = ?, updated_at = ?, removed_at = NULL, removal_reason = NULL, notes = ?
                WHERE id = ?
            """, (req.status or "to_learn", now, req.notes or existing_dict["notes"], existing_dict["id"]))
            
            log_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (log_id, req.user_id, existing_dict["id"], req.skill_name.strip(), "restored", f"Re-added from {req.source}", now))
            conn.commit()
            cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (existing_dict["id"],))
            result = dict(cursor.fetchone())
            conn.close()
            return result
        conn.close()
        return existing_dict

    skill_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO tracked_skills (id, user_id, skill_name, category, source, status, target_role, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (skill_id, req.user_id, req.skill_name.strip(), req.category, req.source, req.status, req.target_role, req.notes, now, now))
    
    log_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, req.user_id, skill_id, req.skill_name.strip(), "added", f"Added from {req.source}", now))
    
    conn.commit()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
    result = dict(cursor.fetchone())
    conn.close()
    return result

@app.post("/api/tracker/skills/batch")
def batch_add_tracked_skills(req: BatchAddSkillRequest):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    added = []
    already_tracked = []
    
    for skill in req.skills:
        skill_clean = skill.strip()
        if not skill_clean:
            continue
        cursor.execute("SELECT * FROM tracked_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)", (req.user_id, skill_clean))
        existing = cursor.fetchone()
        if existing:
            existing_dict = dict(existing)
            if existing_dict["status"] == "removed":
                cursor.execute("""
                    UPDATE tracked_skills 
                    SET status = 'to_learn', updated_at = ?, removed_at = NULL, removal_reason = NULL
                    WHERE id = ?
                """, (now, existing_dict["id"]))
                log_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (log_id, req.user_id, existing_dict["id"], skill_clean, "restored", f"Re-added in batch from {req.source}", now))
                cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (existing_dict["id"],))
                added.append(dict(cursor.fetchone()))
            else:
                already_tracked.append(existing_dict["skill_name"])
        else:
            skill_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO tracked_skills (id, user_id, skill_name, category, source, status, target_role, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'to_learn', ?, '', ?, ?)
            """, (skill_id, req.user_id, skill_clean, req.category, req.source, req.target_role, now, now))
            log_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (log_id, req.user_id, skill_id, skill_clean, "added", f"Added in batch from {req.source}", now))
            cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
            added.append(dict(cursor.fetchone()))
            
    conn.commit()
    conn.close()
    return {"added": added, "already_tracked": already_tracked}

@app.patch("/api/tracker/skills/{skill_id}")
def update_tracked_skill(skill_id: str, req: UpdateSkillRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tracked skill not found")
    
    current = dict(row)
    now = datetime.utcnow().isoformat()
    new_status = req.status if req.status is not None else current["status"]
    new_notes = req.notes if req.notes is not None else current["notes"]
    new_category = req.category if req.category is not None else current["category"]
    
    cursor.execute("""
        UPDATE tracked_skills
        SET status = ?, notes = ?, category = ?, updated_at = ?
        WHERE id = ?
    """, (new_status, new_notes, new_category, now, skill_id))
    
    if req.status is not None and req.status != current["status"]:
        log_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (log_id, current["user_id"], skill_id, current["skill_name"], "status_changed", f"Status changed from {current['status']} to {new_status}", now))
        
    conn.commit()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

@app.delete("/api/tracker/skills/{skill_id}")
def remove_tracked_skill(skill_id: str, user_id: str, reason: str = "Removed by user"):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tracked skill not found")
    
    current = dict(row)
    now = datetime.utcnow().isoformat()
    
    # Calculate duration tracked
    try:
        created_dt = datetime.fromisoformat(current["created_at"])
        now_dt = datetime.fromisoformat(now)
        duration_delta = now_dt - created_dt
        days = duration_delta.days
        hours = duration_delta.seconds // 3600
        minutes = (duration_delta.seconds % 3600) // 60
        if days > 0:
            duration_str = f"{days}d {hours}h"
        elif hours > 0:
            duration_str = f"{hours}h {minutes}m"
        else:
            duration_str = f"{max(1, minutes)}m"
    except Exception:
        duration_str = "recent"
        
    cursor.execute("""
        UPDATE tracked_skills
        SET status = 'removed', removed_at = ?, removal_reason = ?, updated_at = ?
        WHERE id = ?
    """, (now, reason, now, skill_id))
    
    log_id = str(uuid.uuid4())
    log_details = f"Removed after {duration_str}. Reason: {reason}"
    cursor.execute("""
        INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, user_id, skill_id, current["skill_name"], "removed", log_details, now))
    
    conn.commit()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
    removed = dict(cursor.fetchone())
    conn.close()
    return removed

@app.post("/api/tracker/skills/{skill_id}/restore")
def restore_tracked_skill(skill_id: str, user_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ? AND user_id = ?", (skill_id, user_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tracked skill not found")
    
    current = dict(row)
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE tracked_skills
        SET status = 'to_learn', removed_at = NULL, removal_reason = NULL, updated_at = ?
        WHERE id = ?
    """, (now, skill_id))
    
    log_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO skill_activity_log (id, user_id, skill_id, skill_name, action, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, user_id, skill_id, current["skill_name"], "restored", "Restored to active tracking", now))
    
    conn.commit()
    cursor.execute("SELECT * FROM tracked_skills WHERE id = ?", (skill_id,))
    restored = dict(cursor.fetchone())
    conn.close()
    return restored

@app.get("/api/tracker/history")
def get_tracker_history(user_id: str, limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM skill_activity_log 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (user_id, limit))
    history = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("""
        SELECT * FROM tracked_skills 
        WHERE user_id = ? AND status = 'removed' 
        ORDER BY removed_at DESC
    """, (user_id,))
    removed_skills = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"history": history, "removed_skills": removed_skills}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
