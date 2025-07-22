from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Allow CORS from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def extract_text_from_pdf(pdf_file):
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text


def extract_text(file: UploadFile):
    if file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(file.file.read()))
    return file.file.read().decode("utf-8")


@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_role: str = Form("")):
    try:
        resume_text = extract_text(file)

        if not resume_text.strip():
            return {"error": "Empty file"}

        prompt = f"""Please analyze this resume and provide constructive feedback.
        Focus on:
        1. Content clarity
        2. Skills presentation
        3. Experience descriptions
        4. Improvements for {job_role or 'general applications'}

        Resume:
        {resume_text}
        """

        client = OpenAI(api_key=OPENAI_API_KEY)
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
        return {"error": str(e)}

    @app.post("/upload")
    async def upload_resume(file: UploadFile = File(...)):
        contents = await file.read()
        filename = file.filename

        return {"filename": filename, "message": "File recieved successfully!"}
