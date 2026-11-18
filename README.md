# ContractLens AI — Premium Edition

**Version 2.3.0 · Understand before you sign.** A local-first contract intelligence workspace for rental/lease, loan, employment, and gig-work agreements.

This upgraded package keeps the complete ContractLens feature set from the full project and refreshes the interface with a more polished visual system: modern typography, a premium gradient hero, glass-style navigation, softer cards, refined form controls, responsive layouts, and subtle motion. The visual refresh is presentation-only; the existing application modules and IDs are retained.

## Start on Windows

1. Install **Node.js 20 or later** from <https://nodejs.org/>.
2. Extract this ZIP into a folder you can write to.
3. Double-click `START-WINDOWS.bat`.
4. The app opens at <http://127.0.0.1:3000>. Keep the terminal window open while using it.

## Start on macOS / Linux

Install Node.js 20 or later, then run:

```bash
chmod +x START-MAC-LINUX.sh
./START-MAC-LINUX.sh
```

Or launch manually:

```bash
node backend/server.js
```

Then visit <http://127.0.0.1:3000>.

## Features included

See [`FEATURES.md`](FEATURES.md) for the full feature inventory. Main modules include:

- Contract upload and analysis for PDF, DOCX, TXT, Markdown, RTF, and pasted text
- Risk dashboard, clause findings, financial exposure, and contract-type detection
- Interactive smart document reader, highlighted clauses, explain/define selection tools, and plain-English reading modes
- Contract Risk DNA, combined-clause detection, missing-information checks, and clause relationship map
- Ask My Contract with section/page-linked answers
- What-if scenario flows and financial stress simulations
- Negotiation sparring, suggested moves, leverage coaching, redlines, and email playbooks
- Side-by-side contract comparison with per-document PDF/DOCX/TXT/MD/RTF uploads, drag-and-drop, paste-in text, and version-history tracking
- Extracted deadline/renewal reminders and `.ics` calendar export
- Legal terms glossary with beginner/ELI5 mode
- Eight-language voice briefing and voice question controls
- Contract memory and saved-contract vault
- Chrome/Edge Manifest V3 browser assistant and embeddable partner widget/SDK
- Light/dark appearance modes, sample agreements, printing, and exports

## Optional live AI providers

ContractLens works locally with its built-in engine and does not require an API key. To enable optional hybrid analysis, open **AI Engine Settings** inside the app or copy `.env.example` to `.env` and configure a supported provider key. Keep API keys private and do not share the configured project folder.

## Local data and privacy

Analyses and reminders are stored in `documents/contractlens-db.json` on this computer. This distribution starts with an empty vault. The local server binds to `127.0.0.1` by default. Cloud AI is used only when you explicitly configure and select a provider with an API key.

## Browser extension

1. Start the local ContractLens server.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the `extensions` folder.
5. Visit a supported agreement page and use the ContractLens toolbar assistant.

The ecosystem lab in the app includes an interactive browser/partner-widget walkthrough. The extension folder contains the installable Manifest V3 files.

## Verification

With Node.js 20+:

```bash
npm test                  # feature/module verification
npm run test:api          # live local API route smoke tests
npm run test:theme        # translator dark-mode contrast and motion regression checks
npm run benchmark        # risk detection and evidence-grounding benchmark
```

The API smoke test uses a temporary local server and restores the existing `documents/contractlens-db.json` after it finishes. Theme contrast checks calculate the dark palette text/background ratios from the actual design tokens; they do not replace a manual browser check on the target Windows machine.

## Important note

ContractLens is an informational decision-support tool, not a law firm or a substitute for advice from a qualified lawyer. Legal rules vary by jurisdiction and change over time. Verify legal conclusions and important dates with authoritative sources and a qualified professional before acting.
