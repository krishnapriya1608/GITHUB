import os


# File types we want the AI to understand
ALLOWED_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".html",
    ".css",
    ".json",
    ".md"
}


# Folders we don't want to process
IGNORED_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "venv",
    "__pycache__",
    ".vscode"
}


def should_ignore_file(filename):
    """
    Check whether the file should be ignored.
    """

    # Example:
    # node_modules/react/index.js
    # ["node_modules", "react", "index.js"]

    parts = filename.replace("\\", "/").split("/")

    # Check whether any folder is an ignored folder
    for part in parts[:-1]:
        if part in IGNORED_DIRS:
            return True

    return False


def is_allowed_file(filename):
    """
    Check whether the file extension is supported.
    """

    extension = os.path.splitext(filename)[1].lower()

    return extension in ALLOWED_EXTENSIONS


def chunk_text(text, chunk_size=1000):
    """
    Split a file into smaller chunks.
    """

    chunks = []

    for i in range(0, len(text), chunk_size):

        chunk = text[i:i + chunk_size]

        chunks.append(chunk)

    return chunks


def process_file(filename, content):
    """
    Process one project file.
    """

    # Ignore unnecessary folders
    if should_ignore_file(filename):
        return None

    # Ignore unsupported file types
    if not is_allowed_file(filename):
        return None

    # Split file into chunks
    chunks = chunk_text(content)

    return {
        "file_name": filename,
        "characters": len(content),
        "chunk_count": len(chunks),
        "chunks": chunks
    }