import os
import json
import fitz  # PyMuPDF
import requests
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
    model = genai.GenerativeModel('gemini-1.5-pro')
else:
    model = None
    print("WARNING: Gemini API key not found. Using mocked AI responses.")

# Initialize Groq if key is provided
if GROQ_API_KEY and GROQ_API_KEY != "paste_your_groq_api_key_here":
    groq_client = groq.Groq(api_key=GROQ_API_KEY)
else:
    groq_client = None
    print("WARNING: Groq API key not found. Will fallback to Gemini or mock.")

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
        if groq_client:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-8b-8192",
            )
            clean_text = response.choices[0].message.content.strip().removeprefix("```json").removesuffix("```").strip()
            parsed_data = json.loads(clean_text)
        elif model:
            response = model.generate_content(prompt)
            clean_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
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
    if model:
        prompt = f"Compare this resume against the job description. Return ONLY valid JSON format like {{\"score\": 85, \"missingSkills\": [\"skill1\", \"skill2\"], \"strengths\": [\"str1\", \"str2\"]}}. Resume: {req.resume_text[:2000]} Job Desc: {req.job_description[:2000]}"
        try:
            response = model.generate_content(prompt)
            clean_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(clean_text)
        except Exception as e:
            pass
            
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
    if model:
        prompt = f"Write a professional cover letter for the role of {req.job_role} at {req.company_name} based on this resume summary: {req.resume_text[:2000]}"
        try:
            response = model.generate_content(prompt)
            return {"letter": response.text}
        except: pass
    
    return {"letter": f"Dear Hiring Manager at {req.company_name},\n\n[MOCKED] I am writing to apply for the {req.job_role} role..."}

class MockInterviewRequest(BaseModel):
    job_role: str
    resume_text: str = ""

@app.post("/api/tools/mock-interview")
async def generate_mock_interview(req: MockInterviewRequest):
    if model:
        prompt = f"Generate 5 tough interview questions for a {req.job_role} based on this resume: {req.resume_text[:2000]}. Return ONLY a JSON array of strings."
        try:
            response = model.generate_content(prompt)
            clean_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            return {"questions": json.loads(clean_text)}
        except: pass
        
    return {"questions": ["Mock Question 1?", "Mock Question 2?"]}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
