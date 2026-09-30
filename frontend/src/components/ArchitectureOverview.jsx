import React, { useState } from 'react'
import { getProjectAnalysisAPI, getProjectSummaryAPI } from '../service/allAPI'

// Collapsible folder tree, rendered from the same { name, type, children } shape
// buildFileTree() produces on the backend.
function TreeNode({ node, depth = 0 }) {
    const [open, setOpen] = useState(depth < 1) // top level starts expanded

    if (node.type === "file") {
        return (
            <div className="flex items-center gap-2 py-0.5 font-mono text-xs text-neutral-400" style={{ paddingLeft: depth * 16 }}>
                <span className="text-neutral-600">·</span>
                {node.name}
            </div>
        )
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 py-0.5 font-mono text-xs text-neutral-300 hover:text-white"
                style={{ paddingLeft: depth * 16 }}
            >
                <span className="w-3 text-neutral-500">{open ? "▾" : "▸"}</span>
                {node.name}/
            </button>
            {open && node.children.map((child) => (
                <TreeNode key={child.name} node={child} depth={depth + 1} />
            ))}
        </div>
    )
}

const METHOD_COLORS = {
    GET: "bg-teal-400/15 text-teal-300",
    POST: "bg-blue-400/15 text-blue-300",
    PUT: "bg-amber-400/15 text-amber-300",
    PATCH: "bg-amber-400/15 text-amber-300",
    DELETE: "bg-red-400/15 text-red-300"
}

function ArchitectureOverview({ projectId, cardClass }) {
    const [analysis, setAnalysis] = useState(null)
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(false)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [error, setError] = useState(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getProjectAnalysisAPI(projectId)
            if (res.status === 200) {
                setAnalysis(res.data)
            } else {
                setError(res.data?.message || "Could not analyze this project")
            }
        }
        catch (err) {
            console.log(err.message)
            setError("Something went wrong while analyzing the project.")
        }
        finally {
            setLoading(false)
        }
    }

    const loadSummary = async () => {
        setSummaryLoading(true)
        try {
            const res = await getProjectSummaryAPI(projectId)
            if (res.status === 200) {
                setSummary(res.data.summary)
            } else {
                setSummary(null)
                setError(res.data?.message || "Could not generate a summary")
            }
        }
        catch (err) {
            console.log(err.message)
            setError("Something went wrong while generating the summary.")
        }
        finally {
            setSummaryLoading(false)
        }
    }

    return (
        <div className={`mb-6 p-6 ${cardClass}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Architecture overview</h3>
                {!analysis && (
                    <button
                        type="button"
                        onClick={load}
                        disabled={loading}
                        className="rounded-full bg-teal-400 px-4 py-1.5 text-sm font-semibold text-neutral-950
                                   shadow-[0_0_24px_-4px_rgba(45,212,191,0.6)] hover:bg-teal-300
                                   disabled:opacity-60 transition-colors"
                    >
                        {loading ? "Analyzing…" : "Generate"}
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2 text-sm text-red-100">
                    {error}
                </p>
            )}

            {analysis && (
                <div className="mt-4 space-y-6">
                    <p className="text-xs text-neutral-500">
                        Detected instantly from {analysis.fileCount} stored file(s) — folder structure, function/class
                        names, and API routes. No AI involved in this part, so it's always exact.
                    </p>

                    {/* Optional LLM-written prose summary */}
                    <div>
                        {!summary && (
                            <button
                                type="button"
                                onClick={loadSummary}
                                disabled={summaryLoading}
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium
                                           text-neutral-200 hover:bg-white/10 disabled:opacity-50 transition-colors"
                            >
                                {summaryLoading ? "Writing summary…" : "Write a plain-English summary"}
                            </button>
                        )}
                        {summary && (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">{summary}</p>
                        )}
                    </div>

                    {/* Folder tree */}
                    <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Folder structure</span>
                        <div className="mt-2 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3">
                            {analysis.tree.map((node) => (
                                <TreeNode key={node.name} node={node} />
                            ))}
                        </div>
                    </div>

                    {/* Endpoints */}
                    <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                            API endpoints ({analysis.endpoints.length})
                        </span>
                        {analysis.endpoints.length === 0 ? (
                            <p className="mt-2 text-sm text-neutral-500">None detected.</p>
                        ) : (
                            <div className="mt-2 max-h-72 space-y-1 overflow-auto">
                                {analysis.endpoints.map((e, i) => (
                                    <div key={i} className="flex items-center gap-2 font-mono text-xs">
                                        <span className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${METHOD_COLORS[e.method] || "bg-white/10 text-neutral-300"}`}>
                                            {e.method}
                                        </span>
                                        <span className="text-neutral-300">{e.path}</span>
                                        <span className="truncate text-neutral-600">{e.file}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ArchitectureOverview
