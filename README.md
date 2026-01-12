# 😴 LazyScript

> **Private Tool: Turn typed text into realistic handwritten assignments.**

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7)
![Status](https://img.shields.io/badge/Status-Private-red)

## 🌟 Overview
**LazyScript** is a custom tool built to convert digital text into realistic handwritten documents. It supports complex formatting like tables, images, and text alignment, rendering everything onto a canvas that simulates A4 paper.

**[🔴 Live Demo](https://lazyscript.netlify.app)**

---

## ✨ Features

### 🎨 Customization
- **Realistic Handwriting:** 6+ unique handwriting styles (Messy, Cursive, Neat, etc.).
- **Humanization:** - **Messiness:** Randomizes vertical position and rotation.
  - **Letter Spacing:** Adjustable gaps between characters.
  - **Font Size:** Scalable text.
  - **Ink Opacity:** Simulates ballpoint pen pressure.
- **Paper Styles:** Lined, Grid (Math), or Blank.

### 📝 Rich Editor
- **Formatting:** Bold, Underline, Bullet Points, Numbered Lists.
- **Text Case Tools:** Convert selection to UPPERCASE, lowercase, or Title Case.
- **Alignment:** Left, Center, and Right alignment support.

### 📊 Advanced Tables & Images
- **Table Engine:** Add/Delete Rows and Columns.
- **Merge Support:** Merge cells horizontally (Colspan) or vertically (Rowspan).
- **Images:** Drag & drop or upload. Includes "Select to Delete" functionality.

### 💾 Save & Export
- **PDF Export:** High-resolution A4 output.
- **Project Files:** Save/Load `.lazy` files (with DOMPurify security).

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
   git clone [https://github.com/mr-vabs/lazyscript.git](https://github.com/mr-vabs/lazyscript.git)
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

## 🚀 Deployment (Netlify)

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

### v16.1 (Current)
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
