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

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_text_from_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def extract_text(file: UploadFile):
    if file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(file.file.read()))
    return file.file.read().decode("utf-8")


async def call_with_fallback(
    endpoints: List[str], json_body: dict, headers: dict, timeout: int = 10
) -> dict:
    last_exception = None
    async with httpx.AsyncClient(timeout=timeout) as client:
        for url in endpoints:
            try:
                response = await client.post(url, json=json_body, headers=headers)
                print(f"✅ Response status: {response.status_code}")
                print(f"✅ Response body: {response.text}")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                last_exception = e
                print(f"⚠️ Request to {url} failed: {e}")
        raise last_exception


@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_role: str = Form("")):
    try:
        if file.content_type not in ["application/pdf", "text/plain"]:
            return {
                "error": "Unsupported file type. Please upload a PDF or plain text file."
            }

        file_contents = await file.read()

        try:
            resume_text = file_contents.decode("utf-8")
        except UnicodeDecodeError:
            resume_text = file_contents.decode("latin-1")

        # Limit resume_text length to avoid huge payloads
        max_resume_length = 2000
        if len(resume_text) > max_resume_length:
            resume_text = resume_text[:max_resume_length] + "\n...[truncated]"

        prompt = (
            f"I am applying for a {job_role} role.\n"
            f"Here is my resume:\n\n"
            f"---RESUME START---\n"
            f"{resume_text}\n"
            f"---RESUME END---\n\n"
            "Please review my resume and give actionable feedback focused on clarity, impact, keywords, formatting, grammar, and alignment with the job."
        )

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

        body = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "system", "content": "You are an expert resume reviewer."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        print("Sending payload:", body)  # Debug print

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=body,
                headers=headers,
            )
            response.raise_for_status()
            result = response.json()

        return {"analysis": result["choices"][0]["message"]["content"]}

    except httpx.HTTPStatusError as exc:
        return {
            "error": f"❌ HTTP error {exc.response.status_code}: {exc.response.text}"
        }
    except Exception as e:
        return {"error": f"❌ Error analyzing resume: {str(e)}"}


@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename
    return {"filename": filename, "message": "File received successfully!"}
