from fastapi import FastAPI, UploadFile, File
from file_processor import process_file

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Service is running"
    }


@app.post("/process-files")
async def process_files(file: UploadFile = File(...)):

    content = await file.read()

    text = content.decode("utf-8", errors="ignore")

    result = process_file(
        file.filename,
        text
    )

    if result is None:
        return {
            "message": "This file type is not supported"
        }

    return {
        "message": "File processed successfully",
        "file": result
    }