# Georgia ELA Standards Guide — GitHub Pages Package

## Overview
This package contains a static React application for browsing Georgia ELA standards. It’s designed to be deployed directly to GitHub Pages and requires no backend.

## Features
- Card-based view of standards by strand
- Grade filtering and search
- Cross-grade progression view
- Expandable ALDs, evidence notes, and sample items
- Print-friendly layout
- Data-driven from `/data/ga-ela.json`

## Project Structure
```
/ (root)
├── public/
│   ├── index.html
│   └── data/
│       └── ga-ela.json   # JSON file containing all standards
├── src/
│   ├── App.tsx           # Main React component (GeorgiaELAStandardsGuide)
│   ├── index.tsx         # React entry point
│   └── styles.css        # Tailwind or custom CSS
├── package.json
├── tailwind.config.js    # Tailwind config (optional)
└── README.md             # This file
```

## Adding Data
1. Create `/public/data/ga-ela.json` with an array of standard objects:
```json
[
  {
    "grade": "Grade 5",
    "strand": "Reading Literary",
    "code": "ELAGSE5RL1",
    "description": "Quote accurately from a text…",
    "details": "Emphasis on accurate quoting…",
    "ALD": "Developing: cites general parts…",
    "evidence": "Student responses include…",
    "samples": [
      "EBSR: Choose two quotes…",
      "SR: Which quotation best…"
    ]
  }
]
```

2. Replace the embedded sample `DATA` array in `App.tsx` with:
```ts
const [data, setData] = useState([]);
useEffect(() => {
  fetch('/data/ga-ela.json')
    .then(res => res.json())
    .then(setData);
}, []);
```

## Deployment to GitHub Pages
1. In `package.json`, set the `homepage` field:
```json
"homepage": "https://<your-username>.github.io/<repo-name>"
```
2. Install GitHub Pages deploy script:
```bash
npm install --save gh-pages
```
3. Add deploy scripts:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
4. Deploy:
```bash
npm run deploy
```

Your site will be live at the `homepage` URL.

## Customization
- Edit `STRAND_COLORS` in `App.tsx` to set strand color themes.
- Adjust Tailwind config or CSS for branding.
- Expand functionality with CSV/PDF export.

## License
MIT — free to use and modify.
