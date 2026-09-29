# =====================================================================
# Chat: conversation history + token streaming
# =====================================================================
import json

MAX_HISTORY_TURNS = 10  # most recent messages sent to the LLM


def clean_history(history) -> List[Dict[str, str]]:
    """Keep only the last few valid turns. Old [n] markers are stripped because they
    pointed at excerpts from a *previous* question and would confuse the new numbering."""
    cleaned = []
    for m in (history or [])[-MAX_HISTORY_TURNS:]:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role not in ("user", "assistant") or not content:
            continue
        if role == "assistant":
            content = re.sub(r"\s?\[\d+\]", "", content)
        cleaned.append({"role": role, "content": content[:4000]})
    # providers require the conversation to start with a user turn
    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)
    return cleaned


def retrieval_query(question: str, history: List[Dict[str, str]]) -> str:
    """A follow-up like 'what about the register flow?' is meaningless on its own, so
    borrow the previous user question to give the vector search some context."""
    prev = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
    return f"{prev}\n{question}" if prev else question


def _build_user_message(question: str, results: List[Dict[str, Any]]) -> str:
    return f"Code excerpts:\n\n{_format_context(results)}\n\nQuestion: {question}"


class _ThinkFilter:
    """Drops <think>...</think> from a token stream (some local reasoning models emit it)."""
    def __init__(self):
        self.buf, self.inside = "", False

    def feed(self, piece: str) -> str:
        self.buf += piece
        out = ""
        while True:
            if self.inside:
                end = self.buf.find("</think>")
                if end == -1:
                    self.buf = self.buf[-8:]  # keep a tail in case the tag is split
                    return out
                self.buf, self.inside = self.buf[end + 8:], False
            else:
                start = self.buf.find("<think>")
                if start == -1:
                    keep = 6  # possible partial "<think"
                    out += self.buf[:-keep] if len(self.buf) > keep else ""
                    self.buf = self.buf[-keep:] if len(self.buf) > keep else self.buf
                    return out
                out += self.buf[:start]
                self.buf, self.inside = self.buf[start + 7:], True

    def flush(self) -> str:
        out = "" if self.inside else self.buf
        self.buf = ""
        return out


def _stream_ollama(messages):
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "stream": True,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
                "options": {"num_ctx": OLLAMA_NUM_CTX, "temperature": 0.2, "num_predict": MAX_ANSWER_TOKENS},
            },
            timeout=OLLAMA_TIMEOUT,
            stream=True,
        )
    except requests.exceptions.ConnectionError:
        raise RuntimeError(f"Can't reach Ollama at {OLLAMA_URL}. Install it from ollama.com and make sure it is running.")
    if response.status_code == 404:
        raise RuntimeError(f"Model '{OLLAMA_MODEL}' isn't downloaded. Run: ollama pull {OLLAMA_MODEL}")
    if not response.ok:
        raise RuntimeError(f"Ollama error {response.status_code}: {response.text[:300]}")

    think = _ThinkFilter()
    for line in response.iter_lines():
        if not line:
            continue
        data = json.loads(line)
        piece = think.feed((data.get("message") or {}).get("content", ""))
        if piece:
            yield piece
        if data.get("done"):
            break
    tail = think.flush()
    if tail:
        yield tail


def _stream_gemini(messages):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to Python-aiservice/.env and restart the service.")

    contents = [
        {"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    try:
        response = requests.post(
            f"{GEMINI_URL}/models/{GEMINI_MODEL}:streamGenerateContent?alt=sse",
            headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": contents,
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048},
            },
            timeout=GEMINI_TIMEOUT,
            stream=True,
        )
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Can't reach the Gemini API. Check your internet connection.")

    if response.status_code == 429:
        raise RuntimeError("Gemini free-tier rate limit reached. Wait a minute and try again.")
    if response.status_code == 404:
        raise RuntimeError(f"Gemini model '{GEMINI_MODEL}' was not found. Set GEMINI_MODEL in .env.")
    if response.status_code in (400, 403):
        raise RuntimeError(f"Gemini rejected the request (check GEMINI_API_KEY): {response.text[:300]}")
    if not response.ok:
        raise RuntimeError(f"Gemini error {response.status_code}: {response.text[:300]}")

    got_text = False
    for raw in response.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data:"):
            continue
        payload = raw[5:].strip()
        if not payload or payload == "[DONE]":
            continue
        data = json.loads(payload)
        block = (data.get("promptFeedback") or {}).get("blockReason")
        if block:
            raise RuntimeError(f"Gemini blocked this request ({block}).")
        for cand in data.get("candidates") or []:
            for part in (cand.get("content") or {}).get("parts") or []:
                if part.get("text") and not part.get("thought"):
                    got_text = True
                    yield part["text"]
    if not got_text:
        raise RuntimeError("Gemini returned no text.")


def _stream_anthropic(messages):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY is not set in Python-aiservice/.env")
    from anthropic import Anthropic

    with Anthropic().messages.stream(
        model=ANTHROPIC_MODEL,
        max_tokens=MAX_ANSWER_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text


def stream_answer(question: str, results: List[Dict[str, Any]], history=None):
    """Yield the answer piece by piece. `history` is the earlier conversation."""
    if not results:
        yield ("I couldn't find any indexed code for this project. "
               "Upload a zip first (files uploaded before indexing was added need to be re-uploaded).")
        return

    messages = clean_history(history) + [{"role": "user", "content": _build_user_message(question, results)}]

    if PROVIDER == "gemini":
        yield from _stream_gemini(messages)
    elif PROVIDER == "anthropic":
        yield from _stream_anthropic(messages)
    else:
        yield from _stream_ollama(messages)