# 😴 LazyScript

> **Private Tool: Turn typed text into realistic handwritten assignments.**

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7)
![Status](https://img.shields.io/badge/Status-Private-red)


## 🚀 LazyScript v21.0.0 — Formula & Image Layout Release

### New in v21
- **Mathematical formula editor:** insert inline or centred display equations using LaTeX and MathJax.
- **Editable formula source:** click an inserted equation to reopen and edit its original LaTeX.
- **Vector formula layout:** formulas are measured as dedicated layout segments for improved spacing and PDF clarity.
- **Fixed image frames:** choose common aspect ratios and select Contain (no crop) or Cover (crop to fill).
- **Project hardening:** validated project imports, legacy defaults, bounded drawing data, and safer save/load handling.
- **PDF export feedback:** progress, empty-document checks and actionable error messages.

### Compatibility and known limitations
- Existing `.lazy` / JSON projects remain supported through settings normalization.
- MathJax is loaded on demand from a CDN the first time a formula is inserted, so first use requires internet access.
- Formula SVGs are rasterized with the existing high-resolution A4 canvas when the final PDF is generated; formulas remain editable in the source project.
- The current editor and canvas pagination engine are retained. This is an incremental upgrade, not a full editor rewrite.
- Build and browser QA still need to be run in an environment where npm dependencies can be installed. See `QA_CHECKLIST.md` before deployment.

## 🌟 Overview
**LazyScript** is a custom tool built to convert digital text into realistic handwritten documents. It supports complex formatting like tables, images, and text alignment, rendering everything onto a canvas that simulates A4 paper.

**[🔴 Live Demo](https://lazyscript.netlify.app)**

---

## ✨ Features

### ✍️ Core Handwriting Engine
* **Realistic Rendering:** Converts text to handwriting using 6 distinct font styles (Standard, Cursive, Messy, etc.).
* **Human Imperfections:** adjustable **Messiness** (skew/rotation) and **Spacing** sliders to mimic natural writing.
* **Paper Styles:** Toggle between **Lined**, **Grid**, or **Blank** backgrounds.
* **Visual Effects:**
    * **Scanner Mode:** Adds shadows and noise to look like a scanned document.
    * **Blue/Red Lines:** Adjustable opacity for the page ruling.

### 🛠 Editor Tools
* **Rich Text:** Support for **Bold**, **Underline**, and multiple **Ink Colors**.
* **Smart Tables:** Create tables with advanced controls to **Merge Cells**, add/remove rows, and auto-resize columns.
* **Case Management:** Instantly convert text to **UPPERCASE**, **lowercase**, or **Title Case**.
* **Image Support:** Drag and drop images which render with a "taped-on" visual effect.

### 🤖 AI Assistance
* **Prompt Generator:** Built-in tool to generate a system prompt for ChatGPT/Gemini. This ensures the AI outputs answers in a format LazyScript can read perfectly (HTML/Tables).

### 💾 Export & Save
* **PDF Export:** Downloads high-resolution A4 PDFs.
* **Project Files:** Save/Load your work using `.lazy` JSON files to preserve settings and content.

---

## 🛠️ Project Structure

```
src/
├── App.tsx          # Core Application Logic (State, Render Loop, UI)
├── index.css        # Tailwind Imports & Custom CSS
├── main.tsx         # React Entry Point
└── vite-env.d.ts    # TypeScript Definitions
public/
└── shinchan.jpeg    # Favicon Image
```

---

## 🚀 Installation & Local Development

1. **Clone the repository**
   ``` bash
   git clone https://github.com/mr-vabs/lazyscript.git
   cd lazyscript
   ```

2. **Install Dependencies**
   ``` bash
   npm install
   ```

3. **Start the Dev Server**
   ``` bash
   npm run dev
   # Open http://localhost:5173 in your browser
   ```

---

## 🚀 Deployment (GitHub → Netlify)

This repository includes `netlify.toml`; Netlify is configured to run `npm run build` and publish `dist` using Node.js `22.16.0`.

1. Extract this ZIP and push the **contents** of `lazyscript-main/` to the root of your GitHub repository (not an extra nested folder).
2. In Netlify, choose **Add new site → Import an existing project** and select the GitHub repository.
3. Select the branch you want Netlify to deploy (for example, `main`).
4. Confirm the build command is `npm run build` and the publish directory is `dist` (Netlify should read both from `netlify.toml`).
5. Save and deploy. Future pushes to the connected branch will trigger deployments automatically.

A GitHub Actions workflow is included to run dependency installation, linting, and the production build on pushes and pull requests. Wait for it to pass before promoting a deploy preview. See `BUILD_STATUS.md` and `QA_CHECKLIST.md`; this package has not yet received a successful build/browser QA certification in the environment where it was assembled.

### Existing private-repository setup notes

Since this is a private repo, connect your GitHub account to Netlify:

1. Push code to this repository.
2. Go to **Netlify Dashboard** -> **Add new site** -> **Import from Git**.
3. Authorize Netlify to access your **Private Repositories**.
4. Select `lazyscript`.
5. **Build Settings:**
   - **Command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy**.

---

## 📜 Full Changelog

### 🚀 Changelog v18.2 (Historical baseline)

#### 🔥 Critical Fixes & Logic
- **Matrix Table Algorithm:** Replaced the simple table parser with a robust **2D Grid System**. This fixes alignment issues when using complex `rowSpan` and `colSpan` combinations.
- **Code Block Pagination:** Code blocks now split cleanly across pages instead of bunching up or getting cut off.
- **Ghost Image Fix:** Added a `MutationObserver` with cleanup logic to prevent invisible “ghost” empty spaces when dragging and dropping images.

#### ✨ Enhancements
- **Advanced Anti-OCR:** The PDF exporter now applies a heavy noise filter and rotates the entire page by **0.5°**, preventing PDF readers from selecting text and ensuring a flat scanned-image look.
- **UI Updates:**
  - Swapped **Delete Image** icon → **Backspace**
  - Swapped **Clear Canvas** → **Refresh / New Page**
- **Pagination Logic:** Improved `flushLine` handling to prevent gaps at the bottom of pages when font sizes change dynamically.

---

### 🧪 Changelog v18.1

#### 🆕 New Features
- **Code Block Support:** Added a parser for `<pre>` tags. Code now renders with:
  - A distinct left-side vertical border
  - Preserved indentation and spacing
- **Scanner Mode V1:** Introduced the **Xerox Effect** (High Contrast + Grayscale) for PDF exports.

#### 🛠 Improvements
- **Image Positioning:** Fixed a bug where inserting an image would always place it at the end of the text. Images now correctly respect the cursor position.
- **Table Columns:** Added specific logic to handle **Column Deletion** correctly without breaking layout.

---

### 🎨 Changelog v18.0

#### 🌟 Major Feature — Drawing Mode
- **Pen Tool:** Added a toggle to switch between **Text Mode** and **Drawing Mode**.
- **Bezier Curves:** Implemented smooth stroke rendering for natural-looking digital ink.
- **Undo System:** Added **Undo2** functionality specifically optimized for drawing strokes.
- **Ink Sync:** Drawing color now syncs automatically with the selected **Text Color**.

#### 📱 Mobile & UI
- **Responsive Header:** Fixed z-index and padding issues to ensure the header doesn’t overlap the paper on mobile devices.
- **Toolbar Wrap:** Toolbar buttons now wrap gracefully on smaller screens.
- **Paste AI:** Added a button to parse **HTML directly from the system clipboard**.

### Changelog v17.0

#### New Features
* **AI Integration:** Added a **Robot Icon** 🤖 to the toolbar to copy the specialized AI system prompt.
* **Table Merging:** Added logic to merge table cells both Right and Down (`rowSpan`/`colSpan`).
* **Case Converter:** Added a dropdown menu to toggle text case without retyping.
* **Paper Types:** Introduced logic to switch between Lined, Grid, and Blank paper (`setPaperType`).
* **Toast System:** Replaced standard browser `alert()` with a custom, non-intrusive Toast Notification system for errors and success messages.

#### Improvements
* **Safety:** Added a 3-stage confirmation to the **Clear** button (`Clear?` -> `Really??`) to prevent accidents.
* **Rendering:** Added a visual "tape" effect to inserted images (`ctx.fillRect` corners).
* **Performance:** Implemented a debounce (300ms) on the parser to prevent lag while typing.
* **UI:** Fully implemented Dark Mode styling for the toolbar and editor.

### Changelog v16.4
- **Critical Fix (TS2367):** Changed the declaration of **dominantAlign** in the Renderer loop to explicitly allow all 3 states: 'left' | 'center' | 'right'.
- **Explicit Casting:** Added specific type casting inside the loop (seg.align as ...) to ensure data flows correctly without narrowing.
- **Strict Typing:** Ensured AlignType is used consistently across the parser and renderer.

### v16.1
- **UI Fix:** Restored the **Line Opacity** slider.
- **Organization:** Grouped all 4 customization sliders (Messiness, Size, Spacing, Opacity) in the UI.

### v16.0
- **Mobile Responsive:** Layout adapts to vertical stack on mobile devices.
- **Text Case Tools:** Added menu to transform text case (Upper/Lower/Title).
- **Branding:** Added custom Shinchan favicon.
- **Fix:** Restored Font Size slider functionality.

### v15.0
- **Letter Spacing:** Added slider to manipulate space between characters.

### v14.0
- **Fonts:** Integrated Google Fonts to replace broken external links.
- **UI:** Improved Font Dropdown UI.

### v12.0 - v13.0
- **Alignment:** Added visual support for Left, Center, and Right alignment.
- **Rendering:** Switched table drawing from `rect` to `line` strokes to fix border overlap.

### v10.0 - v11.0
- **Images:** Added "Select to Delete" functionality (Blue border).
- **Bugfix:** Prevented images from being inserted into the toolbar.
- **Layout:** Fixed editor scrolling issues with large images.

### v8.0 - v9.0
- **Tables:** Added logic for Merging Rows and Columns.
- **Engine:** Rewrote table engine to use a coordinate grid system.

### v6.0 - v7.0
- **Core:** Implemented `DOMPurify` for security.
- **UI:** Added Dark Mode and Sticky Header.

---

## 🔒 Private Repository
This project is maintained privately. Please do not share access tokens or `.lazy` or `.json` files containing sensitive data publicly.
