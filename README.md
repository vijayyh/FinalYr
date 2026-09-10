# FinalYr (ResumePro) - AI-Powered Resume & Career Assistant

An AI-driven platform for resume analysis, ATS scoring, cover letter generation, mock interviews, LinkedIn optimization, and skill-gap analysis — available as a web app and a native mobile app, both backed by the same FastAPI service.

🔗 **Live Web App**: [resume-pro-rouge.vercel.app](https://resume-pro-rouge.vercel.app)
🔗 **Live Backend API**: [resumepro-backend-cthc.onrender.com](https://resumepro-backend-cthc.onrender.com)
🐙 **GitHub Repository**: [https://github.com/vijayyh/FinalYr](https://github.com/vijayyh/FinalYr)

---

## 🏗️ Project Architecture & Folder Structure

The project is a monorepo with three parts, all sharing one backend:

### 1. `backend/` (FastAPI + Python + LLMs)
The AI engine, deployed on **Render**.
- **Framework**: FastAPI
- **Key Libraries**: `pymupdf` (PDF parsing), `networkx` (skill-gap graph analysis), `google-generativeai` (Gemini), `groq`.
- **LLM provider strategy**: every AI endpoint goes through a single `call_llm()` helper (`backend/main.py`) that tries **Groq first** (`openai/gpt-oss-20b`), then falls back to **Gemini** (`gemini-3.6-flash`) if Groq fails, then falls back to hardcoded mock data as a last resort so the API never hard-fails.
- **Endpoints**:
  - `POST /api/upload` — parses a PDF resume, extracts skills/ATS score/strengths/weaknesses via LLM, fetches matching job listings via RapidAPI (JSearch).
  - `POST /api/tools/ats-score` — scores a resume against a job description.
  - `POST /api/tools/cover-letter` — generates a tailored cover letter.
  - `POST /api/tools/mock-interview` — generates role-specific interview questions.
  - `POST /api/tools/skill-gap` — Jaccard overlap + directed-graph prerequisite roadmap between resume skills and target job skills.
  - `POST /api/tools/linkedin-optimizer` — headline/about/keyword suggestions.
  - `POST /api/build-resume` — enhances raw resume form data with action verbs and quantified bullets.

### 2. `frontend/` (Next.js + React + Tailwind CSS)
The web dashboard, deployed on **Vercel**.
- **Framework**: Next.js 16.3.0 (App Router), React 19.
- **Styling**: Tailwind CSS v4, Framer Motion for animations, `next-themes` for dark/light mode.
- Some tools (ATS score, cover letter, mock interview) call **Vercel serverless API routes** (`frontend/src/app/api/*`) that independently implement the same Groq→Gemini fallback pattern — this lets those specific tools work on Vercel without needing the Python backend reachable. Resume upload, skill gap, and LinkedIn optimizer call the FastAPI backend directly via `NEXT_PUBLIC_API_URL`.

### 3. `mobile/` (Expo + React Native)
The native Android/iOS app, built with **Expo Router** + TypeScript.
- **Framework**: Expo SDK 57, React Native 0.86.
- **Key Libraries**: `@react-native-async-storage/async-storage` (persistent local cache), `axios`/`fetch` for API calls, `lucide-react-native` for icons, `expo-document-picker` for resume uploads.
- Calls the same FastAPI backend directly (`mobile/src/services/api.ts`). The API base URL defaults to the deployed Render backend, so the app works over any network without requiring the phone and dev machine to share Wi-Fi — override locally with `EXPO_PUBLIC_API_URL` (see `mobile/.env.example`).
- **Builds**: configured for **EAS Build** (`mobile/eas.json`) and for fully local native builds via `expo prebuild` + Gradle (no cloud account required) — see Mobile Build section below.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Python (v3.9+)
- API Keys: Groq API Key, Gemini API Key (optional fallback), RapidAPI Key (for JSearch job listings).

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file with GROQ_API_KEY, GEMINI_API_KEY, RAPIDAPI_KEY
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:3000`. Add `GROQ_API_KEY`, `GEMINI_API_KEY`, `RAPIDAPI_KEY`, and optionally `NEXT_PUBLIC_API_URL` to `frontend/.env.local`.

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
```
Use the Expo Go app on your phone or an emulator to view the app. By default it talks to the live Render backend — set `EXPO_PUBLIC_API_URL` in `mobile/.env` to point at a local backend instead.

#### Building a standalone Android APK locally (no EAS account needed)
```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```
The signed APK is written to `mobile/android/app/build/outputs/apk/release/app-release.apk` and can be installed directly on a device ("install from unknown sources") — it talks to the deployed backend over HTTPS, no dev server required.

#### Building via EAS (cloud)
```bash
cd mobile
npx eas-cli build --platform android --profile preview
```
Requires an Expo account (`eas login`) linked via `mobile/app.json`'s `extra.eas.projectId`.

---

## 🌐 Deployment Details
- **Frontend**: Deployed and continuously integrated via **Vercel** (`vercel.json` at the repo root routes to `frontend/`). Environment variables: `GROQ_API_KEY`, `GEMINI_API_KEY` (optional), `RAPIDAPI_KEY`, `NEXT_PUBLIC_API_URL` (points at the Render backend).
- **Backend**: Deployed on **Render** as a standard web service (`render.yaml` at the repo root defines the blueprint: `rootDir: backend`, `uvicorn main:app --host 0.0.0.0 --port $PORT`). Environment variables (`GROQ_API_KEY`, `GEMINI_API_KEY`, `RAPIDAPI_KEY`) are set directly in the Render dashboard, never committed. Free tier spins down after inactivity — the first request after idle can take 50+ seconds.
- **Mobile**: Not published to app stores yet. Distributed as a directly-installable APK (local build or EAS internal-distribution build).
