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
