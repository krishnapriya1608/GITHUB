from fastapi import FastAPI, UploadFile, File
from file_processor import process_file


app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Service is running"
    }


@app.post("/process-files")
async def process_files(files: list[UploadFile] = File(...)):

    processed_files = []

    for file in files:

        content = await file.read()

        text = content.decode("utf-8", errors="ignore")

        result = process_file(
            file.filename,
            text
        )

        if result:
            processed_files.append(result)

    return {
        "message": "Files processed successfully",
        "files": processed_files
    }