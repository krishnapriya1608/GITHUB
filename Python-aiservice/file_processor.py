import os


# File types that our AI service should process
ALLOWED_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".html",
    ".css",
    ".json"
}


# Folders that we don't want to process
IGNORED_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "__pycache__",
    "venv"
}


def is_allowed_file(filename):
    """
    Check whether the file is a code/configuration file
    that our AI service should process.
    """

    extension = os.path.splitext(filename)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def chunk_text(text, chunk_size=1000):
    """
    Split a large file into smaller pieces.
    """

    chunks = []

    for i in range(0, len(text), chunk_size):
        chunk = text[i:i + chunk_size]
        chunks.append(chunk)

    return chunks


def process_file(filename, content):
    """
    Process one uploaded file.
    """

    if not is_allowed_file(filename):
        return None

    chunks = chunk_text(content)

    return {
        "file_name": filename,
        "characters": len(content),
        "chunks": chunks,
        "chunk_count": len(chunks)
    }