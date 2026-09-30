import React from 'react';

function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0a0a0c] font-mono text-neutral-400">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Network Status */}
          <div className="space-y-4 md:col-span-5">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white">
                Network Status: Operational
              </span>
            </div>
            <p className="max-w-xs font-sans text-xs text-neutral-500 leading-relaxed">
              Autonomous codebase indexing, real-time telemetry, and continuous semantic analysis node.
            </p>
            <div className="flex items-center space-x-3 text-[10px] text-neutral-600">
              <span>LATENCY: 14ms</span>
              <span>•</span>
              <span>NODE: IN-DEL-01</span>
              <span>•</span>
              <span>BUILD: v2.4.9</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 md:col-span-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-200">
              System Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="transition hover:text-emerald-400">
                  // Architecture Features
                </a>
              </li>
              <li>
                <a href="#projects" className="transition hover:text-emerald-400">
                  // Active Repositories
                </a>
              </li>
              <li>
                <a href="#docs" className="transition hover:text-emerald-400">
                  // API Specifications
                </a>
              </li>
              <li>
                <a href="#status" className="transition hover:text-emerald-400">
                  // System Metrics
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Terminal Notice */}
          <div className="space-y-3 md:col-span-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-200">
              Security & Compliance
            </h4>
            <p className="font-sans text-xs text-neutral-500 leading-relaxed">
              All indexed file trees, line metadata, and chunk embeddings are encrypted locally and isolated in session storage.
            </p>
            <div className="inline-block rounded-sm border border-white/5 bg-[#111] px-3 py-1.5 text-[10px] text-neutral-400">
              <code>SHA256: 8f9b...a10e [VERIFIED]</code>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-[11px] text-neutral-600 sm:flex-row">
          <div>
            © 2026 Codebase Intelligence Engine. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="transition hover:text-neutral-400">
              Privacy Protocol
            </a>
            <a href="#terms" className="transition hover:text-neutral-400">
              Terms of Node Usage
            </a>
            <a href="#support" className="transition hover:text-neutral-400">
              Terminal Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;