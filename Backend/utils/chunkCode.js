// Code-aware chunker.
// Cuts a file into ~TARGET_CHARS chunks, preferring to break right before a
// function / class / heading so a function isn't split in half. If a stretch
// has no natural boundary it is hard-split at MAX_CHARS with a few lines of
// overlap. Each chunk remembers its 1-based line range so answers can cite it.

const TARGET_CHARS = 1200   // start looking for a boundary after this much text
const MAX_CHARS = 2000      // never let a chunk grow past this
const OVERLAP_LINES = 3     // lines repeated after a hard split

// Lines that usually start a new logical block (JS/TS, Python, Java, Markdown)
const BOUNDARY = new RegExp(
    '^\\s{0,4}(' +
    '(export\\s+)?(default\\s+)?(async\\s+)?function\\b|' +
    '(export\\s+)?(default\\s+)?(abstract\\s+)?class\\b|' +
    '(export\\s+)?(interface|enum|type)\\s+\\w+|' +
    '(export\\s+)?const\\s+\\w+\\s*=\\s*(async\\s*)?(\\(|function\\b|\\w+\\s*=>)|' +
    '(exports\\.\\w+|module\\.exports)\\s*=|' +
    '(async\\s+)?def\\s+\\w+|' +
    '@\\w+|' +
    '(public|private|protected)\\s+(static\\s+)?[\\w<>\\[\\],\\s]+\\(|' +
    '#{1,3}\\s' +
    ')'
)

const chunkCode = (content) => {
    const lines = content.split('\n')
    const chunks = []

    let start = 0 // index of first line in the current chunk
    let size = 0  // chars in the current chunk

    const sizeOf = (from, to) => {
        let total = 0
        for (let k = from; k < to; k++) total += lines[k].length + 1
        return total
    }

    const flush = (endExclusive, withOverlap) => {
        const text = lines.slice(start, endExclusive).join('\n')
        if (text.trim()) {
            chunks.push({ text, startLine: start + 1, endLine: endExclusive })
        }
        start = withOverlap
            ? Math.max(endExclusive - OVERLAP_LINES, start + 1)
            : endExclusive
        size = sizeOf(start, endExclusive)
    }

    for (let i = 0; i < lines.length; i++) {
        const len = lines[i].length + 1

        if (i > start) {
            if (size >= TARGET_CHARS && BOUNDARY.test(lines[i])) {
                flush(i, false)
            } else if (size + len > MAX_CHARS) {
                flush(i, true)
            }
        }
        size += len
    }

    if (start < lines.length) flush(lines.length, false)

    return chunks
}

module.exports = chunkCode