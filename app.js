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
    title: "MSP Matrix Widgets",
    shortLabel: "Matrix Widgets",
    description:
      "Use a template, or have AI create a matrix for any products or services.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/matrix-creator.html",
    badge: "new",
    updated: "2026-06-12",
    gradient: "coral",
    icon: "calc"
  },
  {
    title: "Case Study Widget Builder",
    shortLabel: "Case Study Builder",
    description:
      "Turn a customer win into a persuasive proposal widget in minutes. Describe the challenge, solution, and outcome — AI writes the case study. Use the client\'s name or anonymise it automatically.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/case-study-widget.html",
    badge: "new",
    updated: "2026-06-27",
    gradient: "ruby",
    icon: "checklist"
  },
  {
    title: "Technology Roadmap Builder",
    shortLabel: "Roadmap Builder",
    description:
      "Build a 12–24 month technology roadmap in minutes using guided dropdowns and preselects. AI generates four executive-facing widgets — current state, phased roadmap, business outcomes, and investment summary — ready to push into any Salesbuildr quote.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/technology-roadmap.html",
    badge: "new",
    updated: "2026-06-27",
    gradient: "dusk",
    icon: "compass"
  },
  {
    title: "Renewal Proposal Widget Creator",
    shortLabel: "Renewal Pack",
    description:
      "Paste in a renewal quote URL and the tool reads the services, generates up to seven targeted proposal widgets, and pushes them to your Salesbuildr library. Standard or At-Risk mode depending on the client situation.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/renewal-pack.html",
    badge: "new",
    updated: "2026-06-27",
    gradient: "pine",
    icon: "doc"
  },
  {
    title: "Industry Proposal Pack",
    shortLabel: "Industry Pack",
    description:
      "Select your prospect's industry and AI generates five coordinated, vertical-specific widgets — pain points, compliance, approach, and more — that make your proposal feel written for their world.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/industry-proposal-pack.html",
    badge: "new",
    updated: "2026-06-27",
    gradient: "ocean",
    icon: "idea"
  },
  {
    title: "Upsell Services Widget Builder",
    shortLabel: "Upsell Builder",
    description:
      "Turn any proposal into a revenue roadmap. Describe your engagement and AI generates a curated list of complementary services — tag them, reorder them, brand them, and drop the widget straight into your quote.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/complementary-services.html",
    badge: "new",
    updated: "2026-06-27",
    gradient: "lime",
    icon: "chart"
  },
  {
    title: "Customer Growth Operating System",
    shortLabel: "Growth OS",
    description:
      "The opportunity isn't the product — it's the change. Change creates conversations. Conversations create opportunities.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/cgos.html",
    badge: "new",
    updated: "2026-06-07",
    gradient: "gold",
    icon: "compass"
  },
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
    badge: "",
    updated: "2026-04-28",
    gradient: "emerald",
    icon: "idea"
  },
  {
    title: "Guided Sales Tool",
    shortLabel: "Guided Sales Tool",
    description:
      "Start with the customer's problem — not your product catalog. The Sales Guide helps you build a buyer-focused proposal that moves a business owner to yes.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/sales-guide.html",
    badge: "new",
    updated: "2026-05-08",
    gradient: "sunset",
    icon: "compass"
  },
  {
    title: "SOW Widget Generator",
    shortLabel: "SOW Generator",
    description:
      "Generate polished, customer-facing Statements of Work from pre-built project presets or let AI write one from scratch — for any project type, ready to drop into Salesbuildr.",
    category: "Scoping",
    url: "https://widgetcreator.netlify.app/sow-generator.html",
    badge: "new",
    updated: "2026-05-24",
    gradient: "teal",
    icon: "checklist"
  },
  {
    title: "ROI Builder",
    shortLabel: "ROI Builder",
    description:
      "Turn your proposal into a financial argument. Enter a few numbers — we calculate the ROI and generate a customer-facing widget ready to drop into any Salesbuildr quote.",
    category: "Proposal",
    url: "https://widgetcreator.netlify.app/roi-builder.html",
    badge: "",
    updated: "2026-05-01",
    gradient: "slate",
    icon: "chart"
  },
  {
    title: "Cover Page Creator",
    shortLabel: "Cover Page Creator",
    description:
      "Enter your prospect's details and we'll generate a branded cover page in their colours — ready to drop into a Salesbuildr demo quote in seconds.",
    category: "Design",
    url: "https://widgetcreator.netlify.app/first-impression.html",
    badge: "",
    updated: "2026-05-01",
    gradient: "rose",
    icon: "palette"
  },
  {
    title: "Widget Banner Tool",
    shortLabel: "Banner Tool",
    description:
      "Create eye-catching widget banners using your own logos or custom text overlays — no design skills needed. Export straight into Salesbuildr widgets.",
    category: "Design",
    url: "https://widgetcreator.netlify.app/banner.html",
    badge: "new",
    updated: "2026-05-24",
    gradient: "amber",
    icon: "palette"
  },
  {
    title: "Product Catalog — Guided Cleanup",
    shortLabel: "Catalog Cleanup",
    description:
      "AI-assisted guided cleanup for your product catalog. Fix duplicate MPNs, bulk unlist EOL or missing products, and keep your catalog sharp and accurate.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/product-cleanup.html",
    badge: "new",
    updated: "2026-06-04",
    gradient: "indigo",
    icon: "search"
  },
  {
    title: "MSP Quote Preflight",
    shortLabel: "Quote Preflight",
    description:
      "Preflight reviews your quote for issues that could cause problems — before the buyer sees it. Spot the gaps, fix them early, send with confidence.",
    category: "Quote",
    url: "https://widgetcreator.netlify.app/preflight.html",
    badge: "",
    updated: "2026-05-01",
    gradient: "violet",
    icon: "search"
  },
  {
    title: "MSP Document to Widget",
    shortLabel: "Doc to Widget",
    description:
      "Have an existing Word doc scope? Convert it instantly into a clean, customer-facing Salesbuildr widget — no reformatting needed.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/doc-to-widget.html",
    badge: "new",
    updated: "2026-06-12",
    gradient: "sky",
    icon: "swap"
  },
  {
    title: "Widget Library Cleanup",
    shortLabel: "Widget Cleanup",
    description:
      "Fetches your full widget library and uses AI to group duplicates, near-duplicates, and suspicious names for review — keeping your library clean and manageable.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/widget-cleaner.html",
    badge: "new",
    updated: "2026-06-16",
    gradient: "mint",
    icon: "search"
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
    title: "Import Special Pricing",
    shortLabel: "Special Pricing",
    description:
      "Upload a vendor deal-reg file (xlsx / xls / csv) and convert it into a Salesbuildr import-ready format in seconds.",
    category: "Conversion",
    url: "https://widgetcreator.netlify.app/converter.html",
    badge: "",
    updated: "2026-04-28",
    gradient: "cyan",
    icon: "swap"
  },
  {
    title: "Project Reports",
    shortLabel: "Project Reports",
    description:
      "Keep your clients informed of project status with executive-style PDF reports — written in plain, non-technical language they'll actually read.",
    category: "Scoping",
    url: "https://widgetcreator.netlify.app/progress.html",
    badge: "new",
    updated: "2026-05-28",
    gradient: "forest",
    icon: "chart"
  },
  {
    title: "MSP Security Assessment Tool",
    shortLabel: "Security Assessment",
    description:
      "Generate proposal widgets for all major security framework assessments. Includes technician checklists and tools to build current and ideal state matrices — all ready to drop into Salesbuildr.",
    category: "Security",
    url: "https://widgetcreator.netlify.app/security.html",
    badge: "new",
    updated: "2026-05-31",
    gradient: "crimson",
    icon: "checklist"
  },
  {
    title: "Project Tasks → Calculator",
    shortLabel: "Project Calculator",
    description:
      "Build a list of tasks for complex projects, then generate a clean table of effort hours ready to paste into a Salesbuildr Quote Widget.",
    category: "Scoping",
    url: "https://widgetcreator.netlify.app/project-scope.html",
    badge: "",
    updated: "2026-05-01",
    gradient: "purple",
    icon: "calc"
  }
];

/* =========================================================
   Rendering — you generally don't need to edit below this line
   ========================================================= */

const grid      = document.getElementById("tools-grid");
const searchEl  = document.getElementById("search");
const clearEl   = document.getElementById("search-clear");
const countEl   = document.getElementById("result-count");
const noResults = document.getElementById("no-results");
const tabsEl    = document.getElementById("tabs");
const yearEl    = document.getElementById("year");

if (yearEl) yearEl.textContent = new Date().getFullYear();

let activeCategory = "All";

/* Derive ordered category list */
const CATEGORIES = ["All", ...Array.from(new Set(TOOLS.map(t => t.category)))];

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* Icon SVG lookup — returns inline SVG string */
function getIconSvg(key) {
  return ICONS[key] || ICONS.doc;
}

function buildCard(tool) {
  const iconSvg  = getIconSvg(tool.icon);
  const iconCls  = "icon-" + (tool.gradient || "navy");
  const badgeCls = tool.badge ? "card-badge badge-" + tool.badge : "card-badge badge-empty";
  const badgeTxt = tool.badge || "·";
  const toolIdx  = TOOLS.indexOf(tool);

  return `
    <div class="tool-card-wrap">
      <a class="tool-card" href="${escapeHtml(tool.url)}" target="_blank" rel="noopener noreferrer"
         aria-label="Open ${escapeHtml(tool.title)} (opens in a new tab)">
        <div class="card-body">
          <div class="card-top">
            <div class="card-icon ${iconCls}">${iconSvg}</div>
            <span class="${badgeCls}">${escapeHtml(badgeTxt)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(tool.title)}</h3>
          <p class="card-desc">${escapeHtml(tool.description)}</p>
        </div>
        <div class="card-foot">
          <span class="card-tag">${escapeHtml(tool.category)}</span>
          <button class="card-info-btn" data-tool-index="${toolIdx}" aria-label="What does ${escapeHtml(tool.title)} do?">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" stroke-width="3"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
            What does this do?
          </button>
          <span class="open-link">
            Open
            <svg class="arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="13 5 20 12 13 19"/>
            </svg>
          </span>
        </div>
      </a>
    </div>
  `;
}

function getFiltered() {
  const q = (searchEl.value || "").trim().toLowerCase();
  return TOOLS.filter(t => {
    const catMatch = activeCategory === "All" || t.category === activeCategory;
    if (!catMatch) return false;
    if (!q) return true;
    return [t.title, t.shortLabel, t.description, t.category, t.badge]
      .join(" ").toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  grid.innerHTML = list.map(buildCard).join("");
  const total = activeCategory === "All" ? TOOLS.length : TOOLS.filter(t => t.category === activeCategory).length;
  countEl.textContent = list.length === total
    ? `${list.length} tool${list.length === 1 ? "" : "s"}`
    : `${list.length} of ${total} tool${total === 1 ? "" : "s"}`;
  noResults.hidden = list.length !== 0;
}

/* Build tabs */
function buildTabs() {
  tabsEl.innerHTML = CATEGORIES.map(cat => {
    const count = cat === "All" ? TOOLS.length : TOOLS.filter(t => t.category === cat).length;
    return `
      <button class="tab-btn${cat === activeCategory ? " active" : ""}" data-cat="${escapeHtml(cat)}"
              role="tab" aria-selected="${cat === activeCategory}">
        ${escapeHtml(cat)}<span class="tab-count">${count}</span>
      </button>`;
  }).join("");

  tabsEl.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      tabsEl.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      render();
    });
  });
}

/* Search */
searchEl.addEventListener("input", () => {
  clearEl.hidden = !searchEl.value;
  render();
});

clearEl.addEventListener("click", () => {
  searchEl.value = "";
  clearEl.hidden = true;
  searchEl.focus();
  render();
});
clearEl.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") clearEl.click();
});


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
  slate:   "linear-gradient(135deg, #1e293b 0%, #475569 55%, #94a3b8 100%)",
  sunset:  "linear-gradient(135deg, #be185d 0%, #ec4899 40%, #fb923c 100%)",
  indigo:  "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #818cf8 100%)",
  violet:  "linear-gradient(135deg, #5b21b6 0%, #8b5cf6 55%, #c4b5fd 100%)",
  gold:    "linear-gradient(135deg, #78350f 0%, #d97706 55%, #fbbf24 100%)",
  sky:     "linear-gradient(135deg, #0c4a6e 0%, #0284c7 55%, #7dd3fc 100%)",
  coral:   "linear-gradient(135deg, #7c2d12 0%, #ea580c 55%, #fdba74 100%)",
  lime:    "linear-gradient(135deg, #1a4731 0%, #16a34a 55%, #86efac 100%)",
  ruby:    "linear-gradient(135deg, #881337 0%, #e11d48 55%, #fb7185 100%)",
  ocean:   "linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #38bdf8 100%)",
  pine:    "linear-gradient(135deg, #052e16 0%, #15803d 55%, #4ade80 100%)",
  dusk:    "linear-gradient(135deg, #2e1065 0%, #6d28d9 55%, #a78bfa 100%)",
  mint:    "linear-gradient(135deg, #022c22 0%, #059669 55%, #6ee7b7 100%)",
  cyan:    "linear-gradient(135deg, #164e63 0%, #0891b2 55%, #67e8f9 100%)",
  forest:  "linear-gradient(135deg, #14532d 0%, #16a34a 55%, #86efac 100%)",
  crimson: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 55%, #f87171 100%)"
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
    </svg>`,
  // Artist's palette (design / branding)
  palette: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 6C18 6 6 17 6 31c0 12 9 21 19 21 4 0 5-3 5-6 0-4 3-6 7-6h7c8 0 14-5 14-13C58 16 46 6 32 6z"/>
      <circle cx="20" cy="22" r="3"/>
      <circle cx="32" cy="16" r="3"/>
      <circle cx="44" cy="22" r="3"/>
      <circle cx="48" cy="34" r="3"/>
    </svg>`,
  // Compass (guidance / direction)
  compass: `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="24"/>
      <polygon points="32,14 38,32 32,50 26,32"/>
      <circle cx="32" cy="32" r="2"/>
    </svg>`
};

/* Initial render — runs after GRADIENTS and ICONS are defined */
buildTabs();
render();

/* =========================================================
   Feedback panel
   ========================================================= */
(function initFeedback() {
  const trigger  = document.getElementById('feedback-trigger');
  const panel    = document.getElementById('feedback-panel');
  const overlay  = document.getElementById('feedback-overlay');
  const closeBtn = document.getElementById('feedback-close');
  const toolSel  = document.getElementById('fb-tool');
  const chips    = document.querySelectorAll('.fb-chip');
  const message  = document.getElementById('fb-message');
  const nameEl   = document.getElementById('fb-name');
  const emailEl  = document.getElementById('fb-email');
  const submit   = document.getElementById('feedback-submit');
  const status   = document.getElementById('feedback-status');

  /* Populate tool dropdown from TOOLS array */
  TOOLS.slice().sort((a, b) => a.title.localeCompare(b.title)).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.title;
    opt.textContent = t.title;
    toolSel.appendChild(opt);
  });

  /* Open / close */
  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  /* Type chip selection */
  let selectedType = 'Feature Request';
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedType = chip.dataset.value;
    });
  });

  /* Submit */
  submit.addEventListener('click', async () => {
    const msg = message.value.trim();
    if (!msg) {
      showStatus('Please add a message before sending.', 'error');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    status.hidden = true;

    try {
      const res = await fetch('/api/hub-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: toolSel.value,
          type: selectedType,
          message: msg,
          name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          submittedAt: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.ok) {
        showStatus('Feedback sent — thank you!', 'success');
        message.value = '';
        nameEl.value = '';
        emailEl.value = '';
        toolSel.value = '';
        chips.forEach(c => c.classList.remove('active'));
        chips[0].classList.add('active');
        selectedType = 'Feature Request';
      } else {
        showStatus('Something went wrong. Please try again.', 'error');
      }
    } catch {
      showStatus('Could not send feedback. Check your connection.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send Feedback';
    }
  });

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = 'feedback-status ' + type;
    status.hidden = false;
  }
})();

/* =========================================================
   Security modal
   ========================================================= */
(function initSecurity() {
  const trigger = document.getElementById('security-trigger');
  const overlay = document.getElementById('security-overlay');
  const closeBtn = document.getElementById('security-close');

  function openModal() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* =========================================================
   Tool Knowledge Base — used by AI helper
   ========================================================= */
const TOOL_KB = `
TOOL: Proposal Evaluator
WHAT: Reads an uploaded MSP proposal through the buyer's eyes and scores it against five questions: do you understand my situation, why should I care now, why should I trust you, what exactly am I getting, and is it worth the money?
WHO: MSP sales reps or owners who have written a proposal and want an objective read before sending it to a prospect.
INPUT: An existing proposal document — PDF or Word.
OUTPUT: Structured evaluation with scores and specific feedback on each of the five buyer questions.
USE WHEN: You've written a proposal and want a sanity check before it goes out. A deal is important and you want to stress-test the narrative. You want to understand why your win rate is low. Best for managed services and large project proposals.
NOT FOR: Simple hardware quotes. Building a proposal from scratch — use Guided Sales Tool or Proposal Widget Builder first.

TOOL: Proposal Widget Builder
WHAT: Generates five buyer-journey widgets for a Salesbuildr quote based on what you're selling and who you're selling it to. Widgets can be sent directly to your widget library via the Salesbuildr Public API.
WHO: MSP sales reps building quotes in Salesbuildr who want professional, persuasive content without writing it from scratch.
INPUT: A description of what you're selling and a brief profile of the prospect or their industry.
OUTPUT: Five ready-to-paste Salesbuildr widgets covering the buyer journey — problem, solution, trust, value, and next steps.
USE WHEN: Building a new quote and wanting industry-focused content quickly. Wanting consistent, professional widget copy across your team. Using a proven MSP sales method.
NOT FOR: Reformatting existing content — use Document Converter or MSP Document to Widget instead.

TOOL: Guided Sales Tool
WHAT: Walks you through three structured processes — Discovery (customer describes a problem, tool prepares a quote and tech checklist), Design Desk (upload a parts-list spreadsheet, AI builds the proposal), and Quick Quote (speak or type what you need, AI searches your catalog or the web).
WHO: MSP sales reps or owners who want to build a consultative, problem-first proposal.
INPUT: Customer situation and challenges, or a spreadsheet, or a plain-language description of what you need.
OUTPUT: A structured, buyer-focused proposal narrative ready to turn into a Salesbuildr quote.
USE WHEN: Starting a proposal from scratch. Moving away from product-first selling. Quickly generating a quote from a parts list or verbal description.
NOT FOR: Reviewing an existing draft — use Proposal Evaluator. Populating an existing quote — use Proposal Widget Builder.

TOOL: ROI Builder
WHAT: Takes financial inputs and calculates the return on investment for your proposed solution, then generates a customer-facing widget.
WHO: MSP sales reps who need to justify solution costs to a business owner or CFO in financial terms.
INPUT: A few numbers — current costs, proposed costs, efficiency gains, or risk reduction estimates.
OUTPUT: A calculated ROI summary and an attractive Salesbuildr-ready widget presenting the financial case.
USE WHEN: A prospect is price-sensitive and needs financial justification. You want to make the business case, not just the technical case.
NOT FOR: Building the full proposal narrative — use Guided Sales Tool or Proposal Widget Builder.

TOOL: Cover Page Creator
WHAT: Generates a selection of four branded cover pages for a Salesbuildr quote, personalised with the prospect's details and colours. In auto mode, just provide the website URL.
WHO: MSP sales reps who want a polished, personalised quote cover without an in-house marketing department.
INPUT: The prospect's website URL (auto mode), or company name, contact name, and brand colours/logo.
OUTPUT: Four branded cover pages as high-resolution PNG files ready to add to your Salesbuildr cover page library.
USE WHEN: Sending a formal quote to a new prospect. Wanting to differentiate from competitors with a polished presentation.
NOT FOR: Banner images inside widgets — use Widget Banner Tool. If marketing has already created branded cover pages.

TOOL: MSP Matrix Widgets
WHAT: Creates comparison matrix widgets from pre-built templates or generated by AI. All rows and columns are customisable. Can send directly to Salesbuildr widget library via Public API.
WHO: MSP sales reps who want to visually compare service tiers, product options, or feature sets inside a Salesbuildr quote.
INPUT: A template selection, or a description of what to compare — products, services, tiers, or frameworks.
OUTPUT: A clean HTML comparison matrix ready to drop into a Salesbuildr widget.
USE WHEN: Showing a prospect the difference between service tiers or support levels. Comparing your offering against a competitor or current state.
NOT FOR: Full security framework assessment matrices — use MSP Security Assessment Tool.

TOOL: Customer Growth Operating System (CGOS)
WHAT: A beta tool that helps MSPs identify customer risks, growth opportunities, alignment gaps, and recommended next actions by bringing together data from multiple systems into a single customer intelligence workspace.
WHO: MSP owners, account managers, vCIOs, and sales teams who want a proactive way to manage customer relationships and identify opportunities.
INPUT: Customer information from systems you already use, plus knowledge of the customer's business goals and environment.
OUTPUT: A prioritised view of customer health, opportunities, risks, lifecycle events, and recommended actions.
USE WHEN: Preparing for a QBR, roadmap discussion, or customer review. Identifying opportunities across your customer base. Reviewing customer alignment, licensing, security, or lifecycle gaps.
NOT FOR: Building a proposal for a new prospect — use Guided Sales Tool or Proposal Widget Builder.

TOOL: SOW Widget Generator
WHAT: Generates a clean, professional customer-facing Statement of Work for any project type — from pre-built presets or written from scratch by AI.
WHO: MSP project managers, sales reps, or technical leads who need to produce a clear SOW quickly.
INPUT: A selection from preset project types, or a plain-language description of scope and deliverables.
OUTPUT: A polished, customer-facing SOW ready to drop directly into a Salesbuildr widget.
USE WHEN: Scoping a new project and needing to present the work clearly to the customer. Professionalising project documentation without writing from scratch.
NOT FOR: Calculating effort hours and costs — use Project Tasks → Calculator. Highly detailed SOWs for legal purposes.

TOOL: Project Tasks → Calculator
WHAT: Builds a detailed task list for a complex project and generates a clean effort-hour table ready for a Salesbuildr Quote Widget. Use presets or describe your project to AI. Save projects, create templates, collaborate as a team.
WHO: MSP project managers or pre-sales engineers who need to scope project effort and present it clearly in a quote.
INPUT: Project tasks and estimated hours — use presets or AI generation from a description.
OUTPUT: A formatted, professional, customer-facing effort table with totals, ready to paste into a Salesbuildr Quote Widget.
USE WHEN: Scoping a complex project and needing to itemise and price the work. Wanting a professional labour breakdown in a quote.
NOT FOR: The written scope narrative — use SOW Widget Generator for that. (Both tools complement each other well.)

TOOL: Project Reports
WHAT: Generates executive-style PDF project status reports written in plain, non-technical language — suitable for clients managing complex multi-week projects.
WHO: MSP project managers or account managers who need to keep clients informed of project progress without overwhelming them with technical detail.
INPUT: Current project status, milestones completed, upcoming work, and any issues or risks.
OUTPUT: A clean, professional PDF status report in plain English suitable for sending to a business owner or stakeholder.
USE WHEN: A project is in flight and you need to update the client on progress. Professionalising client communications without spending time formatting documents.
NOT FOR: Scoping or pricing the project — use SOW Widget Generator or Project Tasks → Calculator.

TOOL: MSP Quote Preflight
WHAT: Reviews a quote for common issues — missing information, unclear pricing, weak justification — before the buyer sees it. Requires Salesbuildr Public API connection.
WHO: MSP sales reps who want a final check on a quote before sending it out.
INPUT: A draft quote ID from Salesbuildr (requires Public API) or quote details for review.
OUTPUT: A list of flagged issues with specific suggestions for fixing them, plus an AI evaluation of the proposal itself.
USE WHEN: About to send an important quote and wanting one last review. A deal has stalled and you want to check if the quote is the problem.
NOT FOR: Broader evaluation of proposal narrative — use Proposal Evaluator for that.

TOOL: MSP Security Assessment Tool
WHAT: Generates proposal widgets for major security framework assessments (NIST, CIS, and similar), including technician checklists and current-state vs. ideal-state comparison matrices. Technician site survey (generated by the app) is uploaded to populate the current state of compliance.
WHO: MSP security specialists, vCISOs, or account managers presenting security assessments to clients.
INPUT: The security framework being used and the client's current state information.
OUTPUT: Customer-facing proposal widgets, technician checklists, and current/ideal state matrices — all ready for Salesbuildr.
USE WHEN: Presenting a security assessment or gap analysis to a client. Visualising the gap between current and ideal security state.
NOT FOR: General product/service comparison matrices — use MSP Matrix Widgets.

TOOL: Widget Banner Tool
WHAT: Creates visual banner images for Salesbuildr widgets using logos or custom text overlays — no design skills required.
WHO: MSP sales reps or marketers who want polished, on-brand Salesbuildr widgets without needing a designer.
INPUT: A logo file or text content, plus colour or style preferences.
OUTPUT: A banner image ready to use inside a Salesbuildr widget.
USE WHEN: Adding a professional branded header to a widget. Wanting the visual presentation to match your brand.
NOT FOR: Full quote cover pages — use Cover Page Creator.

TOOL: Document Converter
WHAT: Converts PDF, Word, and Excel documents into TinyMCE-ready inline HTML that can be pasted directly into a Salesbuildr widget.
WHO: MSP sales or admin staff who have existing documents they want to bring into Salesbuildr without manual reformatting.
INPUT: A PDF, Word (.docx), or Excel (.xlsx) file.
OUTPUT: Clean inline HTML ready to paste into the Salesbuildr widget editor.
USE WHEN: You have an existing document — service description, terms sheet, data table — that you want inside a widget. Reusing existing content without rebuilding from scratch.
NOT FOR: Word-format scopes of work — use MSP Document to Widget for a more tailored conversion.

TOOL: MSP Document to Widget
WHAT: Converts an existing Word document scope of work into a clean, customer-facing Salesbuildr widget instantly, with no manual reformatting.
WHO: MSP project managers or sales reps who have a scope written in Word and want it in Salesbuildr quickly.
INPUT: A Word document containing your project scope.
OUTPUT: A formatted, customer-facing Salesbuildr widget based on the document content.
USE WHEN: You've written a scope in Word and want to move it into Salesbuildr without rebuilding it. Migrating existing content into your Salesbuildr quote workflow.
NOT FOR: General PDFs or Excel files — use Document Converter. No scope yet — use SOW Widget Generator.

TOOL: Import Special Pricing
WHAT: Converts vendor deal registration files (xlsx, xls, or csv) into a Salesbuildr import-ready format in seconds.
WHO: MSP purchasing or sales staff who receive deal-reg pricing files from vendors.
INPUT: A vendor deal-reg file in xlsx, xls, or csv format.
OUTPUT: A formatted file ready to import directly into Salesbuildr.
USE WHEN: You've received a special pricing file from a vendor and want to use it in a quote. Converting deal-reg data without manual data entry.
NOT FOR: Cleaning up your existing product catalog — use Product Catalog Guided Cleanup.

TOOL: Product Catalog — Guided Cleanup
WHAT: Connects to your Salesbuildr product catalog and uses AI to identify duplicate MPNs, near-duplicate products, EOL items, and missing products — then guides you through resolving them in bulk.
WHO: MSP administrators or purchasing managers responsible for keeping the Salesbuildr product catalog accurate.
INPUT: Your Salesbuildr API credentials — the tool fetches your catalog directly.
OUTPUT: A guided cleanup workflow with grouped issues and bulk actions to unlist or merge products.
USE WHEN: Your product catalog has grown messy with duplicates or outdated products. Doing a catalog audit before a pricing review or platform migration.
NOT FOR: Importing new special pricing — use Import Special Pricing.

TOOL: Widget Library Cleanup
WHAT: Fetches your full Salesbuildr widget library and uses AI to group duplicates, near-duplicates, and suspiciously named widgets for bulk review and cleanup.
WHO: MSP administrators or sales ops staff who manage the shared widget library in Salesbuildr.
INPUT: Your Salesbuildr API credentials — the tool fetches your widget library directly.
OUTPUT: A grouped review of potential duplicates and problem widgets with actions to remove or consolidate them.
USE WHEN: Your widget library has grown large and hard to navigate. Doing a periodic audit to remove outdated or duplicate widgets.
NOT FOR: Cleaning up your product catalog — use Product Catalog Guided Cleanup.

SECURITY NOTE:
Your data stays with you. Files are read locally in the browser and never transmitted to Salesbuildr servers. Credentials are stored in your browser's localStorage only. AI features send only the text you explicitly submit to Anthropic's API over encrypted HTTPS. There is no backend database, no user accounts, and no server-side file storage. Full details: https://docs.google.com/document/d/1Lm-oxSFqTpyntxvKQQIENLODS8GbqBTmczlD3EVomtA/edit?usp=sharing
`;

/* =========================================================
   AI Helper modal
   ========================================================= */
(function initAiHelper() {
  const trigger      = document.getElementById('ai-trigger');
  const overlay      = document.getElementById('ai-overlay');
  const closeBtn     = document.getElementById('ai-close');
  const questionEl   = document.getElementById('ai-question');
  const submitBtn    = document.getElementById('ai-submit');
  const responseEl   = document.getElementById('ai-response');
  const loadingEl    = document.getElementById('ai-loading');
  const feedbackLink = document.getElementById('ai-feedback-link');

  // Feedback shortcut from AI modal
  feedbackLink.addEventListener('click', () => {
    closeModal();
    document.getElementById('feedback-trigger').click();
  });

  function openModal() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => questionEl.focus(), 100);
  }
  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // Submit on Cmd/Ctrl+Enter
  questionEl.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitBtn.click();
  });

  submitBtn.addEventListener('click', async () => {
    const question = questionEl.value.trim();
    if (!question) return;

    submitBtn.disabled = true;
    responseEl.hidden = true;
    loadingEl.hidden = false;

    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();

      if (data.ok && data.answer) {
        renderResponse(data.answer);
      } else {
        renderError('Something went wrong. Please try again.');
      }
    } catch {
      renderError('Could not reach the AI service. Check your connection.');
    } finally {
      submitBtn.disabled = false;
      loadingEl.hidden = true;
    }
  });

  function simpleMd(text) {
    // Strip markdown formatting for clean display
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[\-\*]\s+/gm, '')   // remove bullet chars
      .replace(/`(.+?)`/g, '$1');
  }

  function renderResponse(text) {
    const blocks = [];
    const lines = text.split('\n');
    let current = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const urlMatch = trimmed.match(/Open:\s*(https?:\/\/\S+)/);
      if (urlMatch) {
        if (current) { current.url = urlMatch[1]; blocks.push(current); current = null; }
        continue;
      }
      if (trimmed.match(/^https?:\/\//)) {
        if (current) { current.url = trimmed; blocks.push(current); current = null; }
        continue;
      }
      // Tool name: short line, no period, not starting with common prose words
      const isProse = /^(If|When|There|You|For|Note|No |Consider|Try|I |The |This |Based)/i.test(trimmed);
      if (!current && !isProse && trimmed.length < 55 && !trimmed.endsWith('.')) {
        current = { name: trimmed, reason: '', url: '' };
        continue;
      }
      if (current && !current.reason) {
        current.reason = trimmed;
        continue;
      }
      // Prose after blocks — no match text
      if (!current && blocks.length === 0) {
        blocks.push({ name: '', reason: trimmed, url: '' });
      }
    }
    if (current) blocks.push(current);

    showResetBtn();

    if (blocks.length === 0 || (blocks.length === 1 && !blocks[0].name)) {
      responseEl.innerHTML = `<div class="ai-no-match">${simpleMd(escapeHtml(text))}</div>`;
    } else {
      responseEl.innerHTML = blocks.map(b => b.name ? `
        <div class="ai-tool-result">
          <div class="ai-tool-name">${escapeHtml(b.name)}</div>
          <div class="ai-tool-reason">${simpleMd(escapeHtml(b.reason))}</div>
          ${b.url ? `<a class="ai-tool-link" href="${escapeHtml(b.url)}" target="_blank" rel="noopener noreferrer">Open tool →</a>` : ''}
        </div>
      ` : `<div class="ai-no-match">${simpleMd(escapeHtml(b.reason))}</div>`).join('');
    }

    responseEl.hidden = false;
  }

  function renderError(msg) {
    responseEl.innerHTML = `<p class="ai-no-match">${escapeHtml(msg)}</p>`;
    showResetBtn();
    responseEl.hidden = false;
  }

  function showResetBtn() {
    if (!document.getElementById('ai-reset-btn')) {
      const btn = document.createElement('button');
      btn.id = 'ai-reset-btn';
      btn.className = 'ai-reset-btn';
      btn.textContent = 'Ask another question';
      btn.addEventListener('click', () => {
        responseEl.hidden = true;
        responseEl.innerHTML = '';
        questionEl.value = '';
        btn.remove();
        questionEl.focus();
      });
      responseEl.parentNode.insertBefore(btn, responseEl);
    }
  }
})();

/* =========================================================
   Tool detail modal
   ========================================================= */
(function initToolDetail() {
  const overlay    = document.getElementById('tool-detail-overlay');
  const closeBtn   = document.getElementById('tool-detail-close');
  const iconEl     = document.getElementById('tool-detail-icon');
  const catEl      = document.getElementById('tool-detail-category');
  const titleEl    = document.getElementById('tool-detail-title');
  const descEl     = document.getElementById('tool-detail-desc');
  const gridEl     = document.getElementById('tool-detail-grid');
  const openLink   = document.getElementById('tool-detail-open');
  const fbBtn      = document.getElementById('tool-detail-feedback');

  // KB lookup — maps tool title to structured detail
  const KB_DETAIL = {
    "Technology Roadmap Builder": {
      who:   "MSP sales reps, account managers, or vCIOs presenting a structured technology roadmap to a prospect or existing customer.",
      input: "Client type (Prospect / Existing Customer), industry, company size, current stack assessment (dropdowns), business goals (chip selection), phased roadmap services (preset library + custom), and optional budget and constraints. Sessions auto-save to localStorage.",
      out:   "Four executive-facing widgets — Where You Are Today, Your Technology Roadmap (phased table), Business Outcomes, and Investment Summary. Push individually or as a pack to Salesbuildr, or copy HTML.",
      when:  "You want to position yourself as a strategic partner rather than a vendor. A prospect or existing customer wants to understand where their technology is going over the next 1–2 years. Preparing for a QBR, roadmap review, or new business proposal.",
      not:   "Not a pricing tool — no specific figures in the output. Quote creation and service line item push are Phase 2. Discovery data is entered manually — no PSA integration."
    },
    "Renewal Proposal Widget Creator": {
      who:   "MSP account managers preparing for a contract renewal — routine or where the client relationship needs to be actively defended.",
      input: "Paste a Salesbuildr renewal quote URL — services are read automatically. Add optional context: support stats, key wins, client concerns (At-Risk mode), and upsell recommendations.",
      out:   "Up to seven renewal widgets — Executive Cover Letter, Value Delivered, IT Partnership Summary, Why Continuity Matters, What\'s Included, What\'s Next, plus one Recommended Addition card per upsell selected. Push individually or as a pack.",
      when:  "A managed services contract is approaching renewal. A client has raised concerns or is evaluating competitors. You want a structured, professional renewal proposal rather than just resending last year\'s quote.",
      not:   "Not a replacement for creating the renewal quote in Salesbuildr first. Not a PSA integration — support stats are entered manually."
    },
    "Industry Proposal Pack": {
      who:   "MSP sales reps pitching to prospects in a specific vertical who want their proposal to speak the buyer\'s language.",
      input: "Select an industry vertical from 12 options, optionally describe your engagement, choose Generic or Personalised merge tag mode, and pick a colour theme.",
      out:   "Five short, coordinated Salesbuildr widgets tailored to the selected vertical — Industry Pain Points, Why IT Matters, Compliance & Risk, Our Approach, and What\'s Included. Push as a pack or individually.",
      when:  "You are pitching to a prospect in healthcare, legal, education, government, manufacturing, or another specific vertical and want the proposal to demonstrate genuine sector knowledge.",
      not:   "Not a substitute for the Proposal Widget Builder — these widgets prove industry knowledge, not the sales narrative. Not suitable for generic or multi-vertical prospects."
    },
    "Case Study Widget Builder": {
      who:   "MSP sales reps or owners who want to include social proof in proposals without the pain of writing case studies from scratch.",
      input: "Industry, company size, the challenge, what you did, the outcome, engagement type, and an optional client quote. Toggle between using the real company name or anonymising automatically. Choose a colour theme.",
      out:   "A polished, professionally written case study widget with headline, challenge, solution, and outcome sections — colour-branded, TinyMCE-ready, and exportable directly to Salesbuildr.",
      when:  "You are pitching to a prospect in the same industry as an existing customer win. You want to add credibility and social proof to a proposal without writing it yourself.",
      not:   "Not a review collector or long-form case study document — produces a compact proposal widget only."
    },
    "Upsell Services Widget Builder": {
      who:   "MSPs sending project-type proposals who want to identify and present complementary services for future revenue.",
      input: "Choose a pre-set engagement type or describe a custom project.",
      out:   "A branded, Salesbuildr-ready widget listing AI-generated complementary services — tagged as recommended or optional, reordered to your preference, ready to drop into your proposal.",
      when:  "You are sending a managed services or project proposal and want to open conversations about additional services. You want to present a mini-roadmap that positions you as a strategic partner.",
      not:   "Simple hardware or product-only quotes with no service component."
    },
    "Proposal Evaluator": {
      who:   "MSP sales reps or owners who have written a proposal and want an objective read before sending it to a prospect.",
      input: "An existing proposal document — PDF or Word.",
      out:   "Structured evaluation with scores and specific feedback on each of the five buyer questions.",
      when:  "You've written a proposal and want a sanity check. A deal is important and you want to stress-test the narrative before the meeting.",
      not:   "Simple hardware quotes. Building a proposal from scratch."
    },
    "Proposal Widget Builder": {
      who:   "MSP sales reps building quotes in Salesbuildr who want professional, persuasive content without writing it from scratch.",
      input: "A description of what you're selling and a brief profile of the prospect or their industry.",
      out:   "Five ready-to-paste Salesbuildr widgets — problem, solution, trust, value, and next steps. Can push directly to your widget library via the Public API.",
      when:  "Building a new quote and wanting industry-focused content quickly. Wanting consistent, professional widget copy across your team.",
      not:   "Reformatting existing content — use Document Converter or MSP Document to Widget instead."
    },
    "Guided Sales Tool": {
      who:   "MSP sales reps or owners who want a consultative, problem-first proposal.",
      input: "Customer situation and challenges, or a spreadsheet, or a plain-language description of what you need.",
      out:   "A structured, buyer-focused proposal ready to turn into a Salesbuildr quote.",
      when:  "Starting a proposal from scratch. Moving away from product-first selling. Quickly generating a quote via Discovery, Design Desk, or Quick Quote modes.",
      not:   "Reviewing an existing draft — use Proposal Evaluator. Populating an existing quote — use Proposal Widget Builder."
    },
    "ROI Builder": {
      who:   "MSP sales reps who need to justify solution costs to a business owner or CFO in financial terms.",
      input: "A few numbers — current costs, proposed costs, efficiency gains, or risk reduction estimates.",
      out:   "A calculated ROI summary and an attractive Salesbuildr-ready widget presenting the financial case.",
      when:  "A prospect is price-sensitive and needs financial justification. You want to make the business case, not just the technical case.",
      not:   "Building the full proposal narrative — use Guided Sales Tool or Proposal Widget Builder."
    },
    "Cover Page Creator": {
      who:   "MSP sales reps who want a polished, personalised quote cover without an in-house marketing department.",
      input: "The prospect's website URL (auto mode), or company name, contact name, and brand colours/logo.",
      out:   "Four branded cover pages as high-resolution PNG files ready to add to your Salesbuildr cover page library.",
      when:  "Sending a formal quote to a new prospect. Wanting to differentiate from competitors with a more polished presentation.",
      not:   "Banner images inside widgets — use Widget Banner Tool. If marketing has already created branded cover pages."
    },
    "MSP Matrix Widgets": {
      who:   "MSP sales reps who want to visually compare service tiers, product options, or feature sets inside a Salesbuildr quote.",
      input: "A template selection, or a description of what to compare — products, services, tiers, or frameworks.",
      out:   "A clean HTML comparison matrix ready to drop into a Salesbuildr widget. Can push directly to your widget library via Public API.",
      when:  "Showing a prospect the difference between service tiers or support levels. Comparing your offering against a competitor or current state.",
      not:   "Full security framework assessment matrices — use MSP Security Assessment Tool."
    },
    "Customer Growth Operating System": {
      who:   "MSP owners, account managers, vCIOs, and sales teams who want a proactive way to manage customer relationships.",
      input: "Customer information from systems you already use, plus knowledge of the customer's business goals and environment.",
      out:   "A prioritised view of customer health, opportunities, risks, lifecycle events, and recommended actions.",
      when:  "Preparing for a QBR, roadmap discussion, or customer review. Identifying opportunities across your customer base.",
      not:   "Building a proposal for a new prospect — use Guided Sales Tool or Proposal Widget Builder."
    },
    "SOW Widget Generator": {
      who:   "MSP project managers, sales reps, or technical leads who need to produce a clear SOW quickly.",
      input: "A selection from preset project types, or a plain-language description of scope and deliverables.",
      out:   "A polished, customer-facing SOW ready to drop directly into a Salesbuildr widget.",
      when:  "Scoping a new project and needing to present the work clearly to the customer. Professionalising project documentation without writing from scratch.",
      not:   "Calculating effort hours and costs — use Project Tasks → Calculator. Highly detailed SOWs for legal purposes."
    },
    "Project Tasks → Calculator": {
      who:   "MSP project managers or pre-sales engineers who need to scope project effort and present it clearly in a quote.",
      input: "Project tasks and estimated hours — use presets or AI generation from a description.",
      out:   "A formatted, professional, customer-facing effort table with totals, ready for a Salesbuildr Quote Widget.",
      when:  "Scoping a complex project and needing to itemise and price the work. Wanting a professional labour breakdown in a quote.",
      not:   "The written scope narrative — use SOW Widget Generator for that. Both tools complement each other well."
    },
    "Project Reports": {
      who:   "MSP project managers or account managers who need to keep clients informed without overwhelming them with technical detail.",
      input: "Current project status, milestones completed, upcoming work, and any issues or risks.",
      out:   "A clean, professional PDF status report in plain English suitable for sending to a business owner or stakeholder.",
      when:  "A project is in flight and you need to update the client on progress. Professionalising client communications.",
      not:   "Scoping or pricing the project — use SOW Widget Generator or Project Tasks → Calculator."
    },
    "MSP Quote Preflight": {
      who:   "MSP sales reps who want a final check on a quote before sending it out. Requires Salesbuildr Public API.",
      input: "A draft quote ID from Salesbuildr (requires Public API) or quote details for review.",
      out:   "A list of flagged issues with specific suggestions, plus an AI evaluation of the proposal.",
      when:  "About to send an important quote and wanting one last review. A deal has stalled and you want to check if the quote is the problem.",
      not:   "Broader evaluation of proposal narrative — use Proposal Evaluator."
    },
    "MSP Security Assessment Tool": {
      who:   "MSP security specialists, vCISOs, or account managers presenting security assessments to clients.",
      input: "The security framework being used and the client's current state information.",
      out:   "Customer-facing proposal widgets, technician checklists, and current/ideal state matrices for Salesbuildr.",
      when:  "Presenting a security assessment or gap analysis to a client. Visualising the gap between current and ideal security state.",
      not:   "General product/service comparison matrices — use MSP Matrix Widgets."
    },
    "Widget Banner Tool": {
      who:   "MSP sales reps or marketers who want polished, on-brand Salesbuildr widgets without needing a designer.",
      input: "A logo file or text content, plus colour or style preferences.",
      out:   "A banner image ready to use inside a Salesbuildr widget.",
      when:  "Adding a professional branded header to a widget. Wanting the visual presentation to match your brand.",
      not:   "Full quote cover pages — use Cover Page Creator."
    },
    "Document Converter": {
      who:   "MSP sales or admin staff who have existing documents they want to bring into Salesbuildr without manual reformatting.",
      input: "A PDF, Word (.docx), or Excel (.xlsx) file.",
      out:   "Clean inline HTML ready to paste into the Salesbuildr widget editor.",
      when:  "You have an existing document — service description, terms sheet, data table — that you want inside a widget.",
      not:   "Word-format scopes of work — use MSP Document to Widget for a more tailored conversion."
    },
    "MSP Document to Widget": {
      who:   "MSP project managers or sales reps who have a scope written in Word and want it in Salesbuildr quickly.",
      input: "A Word document containing your project scope.",
      out:   "A formatted, customer-facing Salesbuildr widget based on the document content.",
      when:  "You've written a scope in Word and want to move it into Salesbuildr without rebuilding it.",
      not:   "General PDFs or Excel files — use Document Converter. No scope yet — use SOW Widget Generator."
    },
    "Import Special Pricing": {
      who:   "MSP purchasing or sales staff who receive deal-reg pricing files from vendors.",
      input: "A vendor deal-reg file in xlsx, xls, or csv format.",
      out:   "A formatted file ready to import directly into Salesbuildr.",
      when:  "You've received a special pricing file from a vendor and want to use it in a quote.",
      not:   "Cleaning up your existing product catalog — use Product Catalog Guided Cleanup."
    },
    "Product Catalog — Guided Cleanup": {
      who:   "MSP administrators or purchasing managers responsible for keeping the Salesbuildr product catalog accurate.",
      input: "Your Salesbuildr API credentials — the tool fetches your catalog directly.",
      out:   "A guided cleanup workflow with grouped issues and bulk actions to unlist or merge products.",
      when:  "Your product catalog has grown messy with duplicates or outdated products. Doing a catalog audit.",
      not:   "Importing new special pricing — use Import Special Pricing."
    },
    "Widget Library Cleanup": {
      who:   "MSP administrators or sales ops staff who manage the shared widget library in Salesbuildr.",
      input: "Your Salesbuildr API credentials — the tool fetches your widget library directly.",
      out:   "A grouped review of potential duplicates and problem widgets with actions to remove or consolidate them.",
      when:  "Your widget library has grown large and hard to navigate. Doing a periodic audit.",
      not:   "Cleaning up your product catalog — use Product Catalog Guided Cleanup."
    }
  };

  function openDetail(tool) {
    const detail = KB_DETAIL[tool.title] || {};
    const iconCls = "card-icon icon-" + (tool.gradient || "navy");
    const iconSvg = getIconSvg(tool.icon);

    iconEl.className = iconCls;
    iconEl.innerHTML = iconSvg;
    catEl.textContent = tool.category;
    titleEl.textContent = tool.title;
    descEl.textContent = tool.description;
    openLink.href = tool.url;

    const rows = [
      { label: "Who it's for",       value: detail.who },
      { label: "What you bring",     value: detail.input },
      { label: "What you get out",   value: detail.out },
      { label: "Best used when",     value: detail.when },
      { label: "Not this tool if…",  value: detail.not }
    ].filter(r => r.value);

    gridEl.innerHTML = rows.map(r => `
      <div class="tool-detail-row">
        <div class="tool-detail-row-label">${escapeHtml(r.label)}</div>
        <div class="tool-detail-row-value">${escapeHtml(r.value)}</div>
      </div>
    `).join('');

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Event delegation — info buttons are rendered dynamically
  document.getElementById('tools-grid').addEventListener('click', e => {
    const btn = e.target.closest('.card-info-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const idx = parseInt(btn.dataset.toolIndex, 10);
    if (!isNaN(idx) && TOOLS[idx]) openDetail(TOOLS[idx]);
  });

  closeBtn.addEventListener('click', closeDetail);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeDetail(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeDetail();
  });

  // Feedback shortcut from detail modal
  fbBtn.addEventListener('click', () => {
    closeDetail();
    document.getElementById('feedback-trigger').click();
  });
})();
