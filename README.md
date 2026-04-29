# PromptDoc — AI-Powered Documentation Generator

> Built at the **DFW AI Builders Hackathon** 🏆

Stop writing docs. Ship them.

PromptDoc is a browser-based AI agent that takes your code or internal tool description and instantly generates a complete README, API reference, onboarding guide, and hackathon-ready flash pitch — powered by Claude, with zero backend and zero cost.

🔗 **Live Demo:** [https://YOUR_USERNAME.github.io/promptdoc](https://YOUR_USERNAME.github.io/promptdoc)

---

## The Problem

Developers write code but skip docs. Internal tools go undocumented. New teammates spend weeks onboarding because nobody recorded the "why." When the person who built the thing leaves — the knowledge leaves with them.

## What We Built

A single-page web app that:
- Accepts code snippets, function definitions, or plain-English descriptions of internal tools
- Sends them to Claude via the Anthropic API (called directly from the browser)
- Returns structured, production-quality documentation in seconds
- Lets you download as `.md` or copy to clipboard

**Output formats:**
- `README.md` — Overview, installation, usage, examples
- `API Reference` — Parameters, return types, error cases
- `Onboarding Guide` — Step-by-step for new teammates
- `Flash Pitch` — 60-second audience-ready pitch summary

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS |
| AI | Anthropic Claude claude-sonnet-4-20250514 (via `/v1/messages`) |
| Hosting | GitHub Pages (free) |
| Backend | None — zero server cost |

## How to Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/promptdoc
cd promptdoc
# Open index.html in your browser — that's it.
```

Or just visit the [live GitHub Pages site](https://YOUR_USERNAME.github.io/promptdoc).

You'll need an [Anthropic API key](https://console.anthropic.com/) — your key stays in your browser's localStorage and is never sent to any server except Anthropic's.

## Deploy Your Own

1. Fork this repo
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Visit `https://YOUR_USERNAME.github.io/promptdoc`

Done. Free forever.

## What's Next

- **GitHub Action** — Auto-generate docs on every push
- **Multi-file scanning** — Feed an entire repo, get a full wiki
- **Slack bot** — `/promptdoc [function name]` in any channel
- **Doc drift detection** — Alert when code changes but docs don't
- **VS Code extension** — Right-click → Generate Docs

## Hackathon Pitch

**Problem:** Undocumented internal tools are technical debt in disguise.  
**Solution:** An AI agent that writes the docs so you don't have to.  
**Demo:** Paste code → get a README in 10 seconds.  
**Next:** GitHub Action that keeps docs in sync with your codebase automatically.

---

Built with ❤️ in Dallas · [MIT License](LICENSE)
