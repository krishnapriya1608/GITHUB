import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import Footer from '../components/Footer'

const PANEL = "relative overflow-hidden rounded-sm bg-[#0a0a0a] border border-white/5 shadow-inner";
const CHIP = "inline-flex items-center rounded-sm border border-current bg-transparent px-3 py-1 text-[10px] font-medium tracking-wider uppercase";
const PRIMARY = "inline-flex items-center gap-2.5 rounded-sm bg-[#fafafa] px-6 py-2.5 text-xs font-semibold text-[#0a0a0a] transition hover:bg-white active:scale-[0.98]";
const SECONDARY = "inline-flex items-center gap-2.5 rounded-sm border border-white/20 bg-transparent px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]";

// Core workflow steps
const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload & Auto-Filter",
    text: "Drop in a .zip file. Source code, markdown docs, and configuration files are ingested while build artifacts, node_modules, lock files, and binary files are automatically excluded.",
    tag: "DISCRETE CHUNKING"
  },
  {
    step: "02",
    title: "Browse with Intelligence",
    text: "Navigate through your files with full path displays, line numbers, syntax highlighting, and live file size metrics for total situational visibility.",
    tag: "LIVE TELEMETRY"
  },
  {
    step: "03",
    title: "Semantic Vector Search",
    text: "Perform search queries based on contextual intent rather than exact string matches. Query patterns like 'authentication flow' or 'payment gateway logic' and jump directly to exact code lines.",
    tag: "CONTEXTUAL RETRIEVAL"
  },
  {
    step: "04",
    title: "Architecture & RAG Assistant",
    text: "Generate AI structural overviews, detect endpoints and symbols automatically, and chat with your codebase using streaming responses backed by precise inline citations.",
    tag: "COORDINATED DISPATCH"
  }
];

// Technical Capabilities
const CAPABILITIES = [
  {
    title: "Zero-Reupload Re-Indexing",
    description: "Re-chunk and update embeddings for stored codebases at any time without needing to re-upload your zip archives.",
    badge: "PERSISTENT STORAGE"
  },
  {
    title: "Symbol & API Endpoint Detection",
    description: "Automatically extracts route handlers, function signatures, exported components, and service interfaces into a centralized map.",
    badge: "AST PARSING"
  },
  {
    title: "Citation-Backed AI Responses",
    description: "Every answer streamed by the AI assistant contains interactive source tags that link directly to exact file paths and line ranges.",
    badge: "PRECISE CITATIONS"
  },
  {
    title: "Local & Cloud Model Interoperability",
    description: "Connect your project indexes seamlessly with custom LLM endpoints or proprietary embedding pipelines.",
    badge: "HYBRID PIPELINE"
  }
];

// Supported languages and formats
const SUPPORTED_STACK = [
  "JavaScript / TypeScript", "React / Next.js", "Node.js / Express",
  "Python / Django / FastAPI", "Go / Rust", "Java / Spring Boot",
  "HTML5 / Tailwind CSS", "JSON / YAML / Markdown", "Docker / K8s Configs"
];

// Frequently Asked Questions
const FAQS = [
  {
    q: "How are files filtered during archive upload?",
    a: "The system scans the upload stream and automatically discards heavy build directories (node_modules, .next, dist, build), lock files (package-lock.json, yarn.lock), media assets, and binaries to preserve vector index performance."
  },
  {
    q: "Can I inspect individual source files directly in the browser?",
    a: "Yes. The built-in codebase browser renders complete file trees with line numbers, code highlighting, and path breadcrumbs."
  },
  {
    q: "How does semantic search differ from regular text search?",
    a: "Instead of searching for raw keywords, semantic search uses vector embeddings to understand the underlying logic of your query, finding relevant code snippets even if different variable names or concepts are used."
  },
  {
    q: "Are my uploaded project files persistent?",
    a: "Yes. Projects remain stored securely under your account dashboard so you can return to chat, search, or inspect files at any time."
  }
];

function Home() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(".gsap-fade", 
        { y: 25, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 }
      )
      .fromTo(".gsap-panel", 
        { x: -20, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 
        "-=0.4"
      );
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-[#fafafa] font-mono selection:bg-[#333] selection:text-white">
      {/* Top Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* <Logo className="h-5" /> */}
          <span className="text-xs tracking-widest text-neutral-400 font-bold uppercase">CODEBASE</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate("/login")} className={`${CHIP} text-neutral-400 hover:text-white`}>
            Sign In
          </button>
          <button type="button" onClick={() => navigate("/dashboard")} className={PRIMARY}>
            Launch Console ↗
          </button>
        </div>
      </header>

      {/* Large Background Typography */}
      <div
        aria-hidden="true"
        className="gsap-fade pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 select-none text-[clamp(100px,20vw,240px)] font-bold leading-none tracking-tight text-white/[0.03] uppercase"
      >
        INTELLIGENCE
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-8 pt-32 pb-24 space-y-28">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end border-b border-white/5 pb-16">
          <div className="gsap-fade md:col-span-8 space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight uppercase max-w-3xl">
              Understand Any Codebase in Seconds
            </h1>
            <p className="text-sm font-sans leading-relaxed text-neutral-400 max-w-2xl">
              An intelligent codebase comprehension engine designed to ingest source code archives, extract system architecture, enable vector-based semantic search, and provide citation-backed AI answers.
            </p>
          </div>
          <div className="gsap-fade md:col-span-4 flex flex-col items-start md:items-end justify-between gap-6">
            <div className="text-xs leading-relaxed text-neutral-500 font-sans text-left md:text-right max-w-xs">
              Built for full-stack engineers, code reviewers, and software architects who need instant visibility into complex projects.
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/dashboard")} className={PRIMARY}>
                Get Started
              </button>
              <a href="#how-it-works" className={SECONDARY}>
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Feature Map / Workflow */}
        <section id="how-it-works" className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
            <div>
              <span className={`${CHIP} text-amber-300 mb-2`}>WORKFLOW ENGINE</span>
              <h2 className="text-2xl font-bold uppercase tracking-tight">How It Works</h2>
            </div>
            <p className="text-xs font-sans text-neutral-500 max-w-md">
              From repository compression to real-time RAG context retrieval, follow the multi-stage code analysis pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.step} className={`${PANEL} gsap-panel flex flex-col h-[320px] transition hover:border-white/20 group`}>
                <div className="flex h-[120px] flex-col justify-between p-5 border-b border-white/5 bg-white/[0.01]">
                  <span className="text-3xl font-extrabold text-[#fafafa]">{step.step}</span>
                  <span className={`${CHIP} text-amber-300 w-fit`}>{step.tag}</span>
                </div>
                <div className="flex-1 flex flex-col justify-between p-5">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{step.title}</h3>
                    <p className="text-[11px] leading-relaxed text-neutral-500 font-sans group-hover:text-neutral-300 transition">
                      {step.text}
                    </p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-neutral-300 group-hover:border-white group-hover:bg-white group-hover:text-[#0a0a0a] transition text-xs">↗</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Capabilities Grid */}
        <section className="space-y-8">
          <div className="border-b border-white/5 pb-4">
            <span className={`${CHIP} text-sky-400 mb-2`}>CORE ENGINE</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Technical Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className={`${PANEL} p-6 space-y-3 hover:border-white/15 transition`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold uppercase tracking-wide text-white">{cap.title}</h3>
                  <span className={`${CHIP} text-sky-300`}>{cap.badge}</span>
                </div>
                <p className="text-xs font-sans text-neutral-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported Ecosystems & Technology Stack */}
        <section className="space-y-6 bg-[#080808] p-8 border border-white/5 rounded-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
            <div>
              <span className={`${CHIP} text-purple-400 mb-2`}>ECOSYSTEM</span>
              <h2 className="text-xl font-bold uppercase tracking-tight">Supported Stack & Formats</h2>
            </div>
            <p className="text-xs font-sans text-neutral-500">
              Compatible with modern web frameworks, backend services, and configuration formats.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {SUPPORTED_STACK.map((item) => (
              <span key={item} className="px-3.5 py-1.5 rounded-sm border border-white/10 bg-white/[0.03] text-xs font-mono text-neutral-300">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Interactive Query / Terminal Preview Demo */}
        <section className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <span className={`${CHIP} text-emerald-300 mb-2`}>LIVE DEMONSTRATION</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Semantic Query Output</h2>
          </div>

          <div className={`${PANEL} bg-[#050505] p-6 font-mono text-xs space-y-4 border-white/10`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-neutral-500">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                <span className="ml-2">terminal@codebase-engine:~</span>
              </span>
              <span>INDEX: ONLINE</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-neutral-400">
                <span className="text-emerald-400">$</span> codebase search --query <span className="text-amber-300">"Where is token validation defined?"</span>
              </div>
              <div className="text-neutral-500 text-[11px] pl-4 border-l-2 border-amber-400/30 py-1 space-y-1">
                <p className="text-white font-semibold">Matched 2 source citations:</p>
                <p>1. <span className="text-sky-300">src/middleware/authMiddleware.js</span> (Lines 14–32)</p>
                <p>2. <span className="text-sky-300">src/utils/jwtHelper.js</span> (Lines 5–18)</p>
              </div>
              <div className="text-neutral-300 font-sans text-xs pt-2 leading-relaxed bg-white/[0.02] p-3 rounded-sm border border-white/5">
                <span className="font-mono text-amber-300 text-[10px] uppercase font-bold block mb-1">[AI Assistant Response]</span>
                Token validation is handled in <code className="text-sky-300 font-mono">authMiddleware.js</code> via the <code className="text-sky-300 font-mono font-bold">verifyToken()</code> function, which extracts the bearer token from incoming HTTP authorization headers and validates it using secret keys declared in <code className="text-sky-300 font-mono">jwtHelper.js</code>.
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <span className={`${CHIP} text-neutral-400 mb-2`}>KNOWLEDGE BASE</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <div key={faq.q} className={`${PANEL} overflow-hidden transition`}>
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-5 text-left font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/[0.02]"
                >
                  <span>{faq.q}</span>
                  <span className="text-neutral-500 font-bold text-sm">{openFaq === index ? "−" : "+"}</span>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 pt-1 text-xs font-sans leading-relaxed text-neutral-400 border-t border-white/5 bg-black/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Call-to-Action Panel */}
        <section className="border border-white/10 bg-[#0d0d0d] p-10 rounded-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white">
              Ready to analyze your repository?
            </h2>
            <p className="text-xs font-sans text-neutral-400 max-w-lg leading-relaxed">
              Upload your code archive today and experience instant semantic search, structural overview, and citation-backed AI conversations.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-start md:justify-end gap-3">
            <button type="button" onClick={() => navigate("/dashboard")} className={PRIMARY}>
              Open Console
            </button>
          </div>
        </section>

      </main>

    

      <Footer/>
    </div>
  );
}

export default Home;