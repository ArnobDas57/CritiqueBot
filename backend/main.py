from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ✅ Make sure the key is found
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in environment variables.")

client = OpenAI(api_key=OPENAI_API_KEY)

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
        resume_text = extract_text(file)

        if not resume_text.strip():
            return {"error": "Empty or unreadable file."}

        prompt = f"""Please analyze this resume and provide constructive feedback.
        Focus on:
        1. Content clarity
        2. Skills presentation
        3. Experience descriptions
        4. Improvements for {job_role or 'general applications'}

        Resume:
        {resume_text}
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert resume reviewer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        return {"analysis": response.choices[0].message.content}

    except Exception as e:
        return {"error": f"Error analyzing resume: {str(e)}"}

# (Optional) Separate endpoint to test file upload
@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename
    return {"filename": filename, "message": "File received successfully!"}



