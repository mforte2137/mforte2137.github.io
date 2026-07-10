/* =====================================================
   product-explainer.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── State ──────────────────────────────────
  // Style + theme are intentionally module-level (not reset by
  // Clear) so the MSP doesn't have to re-pick them for every line
  // item in a batch quoting session.
  let selectedStyle   = 'layered';   // 'layered' | 'numbered' | 'grid'
  let currentThemeHex = '#0f1f3d';
  let currentData     = null;        // unified AI response: { category, headline, intro, points[4], footerText, footerBadge }
  let currentHtml     = '';          // last rendered widget HTML (synced from live edits)
  let currentTitle    = '';          // last widget title
  let lastRequest     = null;        // { name, category, context, style } for regenerate

  const sessionWidgets = [];         // [{ title, html }] — "Generated this session"

  // ── DOM refs ───────────────────────────────
  const $ = id => document.getElementById(id);

  const productNameEl    = $('productName');
  const categoryEl       = $('category');
  const categorySuggest  = $('categorySuggestNote');
  const customContextEl  = $('customContext');
  const contextCharCount = $('contextCharCount');

  const stylePicker    = $('stylePicker');
  const colourSwatches = $('colourSwatches');
  const customHexEl    = $('customHex');
  const hexPreviewEl   = $('hexPreview');

  const clearBtn    = $('clearBtn');
  const generateBtn = $('generateBtn');
  const formError   = $('formError');

  const emptyState    = $('emptyState');
  const loadingState  = $('loadingState');
  const widgetOutput  = $('widgetOutput');
  const widgetTitleEl = $('widgetTitle');
  const widgetPreview = $('widgetPreview');
  const imageSlugNote = $('imageSlugNote');

  const regenerateBtn = $('regenerateBtn');
  const copyBtn       = $('copyBtn');
  const pushBtn       = $('pushBtn');

  const credsInline    = $('credsInline');
  const sbApiKeyEl     = $('sbApiKey');
  const sbTenantUrlEl  = $('sbTenantUrl');
  const cancelCredsBtn = $('cancelCredsBtn');
  const saveAndPushBtn = $('saveAndPushBtn');
  const pushFeedback   = $('pushFeedback');

  const sessionListBlock = $('sessionListBlock');
  const sessionList       = $('sessionList');

  // ── Category auto-suggest (client-side keyword map) ──
  const CATEGORY_KEYWORDS = [
    { category: 'Hardware',         words: ['meraki', 'dell', 'laptop', 'switch', 'server', 'firewall', 'ups', 'phone', 'yealink', 'router', 'access point', 'nas'] },
    { category: 'Software',         words: ['microsoft 365', 'm365', 'office', 'antivirus', 'rmm', 'veeam', 'acronis', 'windows', 'license', 'licence'] },
    { category: 'Security Service', words: ['edr', 'phishing', 'dark web', 'soc', 'sentinelone', 'huntress', 'mfa', 'security awareness', 'penetration test', 'siem'] },
    { category: 'Cloud Service',    words: ['azure', 'hosted backup', 'daas', 'hosted voip', 'aws', 'cloud migration', 'datto'] },
    { category: 'Support Service',  words: ['helpdesk', 'managed it', 'on-site', 'vcio', 'support plan', 'managed services'] },
    { category: 'Connectivity',     words: ['fibre', 'fiber', 'sd-wan', 'sdwan', '4g failover', 'vpn', 'broadband', 'leased line'] },
    { category: 'Compliance',       words: ['cyber essentials', 'hipaa', 'iso 27001', 'gdpr', 'soc 2', 'compliance'] }
  ];

  function suggestCategory(name) {
    const lower = name.toLowerCase();
    for (const entry of CATEGORY_KEYWORDS) {
      if (entry.words.some(w => lower.includes(w))) return entry.category;
    }
    return null;
  }

  productNameEl.addEventListener('input', () => {
    const suggestion = suggestCategory(productNameEl.value);
    if (suggestion && !categoryEl.value) {
      categoryEl.value = suggestion;
      categorySuggest.textContent = `Auto-selected "${suggestion}" based on the product name — change it if that's not right.`;
      categorySuggest.hidden = false;
    } else if (suggestion && categoryEl.dataset.autoset === '1' && categoryEl.value !== suggestion) {
      categoryEl.value = suggestion;
    }
    if (suggestion) categoryEl.dataset.autoset = '1';
  });

  categoryEl.addEventListener('change', () => {
    categoryEl.dataset.autoset = '0';
    categorySuggest.hidden = true;
  });

  // ── Custom context char counter ──────────────
  customContextEl.addEventListener('input', () => {
    contextCharCount.textContent = customContextEl.value.length;
  });

  // ── Style picker — instant re-render, like the colour swatches ──
  stylePicker.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      stylePicker.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedStyle = card.dataset.style;
      if (currentData) renderPreview();
    });
  });
  // Default selection
  stylePicker.querySelector('[data-style="layered"]').classList.add('active');

  // ── Colour theme — instant re-render ─────────
  colourSwatches.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentThemeHex = swatch.dataset.hex;
      customHexEl.value = '';
      hexPreviewEl.style.background = 'transparent';
      if (currentData) renderPreview();
    });
  });

  customHexEl.addEventListener('input', () => {
    const val = customHexEl.value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      currentThemeHex = '#' + val;
      hexPreviewEl.style.background = currentThemeHex;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      if (currentData) renderPreview();
    }
  });

  // ── Colour helpers ───────────────────────────
  function shadeHex(hex, percent) {
    // percent negative = darker, positive = lighter
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + Math.round(255 * percent);
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
    let b = (num & 0x0000FF) + Math.round(255 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Product image (Phase 2 — fuzzy brand/model matching) ──
  // Checks /images/portfolio/ first (new convention: brand-model.png,
  // e.g. "dell-5450.png"), then falls back to the legacy /images/store/
  // library for backward compatibility with images already there.
  const IMAGE_BASES = [
    'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/portfolio/',
    'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/store/'
  ];

  // Known MSP hardware/software brands — used to split "Dell Latitude
  // 5450" into brand="dell" + model tokens, regardless of which family
  // word (or none) the rep typed.
  const KNOWN_BRANDS = [
    'dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'microsoft', 'viewsonic',
    'meraki', 'cisco', 'ubiquiti', 'unifi', 'sonicwall', 'fortinet', 'fortigate', 'watchguard', 'aruba',
    'yealink', 'poly', 'polycom', 'grandstream', 'ringcentral',
    'synology', 'qnap', 'netgear', 'tp-link',
    'apc', 'eaton', 'tripplite',
    'datto', 'veeam', 'acronis', 'sentinelone', 'huntress', 'crowdstrike', 'sophos', 'bitdefender'
  ];

  // Same company, different name reps use interchangeably — canonicalise
  // to one form so both variants produce the same candidate slug.
  // Ubiquiti is the company; UniFi is the product line. Fortinet is the
  // company; FortiGate is the actual firewall product line — reps say
  // "FortiGate 60F" far more often than "Fortinet 60F", so that's the
  // canonical form here (same reasoning as unifi over ubiquiti).
  const BRAND_ALIASES = { 'ubiquiti': 'unifi', 'fortinet': 'fortigate' };

  // Consumer-facing marketing nicknames that map to a real model code —
  // reps repeat whatever Ubiquiti's own marketing calls the product, not
  // just the technical SKU. Ordered most-specific first so e.g. "Dream
  // Machine Pro" matches its own rule before the bare "Dream Machine"
  // rule can eat it.
  const MODEL_NICKNAMES = [
    [/dream\s*machine\s*pro/g, 'udm pro'],
    [/dream\s*machine\s*se/g,  'udm se'],
    [/dream\s*machine/g,       'udm'],
    [/dream\s*router/g,        'udr'],
    [/dream\s*wall/g,          'udw']
  ];

  function applyModelNicknames(raw) {
    return MODEL_NICKNAMES.reduce((s, [pattern, replacement]) => s.replace(pattern, replacement), raw);
  }

  // Family/line/category filler words to ignore when isolating the model
  // code — these are exactly the words reps are inconsistent about
  // typing ("Latitude" vs "Lat" vs nothing).
  const SLUG_STOPWORDS = [
    'latitude', 'lat', 'optiplex', 'elitebook', 'probook', 'thinkpad', 'inspiron', 'precision',
    'laptop', 'notebook', 'desktop', 'tower', 'workstation',
    'monitor', 'display', 'firewall', 'switch', 'router', 'access', 'point', 'ap', 'gateway',
    'docking', 'dock', 'station', 'series', 'business', 'premium', 'wireless',
    'phone', 'headset', 'server', 'appliance', 'port', 'ports', 'inch', 'inches', 'screen', 'screens',
    'usb-c', 'usb', 'universal'
  ];

  function toSlug(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Strips a single letter-suffix GLUED directly to a trailing digit
  // (no hyphen) — e.g. "24p" -> "24", "mx68w" -> "mx68". These compact
  // codes (PoE tier P/FP/LP, wireless W, cellular C) are almost always
  // invisible in a product photo, so falling back to the base shot is
  // usually right. Hyphenated named variants ("u6-pro", "udm-se") are
  // untouched, since the hyphen means it's a real, visually distinct
  // sub-model, not a compact suffix code.
  function stripGluedSuffix(token) {
    return token.replace(/([0-9])[a-z]+$/i, '$1');
  }

  // UniFi access points that are NOT the round "puck" shape — explicit
  // exclusion list so these never get force-matched to the puck photo.
  // U6-Mesh is cylindrical; U6-IW/U6-Enterprise-IW are flat in-wall
  // panels; U6-Extender is a small plug-in block; U7-Outdoor/U7-Pro-Wall
  // are different outdoor/wall enclosures.
  const AP_NON_PUCK_SLUGS = [
    'u6-mesh', 'u6-mesh-pro', 'u6-iw', 'u6-enterprise-iw', 'u6-extender',
    'u7-mesh', 'u7-outdoor', 'u7-pro-wall', 'u7-pro-outdoor',
    'uap-ac-m', 'uap-ac-m-pro', 'uap-ac-iw', 'uap-iw-hd'
  ];

  // Recognizes the round-disc "puck" family (U6-*, U7-*, and the legacy
  // AC-Pro/AC-Lite/AC-LR line) so an unphotographed specific model still
  // gets a visually-correct fallback rather than no image (or worse, a
  // wrongly-shaped one). Checked against the already-normalized bare
  // model slug, so it works regardless of hyphen/space phrasing.
  function looksLikePuckAP(bareSlug) {
    if (!bareSlug) return false;
    if (AP_NON_PUCK_SLUGS.some(x => bareSlug === x || bareSlug.startsWith(x + '-'))) return false;
    return /^u[67](-|$)/.test(bareSlug) || /^(uap-)?ac-(pro|lite|lr)(-|$)/.test(bareSlug);
  }

  // Builds ordered candidate slugs, most-specific first:
  //  1. full name, brand canonicalised (handles literal typed names)
  //  2. brand + all non-stopword tokens (keeps suffixes like "pro"/"lr"/
  //     "se" that don't contain digits — needed for UniFi-style codes
  //     where the digit-only rule below would lose the variant)
  //  3. bare model code with brand AND stopwords stripped entirely —
  //     covers products reps rarely prefix with a brand at all (e.g.
  //     "UDM Pro" rather than "Ubiquiti UDM Pro")
  //  4. brand + suffix-stripped model code, and bare suffix-stripped —
  //     only added if stripping actually changed something (e.g. a
  //     PoE/wireless suffix), so "MS120-24P" falls back to "ms120-24"
  //  5. brand + primary numeric token only (loosest fallback)
  //  6. brand only (last resort — a generic brand hero shot)
  function buildImageCandidates(name) {
    const raw = applyModelNicknames(String(name || '').toLowerCase());
    const rawTokens = raw.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

    const canonicalize = t => (KNOWN_BRANDS.includes(t) ? (BRAND_ALIASES[t] || t) : t);

    const brandToken = rawTokens.find(t => KNOWN_BRANDS.includes(t)) || null;
    const brand = brandToken ? canonicalize(brandToken) : null;

    const nonBrandTokens   = rawTokens.filter(t => !KNOWN_BRANDS.includes(t));
    const meaningfulTokens = nonBrandTokens.filter(t => !SLUG_STOPWORDS.includes(t));
    const digitTokens      = meaningfulTokens.filter(t => /\d/.test(t));
    const strippedTokens   = meaningfulTokens.map(stripGluedSuffix);
    const wasStripped      = strippedTokens.join('-') !== meaningfulTokens.join('-');

    const candidates = [];
    candidates.push(toSlug(rawTokens.map(canonicalize).join(' ')));           // 1. full slug, brand-canonicalised
    if (brand && meaningfulTokens.length) {
      candidates.push(toSlug(`${brand}-${meaningfulTokens.join('-')}`));      // 2. brand + full model code (suffixes kept)
    }
    if (meaningfulTokens.length) {
      candidates.push(toSlug(meaningfulTokens.join('-')));                   // 3. bare model code, no brand prefix
    }
    if (wasStripped) {
      if (brand) candidates.push(toSlug(`${brand}-${strippedTokens.join('-')}`)); // 4a. brand + suffix stripped
      candidates.push(toSlug(strippedTokens.join('-')));                          // 4b. bare, suffix stripped
    }
    if (brand && digitTokens.length) {
      candidates.push(toSlug(`${brand}-${digitTokens[0]}`));                 // 5. brand + primary numeric token
    }

    // UniFi's switch line uses the "USW" model prefix, but reps often just
    // say "switch" generically ("Unifi 8 port switch") without ever typing
    // "USW" — and "switch" naturally lands at the END of that sentence, so
    // a simple word substitution would produce "unifi-8-switch" (wrong
    // order) instead of the real "usw-8" convention. Reconstruct it
    // explicitly in canonical order instead. Scoped to unifi/ubiquiti only
    // so Meraki/Cisco's own generic use of "switch" is untouched.
    if (brand === 'unifi' && /\bswitch(es)?\b/.test(raw) && digitTokens.length) {
      candidates.push(toSlug(`usw-${digitTokens.join('-')}`));
      candidates.push(toSlug(`unifi-usw-${digitTokens.join('-')}`));
    }

    // Round "puck" AP fallback — only reached if no specific model photo
    // (u6-pro.png, u7-pro.png, etc.) matched above. Shared across the
    // whole puck-shaped family so newly-released models (U6-Plus,
    // U7-Pro-Max, whatever comes next) still get a visually correct
    // photo without needing their own upload.
    const bareModelSlug = meaningfulTokens.length ? toSlug(meaningfulTokens.join('-')) : '';
    if (looksLikePuckAP(bareModelSlug)) {
      candidates.push(toSlug('ap-puck'));
    }

    // Brand + category fallback (e.g. "dell-monitor") — reached only if
    // no specific size/model photo matched. Without this, a generic
    // "Dell 24 inch monitor" with no exact match falls straight through
    // to the plain brand photo, which is likely a LAPTOP shot for a
    // brand like Dell/HP/Lenovo — visibly the wrong product entirely.
    // Same brand can have multiple category fallbacks (dell-monitor,
    // dell-dock, etc.) as more get added; only monitor is wired for now.
    if (brand && /\b(monitor|display|screen)s?\b/.test(raw)) {
      candidates.push(toSlug(`${brand}-monitor`));
    }
    // Docks especially need this: Lenovo's naming ("ThinkPad Universal
    // USB-C Dock") has no distinctive model code once generic words are
    // stripped, so without this fallback a plain "Lenovo dock" request
    // has nothing to land on except the wrong-category brand photo.
    if (brand && /\b(docks?|docking|stations?)\b/.test(raw)) {
      candidates.push(toSlug(`${brand}-dock`));
    }

    if (brand) candidates.push(toSlug(brand));                               // 6. brand only

    return [...new Set(candidates.filter(Boolean))];
  }

  // ── Known-spec reference table ──────────────
  // For tiered product families where the tiers are easy to mix up and
  // getting it wrong actually matters (not the whole catalog — most
  // products are fine on general AI knowledge alone). Keyed by the same
  // slugs the image matcher produces, so one lookup pass covers both.
  // Facts here are short and translate into plain benefit language on
  // the backend — reps never see raw specs, but the copy is grounded in
  // real numbers instead of the model guessing.
  const UDM_SPECS = [
    'All-in-one gateway with a built-in WiFi 5 access point and a 4-port Gigabit switch — one box handles router, firewall, and WiFi for a single small office.',
    'No PoE output and no video storage — best for simple, single-location setups without IP cameras or extra switches.'
  ];
  const UDM_PRO_SPECS = [
    'Rack-mountable with 8 Gigabit LAN ports plus a 10G SFP+ uplink — built to sit in a rack alongside separate access points and switches, not replace them.',
    'Includes a drive bay for network video recording (UniFi Protect) storage; no built-in WiFi and no PoE output on its ports.'
  ];
  const UDM_SE_SPECS = [
    'Rack-mountable with 8 PoE+ LAN ports — can power access points, cameras, or phones directly without a separate PoE switch.',
    'Steps up the WAN port to 2.5GbE (vs 1GbE on the Pro) and adds built-in storage for video/logs — the pick when PoE and multi-gig WAN both matter.'
  ];
  const UCG_ULTRA_SPECS = [
    'Compact desktop gateway with no built-in WiFi — pairs with separate access points and switches rather than replacing them.',
    'Entry-level performance (around 1 Gbps routing) supporting up to 30 additional UniFi devices — runs core network management only, not the full Protect/Talk/Access app suite.'
  ];
  const MX68_SPECS = [
    'Desktop appliance recommended for up to 50 users — the right size for a small single-location office.',
    '10 Gigabit LAN ports including 2 with PoE+, plus 2 Gigabit WAN ports for dual internet/failover.'
  ];
  const MX75_SPECS = [
    'Desktop appliance recommended for up to 200 users — a step up for a growing office without needing a rack.',
    '1 Gbps stateful firewall throughput with 3 WAN uplinks for more failover flexibility than the MX68.'
  ];
  const MX85_SPECS = [
    'Rack-mountable appliance recommended for up to 250 users — for offices already using rack-mounted networking gear.',
    '1 Gbps stateful firewall throughput with 4 WAN uplinks and fiber SFP options for higher-speed uplinks.'
  ];
  const T46U_SPECS = [
    'Wired Gigabit desk phone with a 4.3" color display — no built-in WiFi or Bluetooth, so it needs a wired network drop at the desk.',
    'Best for a fixed desk phone location where a wired connection is already available.'
  ];
  const T54W_SPECS = [
    'Same 4.3" color display as the T46U, but adds built-in WiFi and Bluetooth — no wired drop needed at the desk.',
    'Best when phone placement needs flexibility or a wired connection isn\'t available at the desk.'
  ];
  const T57W_SPECS = [
    'Steps up to a 7" touchscreen display (versus the smaller non-touch screen on the T46U/T54W) — a tablet-like interface.',
    'Also includes built-in WiFi and Bluetooth like the T54W — aimed at executives or heavy phone users who want the larger interface.'
  ];
  const R350_SPECS = [
    '1U rack server, single-processor — built for small-to-medium workloads like file/print serving, a small number of virtual machines, or a domain controller.',
    'Supports up to 128GB RAM — the right fit when the business doesn\'t need to run many resource-heavy applications on one box.'
  ];
  const R450_SPECS = [
    '1U rack server, dual-processor capable — a step up for handling more simultaneous virtual machines or a bigger user base than the R350.',
    'Supports up to 1TB RAM, no GPU support — built for general business workloads rather than graphics or AI-heavy tasks.'
  ];
  const R650_SPECS = [
    '1U rack server, dual-processor, supports up to 4TB RAM — built for demanding virtualization or database workloads that would strain the R350/R450.',
    'Supports GPU add-in cards — the pick when the business needs graphics acceleration or heavier compute, not just standard virtualization.'
  ];

  // Keyed by the same slugs the image matcher produces. UDM entries are
  // already bare (no "unifi-" prefix) matching our established naming
  // convention there. Meraki/Yealink/Dell get BOTH the brand-prefixed
  // and bare-model key, since reps often drop the brand word entirely
  // ("MX68" without "Meraki", "T54W" without "Yealink") — the bare form
  // is what actually shows up in the candidate list in that case.
  const PRODUCT_SPECS = {
    'udm':    UDM_SPECS,
    'udm-pro': UDM_PRO_SPECS,
    'udm-se':  UDM_SE_SPECS,
    'ucg-ultra': UCG_ULTRA_SPECS,
    'meraki-mx68': MX68_SPECS, 'mx68': MX68_SPECS,
    'meraki-mx75': MX75_SPECS, 'mx75': MX75_SPECS,
    'meraki-mx85': MX85_SPECS, 'mx85': MX85_SPECS,
    'yealink-t46u': T46U_SPECS, 't46u': T46U_SPECS,
    'yealink-t54w': T54W_SPECS, 't54w': T54W_SPECS,
    'yealink-t57w': T57W_SPECS, 't57w': T57W_SPECS,
    'dell-r350': R350_SPECS, 'r350': R350_SPECS,
    'dell-r450': R450_SPECS, 'r450': R450_SPECS,
    'dell-r650': R650_SPECS, 'r650': R650_SPECS
  };

  // Reuses the same fuzzy candidate list as the image matcher — one
  // slug-generation pass now serves two lookups (image + specs).
  function findProductSpecs(name) {
    const candidates = buildImageCandidates(name);
    for (const slug of candidates) {
      if (PRODUCT_SPECS[slug]) return PRODUCT_SPECS[slug];
    }
    return null;
  }

  // Checked in this order per candidate slug — png first since it's the
  // documented convention, but jpg/jpeg work too.
  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

  // Returns the matched extension (e.g. 'jpg') if found, otherwise null —
  // rather than a bare boolean, since the caller needs to know which
  // extension actually hit to build the right URL.
  async function imageExists(base, slug) {
    if (!slug) return null;
    for (const ext of IMAGE_EXTENSIONS) {
      try {
        const res = await fetch(`${base}${slug}.${ext}`, { method: 'HEAD' });
        if (res.ok) return ext;
      } catch {
        // try the next extension
      }
    }
    return null;
  }

  // Runs BEFORE the widget HTML is built (not after) so the image
  // decision is baked into the first render rather than patched in.
  // Manual override skips the fuzzy candidate list and checks that exact
  // slug only (still across both image bases).
  // Absolute last resort — used only when nothing else matched at all
  // (no specific model, no puck fallback, no brand-level photo). Keeps
  // every widget clickable in Salesbuildr rather than an empty image
  // slot, which is fiddlier for reps to fill in from scratch.
  const PLACEHOLDER_SLUG = 'placeholder';

  async function resolveImage(name, overrideRaw) {
    const override = (overrideRaw || '').trim();
    const candidates = override ? [toSlug(override)] : buildImageCandidates(name);

    for (const slug of candidates) {
      for (const base of IMAGE_BASES) {
        const ext = await imageExists(base, slug);
        if (ext) {
          return { slug, found: true, url: `${base}${slug}.${ext}`, ext };
        }
      }
    }

    // Nothing matched at all — try the universal placeholder before
    // giving up entirely.
    for (const base of IMAGE_BASES) {
      const ext = await imageExists(base, PLACEHOLDER_SLUG);
      if (ext) {
        return { slug: PLACEHOLDER_SLUG, found: true, url: `${base}${PLACEHOLDER_SLUG}.${ext}`, ext, isPlaceholder: true };
      }
    }

    return { slug: candidates[0] || toSlug(name), found: false, url: null };
  }

  function updateImageNote(imageInfo) {
    if (!imageInfo) { imageSlugNote.hidden = true; return; }
    imageSlugNote.hidden = false;
    if (imageInfo.isPlaceholder) {
      imageSlugNote.textContent = '📷 No specific match — using the placeholder image. Click it in Salesbuildr to drop in your own.';
      return;
    }
    imageSlugNote.textContent = imageInfo.found
      ? `📷 Using image: ${imageInfo.slug}.${imageInfo.ext}`
      : `📷 No image found for "${imageInfo.slug}.*" — using graphic style.`;
  }

  // Image strip markup — inserted between the gradient header and the
  // intro. object-fit:contain on a white background (not the originally
  // spec'd cover/140px) because the real product photos are angled hero
  // shots with headroom; cover cropped straight through the laptop.
  function imageStripHtml(imageInfo) {
    if (!imageInfo || !imageInfo.found || !imageInfo.url) return '';
    return `<div style="background:#ffffff;padding:14px 18px;text-align:center;border-bottom:1px solid #e3e7ee;"><img src="${imageInfo.url}" alt="" style="max-width:100%;max-height:170px;object-fit:contain;display:inline-block;"></div>`;
  }

  const imageOverrideToggle = $('imageOverrideToggle');
  const imageOverrideSlugEl = $('imageOverrideSlug');

  imageOverrideToggle.addEventListener('click', () => {
    const willShow = imageOverrideSlugEl.hidden;
    imageOverrideSlugEl.hidden = !willShow;
    if (willShow) imageOverrideSlugEl.focus();
  });

  async function recheckImageOverride() {
    if (!currentData) return; // nothing generated yet to attach an image to
    const info = await resolveImage(productNameEl.value.trim(), imageOverrideSlugEl.value);
    currentData._image = info;
    updateImageNote(info);
    renderPreview();
  }
  imageOverrideSlugEl.addEventListener('change', recheckImageOverride);
  imageOverrideSlugEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); recheckImageOverride(); }
  });

  // ── Widget HTML builders (inline styles, no Flexbox, h5/h6 only) ──
  // All three styles read from the SAME unified data shape:
  //   { category, headline, intro, points: [{icon,title,description,badge}] x4, footerText, footerBadge }
  // Layered / Numbered use points[0..2]; Grid uses all 4. This is what
  // makes instant style-switching possible without another AI call.
  //
  // Editable text carries a data-field attribute so makeEditable() can
  // wire it up and keep currentData in sync as the rep types.

  function gradientHeaderStyle(hex) {
    const dark = shadeHex(hex, -0.35);
    return `background-color:${hex};background-image:radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, ${dark} 0%, ${hex} 100%);background-size:14px 14px, 100% 100%;padding:16px 18px 14px;`;
  }

  function kickerHtml(text) {
    return `<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:5px;">${esc(text)}</div>`;
  }

  function headlineHtml(text) {
    return `<h5 data-field="headline" style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;line-height:1.28;letter-spacing:-0.01em;">${esc(text)}</h5>`;
  }

  function introHtml(text) {
    return `<div style="padding:14px 18px;border-bottom:1px solid #e3e7ee;"><p data-field="intro" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(text)}</p></div>`;
  }

  // Style 1 — Layered Rows
  function buildLayeredHtml(data, hex) {
    const points = (data.points || []).slice(0, 3);
    const rows = points.map((pt, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;${tint}">
    <tr>
      <td style="padding:10px 14px;width:40px;vertical-align:top;">
        <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:#eaf1fc;font-size:16px;">${esc(pt.icon || '•')}</span>
      </td>
      <td style="padding:10px 14px 10px 0;vertical-align:top;">
        <div data-field="point${idx}-title" style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
        <div data-field="point${idx}-description" style="font-size:12px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
      </td>
    </tr>
  </table>`;
    }).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${imageStripHtml(data._image)}
  ${introHtml(data.intro || '')}
  ${rows}
</div>`;
  }

  // Style 2 — Numbered Blocks
  function buildNumberedHtml(data, hex) {
    const points = (data.points || []).slice(0, 3);
    const rows = points.map((pt, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;border-bottom:1px solid #e3e7ee;${tint}">
    <tr>
      <td style="width:36px;background:${esc(hex)};color:#ffffff;text-align:center;font-size:14px;font-weight:700;vertical-align:middle;padding:10px 0;">${idx + 1}</td>
      <td style="padding:10px 14px;vertical-align:top;">
        <div data-field="point${idx}-title" style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
        <div data-field="point${idx}-description" style="font-size:12px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
      </td>
      <td style="width:80px;text-align:center;vertical-align:middle;padding:10px 6px;">
        <span data-field="point${idx}-badge" style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(pt.badge || 'Included')}</span>
      </td>
    </tr>
  </table>`;
    }).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${imageStripHtml(data._image)}
  ${introHtml(data.intro || '')}
  ${rows}
</div>`;
  }

  // Style 3 — Benefit Grid
  function buildGridHtml(data, hex) {
    const points = (data.points || []).slice(0, 4);
    while (points.length < 4) points.push({ icon: '•', title: '', description: '' });

    const cell = (pt, idx, borderRight, borderBottom) => {
      const border = `${borderRight ? 'border-right:1px solid #e3e7ee;' : ''}${borderBottom ? 'border-bottom:1px solid #e3e7ee;' : ''}`;
      return `<td style="padding:12px 14px;vertical-align:top;width:50%;${border}">
      <div style="font-size:16px;margin-bottom:4px;">${esc(pt.icon || '•')}</div>
      <div data-field="point${idx}-title" style="font-size:12.5px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
      <div data-field="point${idx}-description" style="font-size:11.5px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
    </td>`;
    };

    const grid = `<table width="100%" style="border-collapse:collapse;">
    <tr>${cell(points[0], 0, true, true)}${cell(points[1], 1, false, true)}</tr>
    <tr>${cell(points[2], 2, true, false)}${cell(points[3], 3, false, false)}</tr>
  </table>`;

    const footer = `<table width="100%" style="border-collapse:collapse;background:#f4f7fb;border-top:1px solid #e3e7ee;">
    <tr>
      <td data-field="footerText" style="padding:10px 14px;font-size:11.5px;color:#9ca3af;">${esc(data.footerText || 'Managed & supported by your IT team')}</td>
      <td style="padding:10px 14px;text-align:right;">
        <span data-field="footerBadge" style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(data.footerBadge || '✓ Fully managed')}</span>
      </td>
    </tr>
  </table>`;

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${imageStripHtml(data._image)}
  ${introHtml(data.intro || '')}
  ${grid}
  ${footer}
</div>`;
  }

  function renderWidgetHtml(style, data, hex) {
    if (!data) return '';
    if (style === 'numbered') return buildNumberedHtml(data, hex);
    if (style === 'grid')     return buildGridHtml(data, hex);
    return buildLayeredHtml(data, hex);
  }

  // ── Inline editing (contenteditable, no raw HTML view) ──
  // Reps only ever click into the rendered widget and type — no HTML
  // is ever shown. Edits sync back into currentData immediately so
  // switching style or theme afterwards preserves the edited copy.
  function makeEditable(frame) {
    frame.querySelectorAll('[data-field]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.addEventListener('input', () => {
        const field = el.dataset.field;
        const text = el.textContent;
        const pointMatch = field.match(/^point(\d)-(title|description|badge)$/);
        if (pointMatch) {
          const idx = parseInt(pointMatch[1], 10);
          const sub = pointMatch[2];
          if (currentData.points && currentData.points[idx]) {
            currentData.points[idx][sub] = text;
          }
        } else {
          currentData[field] = text;
        }
        currentHtml = getWidgetHtmlFromFrame(frame);
      });
    });
  }

  // Capture the current live widget HTML (with edits applied), stripping
  // the contenteditable attributes that only make sense in the tool UI.
  function getWidgetHtmlFromFrame(frame) {
    const clone = frame.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return clone.innerHTML;
  }

  // ── Single render entry point used by generate / regenerate / style / theme ──
  function renderPreview() {
    const html = renderWidgetHtml(selectedStyle, currentData, currentThemeHex);
    widgetPreview.innerHTML = html;
    makeEditable(widgetPreview);
    currentHtml = getWidgetHtmlFromFrame(widgetPreview);
  }

  // ── Form validation ──────────────────────────
  function validate() {
    if (!productNameEl.value.trim()) return 'Enter a product or service name.';
    if (!categoryEl.value) return 'Select a category.';
    return null;
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
    formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function hideError() { formError.hidden = true; }

  // Scrolls so the output panel's top is comfortably in view — used the
  // moment Generate/Regenerate is clicked so the loader and result both
  // land where the rep is already looking, instead of below the fold.
  function scrollToOutput() {
    const panel = widgetOutput.closest('.output-panel') || widgetOutput.parentElement;
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Generate ──────────────────────────────────
  async function generate() {
    hideError();
    const err = validate();
    if (err) { showError(err); return; }

    const requestPayload = {
      name:       productNameEl.value.trim(),
      category:   categoryEl.value,
      context:    customContextEl.value.trim(),
      style:      selectedStyle,
      knownSpecs: findProductSpecs(productNameEl.value.trim())
    };
    lastRequest = requestPayload;

    emptyState.hidden = true;
    widgetOutput.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    // Scroll to the output panel right away so the loader — and then the
    // widget — is in view. On narrow / stacked layouts the right column
    // can otherwise sit well below the fold when Generate is clicked.
    scrollToOutput();

    try {
      const [json, imageInfo] = await Promise.all([
        fetch('/api/product-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        }).then(r => r.json()),
        resolveImage(requestPayload.name, imageOverrideSlugEl.value)
      ]);
      if (!json.ok) throw new Error(json.error || 'Generation failed.');

      currentData  = json.data;
      currentData._image = imageInfo;
      currentTitle = `${requestPayload.name} — Explainer`;
      updateImageNote(imageInfo);
      renderOutput();

    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = false;
      showError('Error: ' + (e.message || 'Something went wrong. Please try again.'));
    } finally {
      generateBtn.disabled = false;
      regenerateBtn.disabled = false;
    }
  }

  function renderOutput() {
    loadingState.hidden = true;
    renderPreview();
    widgetTitleEl.textContent = currentTitle;

    widgetOutput.hidden = false;
    pushFeedback.hidden = true;
    credsInline.hidden = true;

    addToSessionList(currentTitle, currentHtml);
  }

  generateBtn.addEventListener('click', generate);
  regenerateBtn.addEventListener('click', async () => {
    if (!lastRequest) return generate();
    hideError();
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = '…';
    scrollToOutput();
    try {
      const [json, imageInfo] = await Promise.all([
        fetch('/api/product-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lastRequest)
        }).then(r => r.json()),
        resolveImage(lastRequest.name, imageOverrideSlugEl.value)
      ]);
      if (!json.ok) throw new Error(json.error || 'Regeneration failed.');
      currentData = json.data;
      currentData._image = imageInfo;
      updateImageNote(imageInfo);
      renderOutput();
    } catch (e) {
      showError('Regeneration failed: ' + e.message);
    } finally {
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = '↺ Regenerate';
    }
  });

  // ── Copy HTML ─────────────────────────────────
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentHtml).then(() => {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy HTML'; }, 2000);
    }).catch(() => alert('Could not copy to clipboard. Try again.'));
  });

  // ── Push to Salesbuildr ───────────────────────
  pushBtn.addEventListener('click', () => {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    doPush(apiKey, tenantUrl);
  });

  cancelCredsBtn.addEventListener('click', () => { credsInline.hidden = true; });

  saveAndPushBtn.addEventListener('click', () => {
    const apiKey    = sbApiKeyEl.value.trim();
    const tenantUrl = sbTenantUrlEl.value.trim();
    if (!apiKey || !tenantUrl) { alert('Please enter both your API key and tenant URL.'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    doPush(apiKey, tenantUrl);
  });

  async function doPush(apiKey, tenantUrl) {
    pushFeedback.hidden = true;
    pushFeedback.className = 'push-feedback';
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing…';

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: [{ id: 'product-explainer', title: currentTitle, html: currentHtml }],
          prefix: currentTitle,
          apiKey,
          tenantUrl
        })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushFeedback('success', '✓ Widget pushed to Salesbuildr successfully.');
      } else {
        showPushFeedback('error', 'Push failed: ' + (data.error || 'Unknown error. Check your credentials.'));
      }
    } catch (e) {
      showPushFeedback('error', 'Push failed: ' + (e.message || 'Network error.'));
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push to Salesbuildr';
    }
  }

  function showPushFeedback(type, msg) {
    pushFeedback.hidden = false;
    pushFeedback.className = 'push-feedback ' + type;
    pushFeedback.textContent = msg;
    pushFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Clear (start over for the next line item) ────────────
  // Resets product name / context / preview, but deliberately keeps
  // selectedStyle and currentThemeHex so the MSP doesn't have to
  // re-pick them for every product in a batch quote.
  function clearForm() {
    productNameEl.value = '';
    customContextEl.value = '';
    contextCharCount.textContent = '0';
    categoryEl.value = '';
    categoryEl.dataset.autoset = '0';
    categorySuggest.hidden = true;

    currentData  = null;
    currentHtml  = '';
    currentTitle = '';
    lastRequest  = null;

    imageOverrideSlugEl.value = '';
    imageOverrideSlugEl.hidden = true;
    imageSlugNote.hidden = true;

    widgetOutput.hidden = true;
    emptyState.hidden = false;
    hideError();

    productNameEl.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  clearBtn.addEventListener('click', clearForm);

  // ── Generated this session list ───────────────
  function addToSessionList(title, html) {
    sessionWidgets.unshift({ title, html });
    renderSessionList();
  }

  function renderSessionList() {
    // Only earns its keep once there's more than one widget to choose
    // from — with just one, it's a redundant duplicate of the Copy HTML
    // button right above it in the main preview.
    if (sessionWidgets.length < 2) { sessionListBlock.hidden = true; return; }
    sessionListBlock.hidden = false;
    sessionList.innerHTML = '';
    sessionWidgets.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'session-item';
      row.innerHTML = `
        <span class="session-item-name">${esc(item.title)}</span>
        <span class="session-item-actions">
          <button type="button" class="session-copy-btn">Copy HTML</button>
        </span>`;
      row.querySelector('.session-copy-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(item.html).then(() => {
          e.target.textContent = 'Copied ✓';
          setTimeout(() => { e.target.textContent = 'Copy HTML'; }, 2000);
        });
      });
      sessionList.appendChild(row);
    });
  }

  // ── Pre-fill Salesbuildr creds from localStorage ──
  (function prefillCreds() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (apiKey) sbApiKeyEl.value = apiKey;
    if (tenantUrl) sbTenantUrlEl.value = tenantUrl;
  })();

})();
