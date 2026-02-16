BlockMed teaching materials
===========================

This folder contains a Markdown slide deck and instructions for converting to PPTX or web slides. It also lists quick demo commands tied to the repository so instructors can run hands-on labs.

Files
- `slides.md` — the lesson slides in Markdown, leveled for grade 6 → university.

Quick setup (macOS, zsh)

1. Install dependencies for the project (run from repo root):

```bash
npm install
```

2. Start the full local demo (Hardhat node, deploy, and dev server):

```bash
npm run start
```

3. If you only want a local chain and to manually deploy, run:

```bash
npm run blockchain    # hardhat node
npm run deploy:raw   # deploy contracts to localhost network
npm run dev          # start the frontend
```

Convert slides to PPTX

1. Install Pandoc (homebrew) and convert:

```bash
brew install pandoc
pandoc teaching/slides.md -t pptx -o teaching/BlockMed_Slides.pptx
```

2. For web slides (Reveal.js) live present:

```bash
npm install -g reveal-md
npx reveal-md teaching/slides.md
```

Instructor checklist (mapping to requirements)

- Prepare environment & deps: Done (npm install)
- Run demo app & chain: Done (npm run start)
- Slides for levels: Provided in `slides.md`
- Conversion to PPTX: Instructions provided (Pandoc) — teacher to run locally

Notes
- This repository already exposes scripts that make demos easy. The `teaching/slides.md` is intentionally minimal Markdown so you can edit and tailor slides for your audience.
- If you want, I can generate a ready PPTX from `slides.md` and add screenshots from the UI — tell me which pages to capture and I'll create them.
