# GitHub Repository Analyzer 🔍🧠

A powerful tool to **inspect GitHub repositories and releases**, combining **malware scanning via VirusTotal** with **AI-powered source code analysis**.

This project is designed for **security auditing, reverse-engineering, and codebase understanding**, enabling automated analysis of both **binary releases** and **source code structure**.

---

## ✨ Features

### 🦠 GitHub Releases Malware Scan
- Fetches **latest or specific GitHub releases**
- Downloads release assets
- Scans binaries using **VirusTotal API**
- Detects:
  - Malicious files
  - Suspicious heuristics
  - Known threats
- Supports ZIP detection and validation

---

### 🧠 AI-Powered Repository Analysis (NEW)
- Scans **entire GitHub repositories** (no skipped files)
- Automatically detects:
  - Tech stack (Go, Node, Bun, Vite, Next.js, etc.)
  - Entry points
  - Main folders & modules
- Produces a **human-readable summary** of what the repo does
- Generates a **structured JSON report** for AI agents:
  - Architecture
  - Data flow
  - Security findings
  - Refactor suggestions
  - Next automation steps

⚠️ Built with **token-safe batching** to avoid LLM request size limits.


---

---

##2️⃣ Environment variables

Create a .env file:

GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxx
VIRUS_TOTAL_APIKEY=xxxxxxxxxxxxxxxx
GROQ_API_KEY=xxxxxxxxxxxxxxxx

---

## Results

---

=== SCAN RESULT ===
files fetched: 46
tech stack: Go, Bun, Vite, Next.js

=== HUMAN SUMMARY ===
This repository implements a Go desktop launcher with a React/Vite UI...

=== ANALYSIS JSON ===
{ architecture, securityFindings, refactors, ... }

---

##🔬 VirusTotal Release Analysis

The tool can also scan GitHub release assets:

Fetch latest release

Extract assets

Submit binaries to VirusTotal

Retrieve detection stats

Example use case:

GithubService.getRepoLatestReleaseAttachments("owner", "repo");
AnalysisService.checkFile(buffer);


🧠 AI Output Schema

The AI returns strict JSON:

{
  "humanSummary": "string",
  "techStack": ["string"],
  "entrypoints": ["string"],
  "keyFolders": [{"path": "string", "purpose": "string"}],
  "modules": [{"name": "string", "paths": ["string"], "responsibility": "string"}],
  "dataFlow": [{"from": "string", "to": "string", "notes": "string"}],
  "securityFindings": [{"severity": "low|medium|high", "title": "string", "evidence": "string", "fix": "string"}],
  "refactors": [{"priority": "p0|p1|p2", "title": "string", "why": "string", "how": "string"}],
  "aiNextSteps": [{"task": "string", "inputsNeeded": ["string"], "expectedOutput": "string"}]
}

🛡️ Safety & Limits

Automatic request chunking to avoid LLM size limits

Retry & shrink logic on 413 Request too large

Graceful fallback summaries if AI fails

Rate-limit aware GitHub scanning

🎯 Use Cases

Malware analysis of open-source releases

Security audits

AI agents that explore unfamiliar codebases

Reverse-engineering tooling

Automated architecture documentation

🧩 Roadmap

🔍 Smart file prioritization (README, configs first)

📦 ZIP deep inspection

🧠 Embeddings-based code search

🌐 Web UI dashboard

🔐 Private repository support

