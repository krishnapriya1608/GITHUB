import React from 'react'
import { Link } from 'react-router-dom'

const CHIP = "inline-flex items-center rounded-sm border border-current bg-transparent px-3 py-1 text-[10px] font-medium tracking-wider uppercase"
const PRIMARY = "inline-flex items-center gap-2.5 rounded-sm bg-[#fafafa] px-6 py-2.5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white active:scale-[0.98]"
const SECONDARY = "inline-flex items-center gap-2.5 rounded-sm border border-white/20 bg-transparent px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"

const GROUPS = [
    {
        tag: "Bring in code",
        color: "text-amber-300",
        intro: "Get a codebase into a project in whichever way is quickest.",
        items: [
            ["ZIP upload", "Upload up to 10 ZIP archives at once. Files are extracted, processed and added to the project."],
            ["GitHub import", "Paste a repository link and import it straight into a project, with no download and re-upload."],
            ["Re-index on demand", "Rebuild a project's search index after the code changes, and check the indexing status while it runs."],
            ["Clean-up controls", "Delete a single file, or remove everything that came from one source."],
        ],
    },
    {
        tag: "Ask and search",
        color: "text-sky-300",
        intro: "Find things by meaning, not just by matching words.",
        items: [
            ["Semantic search", "Search by what the code does, for example 'where is token validation defined?', and get the matching files."],
            ["Ask your codebase", "Ask a question in plain English and get an answer grounded in your project's own files."],
            ["Streaming answers", "Responses appear as they are generated, so you are not waiting on a blank screen."],
            ["Saved chat history", "Each project keeps its conversation. Come back later, or clear it when you are done."],
        ],
    },
    {
        tag: "Understand a project",
        color: "text-emerald-300",
        intro: "Get oriented in unfamiliar code before reading it file by file.",
        items: [
            ["Project analysis", "An automatic breakdown of what the project contains and how it is put together."],
            ["Project summary", "A short overview you can read in a minute when you open a codebase for the first time."],
            ["File browser", "List and open any file that was indexed for the project."],
        ],
    },
    {
        tag: "Accounts and projects",
        color: "text-purple-300",
        intro: "Everything is kept per user and per project.",
        items: [
            ["Separate projects", "Create, rename and delete projects. Each one has its own files, index and chat."],
            ["Email verification", "Sign-up is confirmed with a one-time code sent to your email."],
            ["Password reset", "Forgotten passwords are reset through an emailed link."],
        ],
    },
]

function Features() {
    return (
        <div className="min-h-screen bg-black text-[#fafafa] font-mono selection:bg-[#333] selection:text-white">
            <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
                <Link to="/" className="text-xs font-bold tracking-widest text-neutral-400 hover:text-white uppercase">
                    Codebase
                </Link>
                <nav className="flex items-center gap-3">
                    <Link to="/login" className={`${CHIP} text-neutral-400 hover:text-white`}>Login</Link>
                    <Link to="/register" className={`${CHIP} text-neutral-400 hover:text-white`}>Register</Link>
                    <Link to="/" className={`${CHIP} text-neutral-400 hover:text-white`}>Home</Link>
                    <Link to="/features" className={`${CHIP} text-neutral-400 hover:text-white`}>Features</Link>
                </nav>
            </header>

            <main className="mx-auto max-w-5xl px-6">
                <section className="py-16 md:py-24">
                    <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                        Ask questions about code you did not write.
                    </h1>
                    <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-neutral-400">
                        Codebase indexes a project's files and lets you search and question them in plain
                        English. These are the things it does today.
                    </p>
                </section>

                {GROUPS.map((group) => (
                    <section key={group.tag} className="grid grid-cols-1 gap-8 border-t border-white/10 py-12 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <span className={`${CHIP} ${group.color}`}>{group.tag}</span>
                            <p className="mt-4 max-w-xs font-sans text-xs leading-relaxed text-neutral-500">
                                {group.intro}
                            </p>
                        </div>
                        <dl className="md:col-span-8 divide-y divide-white/5">
                            {group.items.map(([title, text]) => (
                                <div key={title} className="grid grid-cols-1 gap-1 py-4 first:pt-0 sm:grid-cols-3 sm:gap-6">
                                    <dt className="text-sm font-semibold text-white">{title}</dt>
                                    <dd className="font-sans text-xs leading-relaxed text-neutral-400 sm:col-span-2">{text}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}

                <section className="border-t border-white/10 py-16">
                    <h2 className="text-xl font-bold tracking-tight">Try it on a project of your own.</h2>
                    <p className="mt-3 max-w-md font-sans text-xs leading-relaxed text-neutral-500">
                        Create an account, upload a ZIP or import a repository, and start asking.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/register" className={PRIMARY}>Create an account</Link>
                        <Link to="/login" className={SECONDARY}>Log in</Link>
                    </div>
                </section>
            </main>

            <footer className="mx-auto max-w-5xl border-t border-white/5 px-6 py-6 text-[10px] text-neutral-600">
                Codebase, a personal project.
            </footer>
        </div>
    )
}

export default Features
