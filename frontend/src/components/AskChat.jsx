import React, { useEffect, useRef, useState } from 'react'
import { askProjectStreamAPI } from '../service/allAPI'

const MAX_HISTORY = 10

const SUGGESTIONS = [
    "How does authentication work?",
    "Where are passwords hashed?",
    "Give me an overview of the project structure",
]

// Chat with the codebase: keeps the conversation, streams answers token by token.
function AskChat({ projectId, onOpenSource, cardClass }) {
    const [messages, setMessages] = useState([])   // { role, content, sources?, streaming?, error? }
    const [input, setInput] = useState("")
    const [busy, setBusy] = useState(false)
    const abortRef = useRef(null)
    const scrollRef = useRef(null)
    const stickToBottom = useRef(true)

    // Auto-scroll while streaming, unless the user has scrolled up to read
    useEffect(() => {
        const el = scrollRef.current
        if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
    }, [messages])

    // Cancel any in-flight answer on unmount or when switching project
    useEffect(() => {
        return () => abortRef.current?.abort()
    }, [projectId])

    const onScroll = () => {
        const el = scrollRef.current
        if (!el) return
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    }

    // patch the last (assistant) message
    const updateLast = (fn) =>
        setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...fn(m) } : m)))

    const send = async (text) => {
        const question = text.trim()
        if (!question || busy) return

        // history = finished turns only (skip failed/empty ones)
        const history = messages
            .filter((m) => m.content && !m.error)
            .slice(-MAX_HISTORY)
            .map((m) => ({ role: m.role, content: m.content }))

        stickToBottom.current = true
        setInput("")
        setBusy(true)
        setMessages((prev) => [
            ...prev,
            { role: "user", content: question },
            { role: "assistant", content: "", sources: [], streaming: true },
        ])

        const controller = new AbortController()
        abortRef.current = controller

        await askProjectStreamAPI(
            projectId,
            { question, topK: 8, history },
            {
                onSources: (sources) => updateLast(() => ({ sources })),
                onToken: (t) => updateLast((m) => ({ content: m.content + t })),
                onDone: () => updateLast(() => ({ streaming: false })),
                onError: (message) => updateLast(() => ({ streaming: false, error: message })),
            },
            controller.signal
        )

        // aborted (Stop) or finished: make sure the cursor goes away
        updateLast(() => ({ streaming: false }))
        setBusy(false)
        abortRef.current = null
    }

    const stop = () => abortRef.current?.abort()

    const clearChat = () => {
        abortRef.current?.abort()
        setMessages([])
        setBusy(false)
    }

    // Turn "[1]" markers into clickable citation chips
    const renderWithCitations = (text, sources = []) =>
        text.split(/(\[\d+\])/g).map((part, i) => {
            const match = part.match(/^\[(\d+)\]$/)
            const source = match && sources.find((s) => s.number === Number(match[1]))
            if (!source) return <span key={i}>{part}</span>
            return (
                <button
                    key={i}
                    type="button"
                    onClick={() => onOpenSource(source)}
                    title={`${source.filename} lines ${source.start_line}-${source.end_line}`}
                    className="mx-0.5 rounded-md bg-teal-400/15 px-1.5 font-mono text-[11px] font-medium text-teal-300 hover:bg-teal-400/25"
                >
                    {match[1]}
                </button>
            )
        })

    return (
        <div className={`mb-6 p-6 ${cardClass}`}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Ask the codebase</h3>
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={clearChat}
                        className="text-xs text-neutral-400 hover:text-teal-300 transition-colors"
                    >
                        New chat
                    </button>
                )}
            </div>

            {/* Conversation */}
            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="max-h-[32rem] space-y-4 overflow-y-auto pr-1"
            >
                {messages.length === 0 && (
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => send(s)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:border-teal-400/40 hover:text-teal-200 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((m, i) =>
                    m.role === "user" ? (
                        <div key={i} className="flex justify-end">
                            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-teal-400/15 px-4 py-2 text-sm text-teal-50">
                                {m.content}
                            </p>
                        </div>
                    ) : (
                        <div key={i} className="max-w-[95%]">
                            {m.content ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                                    {renderWithCitations(m.content, m.sources)}
                                    {m.streaming && (
                                        <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-teal-300" />
                                    )}
                                </p>
                            ) : (
                                m.streaming && !m.error && (
                                    <p className="text-sm text-neutral-500 animate-pulse">Searching the code…</p>
                                )
                            )}

                            {m.error && (
                                <p className="mt-2 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2 text-sm text-red-100">
                                    {m.error}
                                </p>
                            )}

                            {!m.streaming && m.sources?.length > 0 && m.content && (
                                <details className="mt-3 border-t border-white/10 pt-2">
                                    <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-neutral-300">
                                        Sources ({m.sources.length})
                                    </summary>
                                    <ul className="mt-2 space-y-1">
                                        {m.sources.map((src) => (
                                            <li key={src.chunk_id ?? src.number}>
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenSource(src)}
                                                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-white/5"
                                                >
                                                    <span className="shrink-0 rounded-md bg-teal-400/15 px-1.5 font-mono text-[11px] font-medium text-teal-300">
                                                        {src.number}
                                                    </span>
                                                    <span className="truncate font-mono text-xs text-neutral-300">
                                                        {src.path && <span className="text-neutral-500">{src.path}/</span>}
                                                        {src.filename}
                                                    </span>
                                                    <span className="shrink-0 text-xs text-neutral-500">
                                                        lines {src.start_line}–{src.end_line}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Input */}
            <form
                onSubmit={(e) => { e.preventDefault(); send(input) }}
                className="mt-4 flex gap-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={messages.length ? "Ask a follow-up…" : "Ask about this codebase, e.g. \"how does authentication work?\""}
                    className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-neutral-100
                               placeholder:text-neutral-500 focus:border-teal-400/50 focus:outline-none
                               focus:ring-1 focus:ring-teal-400/50"
                />
                {busy ? (
                    <button
                        type="button"
                        onClick={stop}
                        className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-neutral-100 hover:bg-white/15 transition-colors"
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="rounded-full bg-teal-400 px-5 py-2.5 text-sm font-semibold text-neutral-950
                                   shadow-[0_0_24px_-4px_rgba(45,212,191,0.6)] hover:bg-teal-300
                                   disabled:opacity-60 transition-colors"
                    >
                        Ask
                    </button>
                )}
            </form>
        </div>
    )
}

export default AskChat