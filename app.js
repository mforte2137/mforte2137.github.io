/* =========================================================
   MSP Tools Hub — app.js
   ---------------------------------------------------------
   HOW TO ADD A NEW TOOL
   ---------------------------------------------------------
   1. Copy one of the existing entries in the TOOLS array below.
   2. Update the fields:
        title       -> Full name shown on the card
        shortLabel  -> Short version shown ON the thumbnail
        description -> 1–3 sentence description
        category    -> A short category tag (e.g. "Proposal", "Conversion")
        url         -> The full https:// link to the tool
        badge       -> "new" | "beta" | "soon" | ""    (leave "" for none)
        updated     -> Date as "YYYY-MM-DD"
        gradient    -> Pick one of the GRADIENTS keys below (e.g. "navy", "blue")
        icon        -> Pick one of the ICONS keys below (e.g. "doc", "calc")
   3. Save the file. The new card will appear automatically.

   The GRADIENTS and ICONS dictionaries are at the bottom of this file
   if you ever want to add a new color or icon to the library.
   ========================================================= */

const TOOLS = [
  {
    title: "Proposal Evaluator",
    shortLabel: "Proposal Evaluator",
    description:
      "Upload an MSP proposal and we'll read it through your buyer's eyes — measuring it against the five questions every proposal must answer: do they understand my situation, why care now, why trust you, what am I getting, and is it worth it?",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/evaluator.html",
    badge: "",
    updated: "2026-04-28",
    gradient: "navy",
    icon: "checklist"
  },
  {
    title: "Proposal Widget Builder",
    shortLabel: "Widget Builder",
    description:
      "Tell us what you're selling and who you're selling it to. We'll generate five buyer-journey widgets — ready to paste straight into Salesbuildr.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/sales.html",
    badge: "new",
    updated: "2026-04-28",
    gradient: "emerald",
    icon: "idea"
  },
  {
    title: "Document Converter",
    shortLabel: "Document Converter",
    description:
      "Convert PDF, Word and Excel documents to TinyMCE-ready inline HTML so you can paste the content directly into your Salesbuildr widget.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/tinymce.html",
    badge: "",
    updated: "2026-04-28",
    gradient: "blue",
    icon: "doc"
  },
  {
    title: "Special Bid Converter",
    shortLabel: "Bid Converter",
    description:
      "Upload a vendor deal-reg file (xlsx / xls / csv) and convert it into a Salesbuildr import-ready format in seconds.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/converter.html",
    badge: "",
    updated: "2026-04-28",
    gradient: "teal",
    icon: "swap"
  },
  {
    title: "Project Tasks → Calculator",
    shortLabel: "Project Calculator",
    description:
      "Build a list of tasks for complex projects, then generate a clean table of effort hours ready to paste into a Salesbuildr Quote Widget.",
    category: "Scoping",
    url: "https://widgetcreator.netlify.app/project.html",
    badge: "",
    updated: "2026-04-28",
    gradient: "purple",
    icon: "calc"
  }
];

/* =========================================================
   Rendering — you generally don't need to edit below this line
   ========================================================= */

const grid       = document.getElementById("tools-grid");
const search     = document.getElementById("search");
const countEl    = document.getElementById("result-count");
const noResults  = document.getElementById("no-results");
const yearEl     = document.getElementById("year");

if (yearEl) yearEl.textContent = new Date().getFullYear();

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function buildCard(tool) {
  const grad = GRADIENTS[tool.gradient] || GRADIENTS.navy;
  const iconSvg = ICONS[tool.icon] || ICONS.doc;
  const badgeHtml = tool.badge
    ? `<span class="badge ${escapeHtml(tool.badge)}">${escapeHtml(tool.badge)}</span>`
    : "";
  const updated = formatDate(tool.updated);

  return `
    <a class="tool-card" href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer"
       aria-label="Open ${escapeHtml(tool.title)} (opens in a new tab)">
      <div class="thumb" style="--card-grad: ${grad};">
        ${badgeHtml}
        <div class="thumb-icon">${iconSvg}</div>
        <div class="thumb-label">${escapeHtml(tool.shortLabel || tool.title)}</div>
      </div>
      <div class="card-body">
        <span class="card-tag">${escapeHtml(tool.category)}</span>
        <h3 class="card-title">${escapeHtml(tool.title)}</h3>
        <p class="card-desc">${escapeHtml(tool.description)}</p>
      </div>
      <div class="card-foot">
        <span class="card-meta">${updated ? "Updated " + updated : ""}</span>
        <span class="open-link">
          Open tool
          <svg class="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="13 5 20 12 13 19"></polyline>
          </svg>
        </span>
      </div>
    </a>
  `;
}

function render(list) {
  grid.innerHTML = list.map(buildCard).join("");
  countEl.textContent = list.length === TOOLS.length
    ? `${list.length} tool${list.length === 1 ? "" : "s"}`
    : `${list.length} of ${TOOLS.length} tool${TOOLS.length === 1 ? "" : "s"}`;
  noResults.hidden = list.length !== 0;
}

function applyFilter() {
  const q = (search.value || "").trim().toLowerCase();
  if (!q) { render(TOOLS); return; }
  const filtered = TOOLS.filter(t => {
    const haystack = [
      t.title, t.shortLabel, t.description, t.category, t.badge
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
  render(filtered);
}

if (search) search.addEventListener("input", applyFilter);

/* =========================================================
   GRADIENT LIBRARY
   Add a new gradient by giving it a key + a CSS background value.
   ========================================================= */
const GRADIENTS = {
  navy:    "linear-gradient(135deg, #0f1f3d 0%, #1f3a8a 60%, #2563eb 100%)",
  blue:    "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #38bdf8 100%)",
  teal:    "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #5eead4 100%)",
  purple:  "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #a78bfa 100%)",
  amber:   "linear-gradient(135deg, #92400e 0%, #f59e0b 55%, #fcd34d 100%)",
  rose:    "linear-gradient(135deg, #9f1239 0%, #e11d48 55%, #fb7185 100%)",
  emerald: "linear-gradient(135deg, #065f46 0%, #10b981 55%, #6ee7b7 100%)",
  slate:   "linear-gradient(135deg, #1e293b 0%, #475569 55%, #94a3b8 100%)"
};

/* =========================================================
   ICON LIBRARY
   Each icon is an SVG. Strokes, no fills, so they tint nicely
   over a gradient background.
   ========================================================= */
const ICONS = {
  // Document / page
  doc: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 6h26l12 12v40a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/>
      <path d="M40 6v12h12"/>
      <line x1="18" y1="28" x2="46" y2="28"/>
      <line x1="18" y1="36" x2="46" y2="36"/>
      <line x1="18" y1="44" x2="38" y2="44"/>
    </svg>`,
  // Checklist (proposal evaluator)
  checklist: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="44" height="48" rx="4"/>
      <polyline points="18 22 22 26 30 18"/>
      <line x1="36" y1="22" x2="48" y2="22"/>
      <polyline points="18 38 22 42 30 34"/>
      <line x1="36" y1="38" x2="48" y2="38"/>
    </svg>`,
  // Two arrows swap (conversion)
  swap: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <polyline points="14 18 14 26 50 26"/>
      <polyline points="42 14 50 26 42 38"/>
      <polyline points="50 46 50 38 14 38"/>
      <polyline points="22 50 14 38 22 26"/>
    </svg>`,
  // Calculator
  calc: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="6" width="36" height="52" rx="4"/>
      <rect x="20" y="12" width="24" height="10" rx="2"/>
      <circle cx="22" cy="32" r="2"/>
      <circle cx="32" cy="32" r="2"/>
      <circle cx="42" cy="32" r="2"/>
      <circle cx="22" cy="42" r="2"/>
      <circle cx="32" cy="42" r="2"/>
      <circle cx="42" cy="42" r="2"/>
      <circle cx="22" cy="52" r="2"/>
      <circle cx="32" cy="52" r="2"/>
      <circle cx="42" cy="52" r="2"/>
    </svg>`,
  // Magnifying glass
  search: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="16"/>
      <line x1="40" y1="40" x2="54" y2="54"/>
    </svg>`,
  // Lightbulb
  idea: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 42c-4-3-7-8-7-14a17 17 0 1 1 34 0c0 6-3 11-7 14v6H22z"/>
      <line x1="24" y1="54" x2="40" y2="54"/>
      <line x1="26" y1="60" x2="38" y2="60"/>
    </svg>`,
  // Bar chart / report
  chart: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="54" x2="58" y2="54"/>
      <rect x="16" y="36" width="8" height="18"/>
      <rect x="30" y="24" width="8" height="30"/>
      <rect x="44" y="14" width="8" height="40"/>
    </svg>`,
  // Cloud upload
  upload: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 42a10 10 0 0 0-6-19 14 14 0 0 0-27 4 9 9 0 0 0-3 17"/>
      <polyline points="26 32 32 26 38 32"/>
      <line x1="32" y1="26" x2="32" y2="48"/>
    </svg>`
};

/* Initial render — runs after GRADIENTS and ICONS are defined */
render(TOOLS);
