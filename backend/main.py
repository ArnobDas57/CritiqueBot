from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ✅ Make sure the key is found
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


# Endpoint to analyze resume
@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_role: str = Form("")):
    try:
        # Read file contents once
        file_contents = await file.read()

        # Decode bytes to string for prompt
        resume_text = file_contents.decode()

        prompt = f"""You are an expert resume reviewer. Review the following resume for a {job_role} position, and give actionable, detailed feedback:\n\n{resume_text}"""

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Referer": "http://localhost:3000",  # replace with your deployed frontend URL if needed
            "X-Title": "AI Resume Critique",
        }

        body = {
            "model": "openai/gpt-4o",  # you can switch models here if you want
            "messages": [
                {"role": "system", "content": "You are an expert resume reviewer."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
            )
            response.raise_for_status()
            result = response.json()

        return {"analysis": result["choices"][0]["message"]["content"]}

    except Exception as e:
        return {"error": f"Error analyzing resume: {str(e)}"}


# (Optional) Separate endpoint to test file upload
@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename
    return {"filename": filename, "message": "File received successfully!"}
