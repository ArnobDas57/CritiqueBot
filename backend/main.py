from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
import httpx
from dotenv import load_dotenv
from typing import List

# Load environment variables
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("❌ OPENROUTER_API_KEY not found in environment variables.")

app = FastAPI()

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Utility to extract text from PDF
def extract_text_from_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


# General file text extractor
def extract_text(file: UploadFile):
    if file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(file.file.read()))
    return file.file.read().decode("utf-8")


# Fallback helper to try multiple API endpoints
async def call_with_fallback(
    endpoints: List[str],
    json_body: dict,
    headers: dict,
    timeout: int = 10,
) -> dict:
    last_exception = None
    async with httpx.AsyncClient(timeout=timeout) as client:
        for url in endpoints:
            try:
                response = await client.post(url, json=json_body, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                last_exception = e
                print(f"⚠️ Request to {url} failed: {e}")
        raise last_exception


# Endpoint to analyze resume
@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_role: str = Form("")):
    try:
        # Check supported file types early
        if file.content_type not in ["application/pdf", "text/plain"]:
            return {
                "error": "Unsupported file type. Please upload a PDF or plain text file."
            }

        file_contents = await file.read()

        # Decode file contents safely
        try:
            resume_text = file_contents.decode("utf-8")
        except UnicodeDecodeError:
            resume_text = file_contents.decode("latin-1")

        prompt = f"""You are an expert resume reviewer. Review the following resume for a {job_role} position, and give actionable, detailed feedback:\n\n{resume_text}"""

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Referer": "http://localhost:3000",
            "X-Title": "AI Resume Critique",
            "Content-Type": "application/json",
        }

        body = {
            "model": "openchat/openchat-3.5",  # Change model here if desired
            "messages": [
                {"role": "system", "content": "You are an expert resume reviewer."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        api_endpoints = [
            "https://api.openrouter.ai/v1/chat/completions",
            "https://openrouter.ai/api/v1/chat/completions",
            # Add other fallback endpoints here if any
        ]

        result = await call_with_fallback(api_endpoints, body, headers)

        return {"analysis": result["choices"][0]["message"]["content"]}

    except Exception as e:
        return {"error": f"❌Error analyzing resume: {str(e)}"}


# (Optional) Separate endpoint to test file upload
@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename
    return {"filename": filename, "message": "File received successfully!"}
