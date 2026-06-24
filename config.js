/* ═══════════════════════════════════════════════════════════════════
   SALESBUILDR STORE CONFIGURATOR — config.js
   Simulation only — no live connection to storefront
═══════════════════════════════════════════════════════════════════ */

// ── DOM REFS ──────────────────────────────────────────────────────
const cfgToast        = document.getElementById('cfgToast');
const saveBtn         = document.getElementById('saveBtn');
const previewBtn      = document.getElementById('previewBtn');
const previewFrame    = document.getElementById('previewFrame');
const previewFrameWrap= document.getElementById('previewFrameWrap');

// Preview elements
const pvHeader    = document.getElementById('pvHeader');
const pvBanner    = document.getElementById('pvBanner');
const pvKicker    = document.getElementById('pvKicker');
const pvHeadline  = document.getElementById('pvHeadline');
const pvSub       = document.getElementById('pvSub');
const pvCta       = document.getElementById('pvCta');
const pvCta2      = document.getElementById('pvCta2');
const pvStats     = document.getElementById('pvStats');
const pvStoreName = document.getElementById('pvStoreName');
const pvGrid      = document.getElementById('pvGrid');

// ── STATE ─────────────────────────────────────────────────────────
const THEMES = {
  default: { accent: '#2E74DC', text: '#0B0E14', bg: '#FAFAF7' },
  slate:   { accent: '#475569', text: '#1e293b', bg: '#f8fafc' },
  forest:  { accent: '#16a34a', text: '#14532d', bg: '#f0fdf4' },
  ember:   { accent: '#dc2626', text: '#1c1917', bg: '#fafaf9' },
  violet:  { accent: '#7c3aed', text: '#2e1065', bg: '#faf5ff' },
  custom:  { accent: '#2E74DC', text: '#0B0E14', bg: '#FAFAF7' },
};

let currentTheme = 'default';
let previewMobile = false;

// Simulated company search data
const COMPANIES = [
  'Alpha Solutions Ltd',
  'Beacon Financial Group',
  'Cedar Ridge Technologies',
  'Delta Dynamics Inc',
  'Echo Health Systems',
  'Falcon Media Corp',
  'Granite Peak Energy',
  'Harbor View Logistics',
  'Iris Analytics',
  'Jupiter Retail Group',
];

// ── SECTION NAV ───────────────────────────────────────────────────
document.querySelectorAll('.cfg-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.cfg-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.cfg-section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    const sec = document.getElementById('section-' + item.dataset.section);
    if (sec) sec.classList.add('active');
    // Products section gets full width — hide preview panel
    const shell = document.querySelector('.cfg-shell');
    if (shell) shell.classList.toggle('products-active', item.dataset.section === 'products');
  });
});

// ── SAVE BUTTON ───────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  saveBtn.textContent = 'Saving…';
  saveBtn.disabled = true;
  setTimeout(() => {
    saveBtn.textContent = 'Save changes';
    saveBtn.disabled = false;
    showToast('Changes saved');
  }, 900);
});

// Preview store button — links to storefront
previewBtn.addEventListener('click', () => {
  window.open('storefront.html', '_blank');
});

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(msg) {
  cfgToast.textContent = msg;
  cfgToast.classList.add('show');
  setTimeout(() => cfgToast.classList.remove('show'), 2600);
}

// ── THEME PRESETS ─────────────────────────────────────────────────
document.querySelectorAll('.cfg-theme-preset').forEach(preset => {
  preset.addEventListener('click', () => {
    document.querySelectorAll('.cfg-theme-preset').forEach(p => p.classList.remove('active'));
    preset.classList.add('active');
    currentTheme = preset.dataset.theme;

    const customField = document.getElementById('customColorsField');
    if (currentTheme === 'custom') {
      customField.style.display = 'flex';
    } else {
      customField.style.display = 'none';
      applyThemeToPreview(THEMES[currentTheme]);
    }
  });
});

function applyThemeToPreview(theme) {
  const frame = document.getElementById('previewFrame');
  frame.style.setProperty('--pv-accent', theme.accent);
  frame.style.setProperty('--pv-text', theme.text);
  frame.style.setProperty('--pv-bg', theme.bg);

  // Update pv-btn-primary bg
  document.querySelectorAll('.pv-btn-primary').forEach(el => {
    el.style.background = theme.text;
  });
  document.querySelectorAll('.pv-btn-secondary').forEach(el => {
    el.style.borderColor = 'rgba(0,0,0,.15)';
  });
  document.querySelectorAll('.pv-card-btn').forEach(el => {
    el.style.background = theme.accent;
  });
  document.querySelectorAll('.pv-logo').forEach(el => {
    el.style.background = theme.accent;
  });
}

// Custom colour pickers
['Accent', 'Text', 'Bg'].forEach(name => {
  const swatch = document.getElementById('color' + name);
  const hex    = document.getElementById('color' + name + 'Hex');
  if (!swatch || !hex) return;

  swatch.addEventListener('input', () => {
    hex.value = swatch.value;
    applyCustomColors();
  });
  hex.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) {
      swatch.value = hex.value;
      applyCustomColors();
    }
  });
});

function applyCustomColors() {
  const accent = document.getElementById('colorAccent')?.value || '#2E74DC';
  const text   = document.getElementById('colorText')?.value   || '#0B0E14';
  const bg     = document.getElementById('colorBg')?.value     || '#FAFAF7';
  applyThemeToPreview({ accent, text, bg });
}

// ── BANNER LIVE PREVIEW ───────────────────────────────────────────
function bindBannerPreview(inputId, pvEl) {
  const el = document.getElementById(inputId);
  if (!el || !pvEl) return;
  el.addEventListener('input', () => { pvEl.textContent = el.value; });
}

bindBannerPreview('bannerKicker',   pvKicker);
bindBannerPreview('bannerHeadline', pvHeadline);
bindBannerPreview('bannerSub',      pvSub);
bindBannerPreview('bannerCta',      pvCta);
bindBannerPreview('bannerCta2',     pvCta2);
bindBannerPreview('storeName',      pvStoreName);

// Banner style change
document.querySelectorAll('[data-group="bannerstyle"]').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('[data-group="bannerstyle"]').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    const style = opt.dataset.value;
    if (style === 'clean') {
      pvBanner.style.background = '#fff';
      pvKicker.style.color      = 'var(--pv-accent)';
      pvHeadline.style.color    = 'var(--pv-text)';
    } else if (style === 'accent') {
      pvBanner.style.background = 'var(--accent-bg)';
      pvKicker.style.color      = 'var(--pv-accent)';
      pvHeadline.style.color    = 'var(--pv-text)';
    } else if (style === 'dark') {
      pvBanner.style.background = 'var(--pv-text)';
      pvKicker.style.color      = 'rgba(255,255,255,.6)';
      pvHeadline.style.color    = '#fff';
    }
  });
});

// Stats toggle
document.getElementById('showStats')?.addEventListener('change', e => {
  pvStats.style.display = e.target.checked ? 'flex' : 'none';
});

// Store active toggle label
document.getElementById('storeActive')?.addEventListener('change', e => {
  const label = document.getElementById('storeActiveLabel');
  label.textContent = e.target.checked
    ? 'Store is live — customers can access it'
    : 'Store is offline — customers will see a coming soon page';
  label.style.color = e.target.checked ? '' : 'var(--danger)';
});

// ── PREVIEW TABS (desktop / mobile) ──────────────────────────────
document.querySelectorAll('.cfg-preview-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cfg-preview-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    previewMobile = tab.dataset.ptab === 'mobile';
    previewFrame.classList.toggle('mobile', previewMobile);
  });
});

// ── RADIO OPTS (single-select groups) ────────────────────────────
document.querySelectorAll('.cfg-radio-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    const group = opt.dataset.group;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(o => o.classList.remove('active'));
    opt.classList.add('active');

    // View mode affects preview grid
    if (group === 'viewmode') updateGridView(opt.dataset.value);
    // Button style affects preview
    if (group === 'btnstyle') updateBtnStyle(opt.dataset.value);
  });
});

// Radio lines (single-select)
document.querySelectorAll('.cfg-radio-line').forEach(line => {
  line.addEventListener('click', () => {
    const group = line.dataset.group;
    document.querySelectorAll(`[data-group="${group}"]`).forEach(l => l.classList.remove('active'));
    line.classList.add('active');

    // Show/hide approval threshold
    if (group === 'approval') {
      const show = line.dataset.value === 'threshold';
      const field = document.getElementById('thresholdField');
      if (field) field.style.display = show ? 'flex' : 'none';
    }
  });
});

function updateGridView(mode) {
  if (mode === 'list') {
    pvGrid.style.gridTemplateColumns = '1fr';
    pvGrid.querySelectorAll('.pv-card').forEach(card => {
      card.style.flexDirection = 'row';
      const img = card.querySelector('.pv-card-img');
      if (img) img.style.cssText = 'width:60px;height:40px;flex-shrink:0;border-bottom:none;border-right:1px solid rgba(0,0,0,.06)';
    });
  } else {
    pvGrid.style.gridTemplateColumns = 'repeat(4,1fr)';
    pvGrid.querySelectorAll('.pv-card').forEach(card => {
      card.style.flexDirection = 'column';
      const img = card.querySelector('.pv-card-img');
      if (img) img.style.cssText = 'height:80px;border-bottom:1px solid rgba(0,0,0,.06);border-right:none;';
    });
  }
}

function updateBtnStyle(style) {
  const radii = { sharp: '0px', soft: '6px', pill: '999px' };
  const r = radii[style] || '0px';
  document.querySelectorAll('.pv-btn, .pv-card-btn').forEach(el => {
    el.style.borderRadius = r;
  });
}

// ── DRAG-AND-DROP FEATURED PRODUCTS ──────────────────────────────
const featuredList = document.getElementById('featuredList');
let dragSrc = null;

if (featuredList) {
  featuredList.addEventListener('dragstart', e => {
    dragSrc = e.target.closest('.cfg-drag-item');
    if (dragSrc) dragSrc.classList.add('dragging');
  });

  featuredList.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.cfg-drag-item');
    if (target && target !== dragSrc) {
      featuredList.querySelectorAll('.cfg-drag-item').forEach(i => i.classList.remove('drag-over'));
      target.classList.add('drag-over');
    }
  });

  featuredList.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.cfg-drag-item');
    if (target && target !== dragSrc) {
      const items = [...featuredList.querySelectorAll('.cfg-drag-item')];
      const srcIdx = items.indexOf(dragSrc);
      const tgtIdx = items.indexOf(target);
      if (srcIdx < tgtIdx) target.after(dragSrc);
      else target.before(dragSrc);
    }
    featuredList.querySelectorAll('.cfg-drag-item').forEach(i => {
      i.classList.remove('dragging', 'drag-over');
    });
    dragSrc = null;
    showToast('Featured order updated');
  });

  featuredList.addEventListener('dragend', () => {
    featuredList.querySelectorAll('.cfg-drag-item').forEach(i => {
      i.classList.remove('dragging', 'drag-over');
    });
    dragSrc = null;
  });
}

// ── COMPANY SEARCH ────────────────────────────────────────────────
const companySearch  = document.getElementById('companySearch');
const companyResults = document.getElementById('companyResults');

if (companySearch) {
  companySearch.addEventListener('input', () => {
    const q = companySearch.value.trim().toLowerCase();
    if (!q) { companyResults.style.display = 'none'; return; }

    const matches = COMPANIES.filter(c => c.toLowerCase().includes(q));
    if (matches.length === 0) { companyResults.style.display = 'none'; return; }

    companyResults.innerHTML = matches.map(c =>
      `<div class="cfg-search-result-item">
        <span>${c}</span>
        <span class="cfg-result-add">+ Add</span>
      </div>`
    ).join('');
    companyResults.style.display = 'block';

    companyResults.querySelectorAll('.cfg-search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        companySearch.value = '';
        companyResults.style.display = 'none';
        showToast(item.querySelector('span').textContent + ' added to store');
      });
    });
  });

  document.addEventListener('click', e => {
    if (!companySearch.contains(e.target) && !companyResults.contains(e.target)) {
      companyResults.style.display = 'none';
    }
  });
}

// ── ADD BRANCH OFFICE ─────────────────────────────────────────────
document.getElementById('addBranchBtn')?.addEventListener('click', () => {
  const list = document.getElementById('branchList');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'cfg-branch-row';
  row.innerHTML = `
    <input class="cfg-input cfg-branch-input" placeholder="Office name" />
    <input class="cfg-input cfg-branch-input" placeholder="Full address" />
    <button class="cfg-branch-remove">×</button>
  `;
  row.querySelector('.cfg-branch-remove').addEventListener('click', () => row.remove());
  list.appendChild(row);
  row.querySelector('input').focus();
});

// Wire existing branch removes
document.querySelectorAll('.cfg-branch-list .cfg-branch-remove').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.cfg-branch-row').remove());
});

// ── ADD AI QUICK PROMPT ───────────────────────────────────────────
document.getElementById('addPromptBtn')?.addEventListener('click', () => {
  const list = document.getElementById('promptList');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'cfg-prompt-row';
  row.innerHTML = `
    <input class="cfg-input" placeholder="Quick prompt label…" />
    <button class="cfg-branch-remove">×</button>
  `;
  row.querySelector('.cfg-branch-remove').addEventListener('click', () => row.remove());
  list.appendChild(row);
  row.querySelector('input').focus();
});

// Wire existing prompt removes
document.querySelectorAll('.cfg-prompt-list .cfg-branch-remove').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.cfg-prompt-row').remove());
});

// ── FONT DISPLAY PREVIEW ──────────────────────────────────────────
document.getElementById('fontDisplay')?.addEventListener('change', e => {
  const font = e.target.value;
  // Load the font if not already loaded
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g,'+')}:wght@700&display=swap`;
  document.head.appendChild(link);

  // Apply to preview headings
  document.querySelectorAll('.pv-headline, .pv-store-name, .pv-stat-num, .pv-card-name').forEach(el => {
    el.style.fontFamily = `'${font}', sans-serif`;
  });
});

// ── ENABLE/DISABLE CARD PAYMENT ───────────────────────────────────
document.getElementById('enableCard')?.addEventListener('change', e => {
  const field = document.getElementById('gpConfigField');
  if (field) field.style.opacity = e.target.checked ? '1' : '0.4';
});

// ── NOTIFICATIONS — disable email input when toggle is off ────────
document.querySelectorAll('.cfg-notif-row').forEach(row => {
  const toggle = row.querySelector('input[type="checkbox"]');
  const email  = row.querySelector('.cfg-notif-email');
  if (!toggle || !email) return;
  toggle.addEventListener('change', () => {
    email.disabled = !toggle.checked;
    email.style.opacity = toggle.checked ? '1' : '0.4';
  });
});


// ══════════════════════════════════════════════════════════════════
// PRODUCTS SECTION
// ══════════════════════════════════════════════════════════════════

// ── SIMULATED SALESBUILDR CATALOG ────────────────────────────────
// Reflects the real product range — more items than the demo store
// to show the MSP has a fuller catalog to pick from
const SB_CATALOG = [
  // Laptops
  { id:'lat-3450',    cat:'laptop',    name:'Dell Latitude 3450',         sku:'LAT-3450-8-256',   price:649,   stock:'in'  },
  { id:'lat-3550',    cat:'laptop',    name:'Dell Latitude 3550',         sku:'LAT-3550-8-256',   price:699,   stock:'in'  },
  { id:'lat-5350',    cat:'laptop',    name:'Dell Latitude 5350',         sku:'LAT-5350-8-256',   price:879,   stock:'in'  },
  { id:'lat-5350-16', cat:'laptop',    name:'Dell Latitude 5350 (16 GB)', sku:'LAT-5350-16-512',  price:999,   stock:'in'  },
  { id:'lat-5450',    cat:'laptop',    name:'Dell Latitude 5450',         sku:'LAT-5450-16-512',  price:969,   stock:'in'  },
  { id:'lat-5550',    cat:'laptop',    name:'Dell Latitude 5550',         sku:'LAT-5550-16-512',  price:1049,  stock:'in'  },
  { id:'lat-5550a',   cat:'laptop',    name:'Dell Latitude 5550 (AMD)',   sku:'LAT-5550A-16-512', price:1129,  stock:'low' },
  { id:'lat-7350',    cat:'laptop',    name:'Dell Latitude 7350',         sku:'LAT-7350-16-512',  price:1349,  stock:'in'  },
  { id:'lat-7450',    cat:'laptop',    name:'Dell Latitude 7450',         sku:'LAT-7450-32-1TB',  price:1649,  stock:'in'  },
  { id:'lat-7450u',   cat:'laptop',    name:'Dell Latitude 7450 Ultra',   sku:'LAT-7450U-32-1TB', price:1849,  stock:'low' },
  { id:'lat-9450',    cat:'laptop',    name:'Dell Latitude 9450 2-in-1',  sku:'LAT-9450-32-1TB',  price:2149,  stock:'in'  },
  { id:'lat-9550',    cat:'laptop',    name:'Dell Latitude 9550',         sku:'LAT-9550-32-1TB',  price:2349,  stock:'out' },
  { id:'prec-3591',   cat:'laptop',    name:'Dell Precision 3591',        sku:'PRE-3591-32-1TB',  price:2799,  stock:'in'  },
  { id:'prec-5690',   cat:'laptop',    name:'Dell Precision 5690',        sku:'PRE-5690-64-2TB',  price:3299,  stock:'low' },
  { id:'lat-5350c',   cat:'laptop',    name:'Dell Latitude 5350 Chromebook', sku:'LAT-5350C-8-128', price:549, stock:'in'  },
  { id:'lat-3340',    cat:'laptop',    name:'Dell Latitude 3340',         sku:'LAT-3340-8-256',   price:599,   stock:'in'  },
  { id:'lat-5440',    cat:'laptop',    name:'Dell Latitude 5440',         sku:'LAT-5440-16-512',  price:929,   stock:'in'  },
  { id:'lat-5540',    cat:'laptop',    name:'Dell Latitude 5540',         sku:'LAT-5540-16-512',  price:989,   stock:'in'  },
  // Monitors
  { id:'mon-p2225h',  cat:'monitor',   name:'Dell P2225H 22" Monitor',    sku:'MON-P2225H',       price:189,   stock:'in'  },
  { id:'mon-p2425h',  cat:'monitor',   name:'Dell P2425H 24" Monitor',    sku:'MON-P2425H',       price:259,   stock:'in'  },
  { id:'mon-p2725h',  cat:'monitor',   name:'Dell P2725H 27" Monitor',    sku:'MON-P2725H',       price:319,   stock:'in'  },
  { id:'mon-p3225qe', cat:'monitor',   name:'Dell P3225QE 32" 4K',        sku:'MON-P3225QE',      price:499,   stock:'in'  },
  { id:'mon-u2724d',  cat:'monitor',   name:'Dell UltraSharp U2724D',     sku:'MON-U2724D',       price:549,   stock:'in'  },
  { id:'mon-u3224kb', cat:'monitor',   name:'Dell UltraSharp U3224KB 32"',sku:'MON-U3224KB',      price:899,   stock:'low' },
  { id:'mon-u4924dw', cat:'monitor',   name:'Dell UltraSharp U4924DW 49"',sku:'MON-U4924DW',      price:1299,  stock:'in'  },
  // Docks
  { id:'dock-wd19s',   cat:'dock',     name:'Dell Dock WD19S',            sku:'DOCK-WD19S',       price:199,   stock:'in'  },
  { id:'dock-wd19tbs', cat:'dock',     name:'Dell Thunderbolt Dock WD19TBS', sku:'DOCK-WD19TBS',  price:289,   stock:'in'  },
  { id:'dock-wd22tb4', cat:'dock',     name:'Dell Thunderbolt Dock WD22TB4', sku:'DOCK-WD22TB4',  price:349,   stock:'in'  },
  { id:'dock-wd22dc',  cat:'dock',     name:'Dell Dual Charge Dock HD22Q', sku:'DOCK-HD22Q',      price:249,   stock:'in'  },
  { id:'dock-da310',   cat:'dock',     name:'Dell DA310 USB-C Mobile Adapter', sku:'DOCK-DA310',  price:69,    stock:'in'  },
  // Accessories
  { id:'bag-premier',  cat:'accessory',name:'Dell Premier Backpack 15',   sku:'BAG-PE1520P',      price:89,    stock:'in'  },
  { id:'bag-sleeve',   cat:'accessory',name:'Dell Pro Sleeve 14',         sku:'BAG-PO1420VS',     price:39,    stock:'in'  },
  { id:'bag-roller',   cat:'accessory',name:'Dell Pro Roller 15',         sku:'BAG-ROLLER-15',    price:129,   stock:'in'  },
  { id:'mouse-ms3320', cat:'accessory',name:'Dell Wireless Mouse MS3320W',sku:'MOU-MS3320W',      price:29,    stock:'in'  },
  { id:'mouse-ms5120', cat:'accessory',name:'Dell Premier Mouse MS5120W', sku:'MOU-MS5120W',      price:59,    stock:'in'  },
  { id:'kb-km5221w',  cat:'accessory', name:'Dell Premier KM5221W Combo', sku:'KB-KM5221W',       price:69,    stock:'in'  },
  { id:'kb-km7321w',  cat:'accessory', name:'Dell Premier KM7321W Combo', sku:'KB-KM7321W',       price:99,    stock:'in'  },
  { id:'headset-wh',  cat:'accessory', name:'Dell Pro Wireless Headset WH5024', sku:'HEAD-WH5024',price:119,   stock:'in'  },
  { id:'webcam-722',  cat:'accessory', name:'Dell UltraSharp Webcam WB7022', sku:'CAM-WB7022',    price:149,   stock:'low' },
  { id:'pwr-130w',    cat:'accessory', name:'Dell 130W USB-C Charger',    sku:'PWR-130W-USBC',    price:69,    stock:'in'  },
  { id:'hub-ua',      cat:'accessory', name:'Dell USB-C Hub 7-in-1',      sku:'HUB-UA7C',         price:49,    stock:'in'  },
  // Bundles
  { id:'bundle-starter', cat:'bundle', name:'New Starter Bundle',         sku:'BUN-STARTER',      price:1199,  stock:'in'  },
  { id:'bundle-remote',  cat:'bundle', name:'Remote Worker Bundle',       sku:'BUN-REMOTE',       price:1699,  stock:'in'  },
  { id:'bundle-exec',    cat:'bundle', name:'Executive Bundle',           sku:'BUN-EXEC',         price:2549,  stock:'in'  },
  { id:'bundle-dev',     cat:'bundle', name:'Developer Bundle',           sku:'BUN-DEV',          price:3199,  stock:'low' },
  // Services
  { id:'svc-m365bp',  cat:'service',   name:'Microsoft 365 Business Premium (annual)', sku:'SVC-M365BP', price:22, stock:'in' },
];

// IDs already in the store (matches the demo storefront)
const INITIAL_STORE_IDS = new Set([
  'lat-3550','lat-5350','lat-5350-16','lat-5450','lat-5550','lat-5550a',
  'lat-7450','lat-9450','mon-p2425h','mon-p2725h','mon-u2724d',
  'dock-wd19tbs','dock-wd22tb4','bag-premier','bag-sleeve',
  'mouse-ms5120','kb-km7321w','bundle-starter','bundle-remote','bundle-exec',
  'svc-m365bp'
]);

// ── STATE ─────────────────────────────────────────────────────────
let storeIds     = new Set(INITIAL_STORE_IDS);
let selectedIds  = new Set();   // checked in catalog panel
let activeCat    = 'all';
let searchQuery  = '';

const CAT_LABELS = {
  all:'All', laptop:'Laptops', monitor:'Monitors',
  dock:'Docks', accessory:'Accessories', bundle:'Bundles', service:'Services'
};

// ── HELPERS ───────────────────────────────────────────────────────
function fmtPrice(n) { return '$' + n.toLocaleString('en-US'); }

function catalogVisible() {
  return SB_CATALOG.filter(p => {
    const catMatch = activeCat === 'all' || p.cat === activeCat;
    const qMatch   = !searchQuery || p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery);
    return catMatch && qMatch;
  });
}

function updateSummary() {
  document.getElementById('prodCatalogCount').textContent = SB_CATALOG.length + ' products in catalog';
  document.getElementById('prodStoreCount').textContent   = storeIds.size + ' in this store';
  document.getElementById('storeFooterLabel').textContent = storeIds.size + ' products visible to customers';
  // Update nav badge
  const badge = document.querySelector('[data-section="products"] .cfg-nav-badge');
  if (badge) badge.textContent = storeIds.size;
  // Update cat footer
  const visible = catalogVisible();
  const catLabel = activeCat === 'all' ? 'products' : CAT_LABELS[activeCat]?.toLowerCase() || 'products';
  const catCount = activeCat === 'all' ? SB_CATALOG.length : SB_CATALOG.filter(p => p.cat === activeCat).length;
  document.getElementById('catFooterLabel').textContent = catCount + ' ' + catLabel + ' in catalog';
}

function updateBulkBar() {
  const bar = document.getElementById('prodBulkBar');
  const cnt = document.getElementById('prodBulkCount');
  if (selectedIds.size > 0) {
    bar.style.display = 'flex';
    cnt.textContent = selectedIds.size + ' selected';
  } else {
    bar.style.display = 'none';
  }
}

// ── RENDER CATALOG ────────────────────────────────────────────────
function renderCatalog() {
  const list = document.getElementById('catalogList');
  if (!list) return;
  const visible = catalogVisible();

  if (visible.length === 0) {
    list.innerHTML = '<div class="prod-empty"><p>No products match your search.</p></div>';
    return;
  }

  list.innerHTML = '';
  visible.forEach(p => {
    const inStore  = storeIds.has(p.id);
    const selected = selectedIds.has(p.id);
    const row = document.createElement('div');
    row.className = 'prod-row' + (inStore ? ' in-store' : '') + (selected ? ' selected' : '');
    row.dataset.id = p.id;

    const stockClass = { in:'stock-in', low:'stock-low', out:'stock-out' }[p.stock] || 'stock-in';
    const stockLabel = { in:'In stock', low:'Low stock', out:'Out of stock' }[p.stock] || 'In stock';

    row.innerHTML = `
      <div class="prod-row-check">${selected ? '✓' : ''}</div>
      <div class="prod-row-thumb">
        <span class="prod-row-thumb-placeholder">${CAT_LABELS[p.cat]?.slice(0,3).toUpperCase() || 'PRD'}</span>
      </div>
      <div class="prod-row-info">
        <div class="prod-row-name">${p.name}</div>
        <div class="prod-row-sku">${p.sku}</div>
      </div>
      <div class="prod-row-right">
        <div class="prod-row-price">${fmtPrice(p.price)}</div>
        <div class="prod-row-stock ${stockClass}">${stockLabel}</div>
        ${inStore
          ? '<div class="prod-row-stock" style="background:var(--good-bg);color:var(--good);width:52px;text-align:center;">Added</div>'
          : '<button class="prod-row-add" title="Add to store">+</button>'
        }
      </div>
    `;

    if (!inStore) {
      // Click row = select/deselect
      row.addEventListener('click', e => {
        if (e.target.closest('.prod-row-add')) return;
        selectedIds.has(p.id) ? selectedIds.delete(p.id) : selectedIds.add(p.id);
        renderCatalog();
        updateBulkBar();
      });

      // + button = instant add single
      const addBtn = row.querySelector('.prod-row-add');
      if (addBtn) {
        addBtn.addEventListener('click', e => {
          e.stopPropagation();
          addToStore([p.id]);
        });
      }
    }

    list.appendChild(row);
  });
}

// ── RENDER STORE ──────────────────────────────────────────────────
function renderStore() {
  const list = document.getElementById('storeList');
  if (!list) return;

  if (storeIds.size === 0) {
    list.innerHTML = `
      <div class="prod-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <p>No products in this store yet.<br>Add products from the catalog on the left.</p>
      </div>`;
    return;
  }

  // Group by category
  const order = ['laptop','monitor','dock','accessory','bundle','service'];
  const groups = {};
  order.forEach(cat => { groups[cat] = []; });

  SB_CATALOG.forEach(p => {
    if (storeIds.has(p.id)) {
      if (!groups[p.cat]) groups[p.cat] = [];
      groups[p.cat].push(p);
    }
  });

  list.innerHTML = '';
  order.forEach(cat => {
    const items = groups[cat];
    if (!items || items.length === 0) return;

    const groupHeader = document.createElement('div');
    groupHeader.className = 'store-group-header';
    groupHeader.innerHTML = `
      <span class="store-group-label">${CAT_LABELS[cat]} (${items.length})</span>
      <button class="store-group-remove" data-cat="${cat}">Remove all ${CAT_LABELS[cat]?.toLowerCase()}</button>
    `;
    groupHeader.querySelector('.store-group-remove').addEventListener('click', () => {
      items.forEach(p => storeIds.delete(p.id));
      renderAll();
      showToast('All ' + CAT_LABELS[cat]?.toLowerCase() + ' removed from store');
    });
    list.appendChild(groupHeader);

    items.forEach(p => {
      const row = document.createElement('div');
      row.className = 'prod-row';
      row.dataset.id = p.id;
      const stockClass = { in:'stock-in', low:'stock-low', out:'stock-out' }[p.stock] || 'stock-in';
      const stockLabel = { in:'In stock', low:'Low', out:'Out' }[p.stock] || '';
      row.innerHTML = `
        <div class="prod-row-thumb">
          <span class="prod-row-thumb-placeholder">${CAT_LABELS[p.cat]?.slice(0,3).toUpperCase()}</span>
        </div>
        <div class="prod-row-info">
          <div class="prod-row-name">${p.name}</div>
          <div class="prod-row-sku">${p.sku}</div>
        </div>
        <div class="prod-row-right">
          <div class="prod-row-price">${fmtPrice(p.price)}</div>
          <div class="prod-row-stock ${stockClass}">${stockLabel}</div>
          <button class="prod-row-remove" title="Remove from store">×</button>
        </div>
      `;
      row.querySelector('.prod-row-remove').addEventListener('click', () => {
        storeIds.delete(p.id);
        renderAll();
        showToast(p.name + ' removed from store');
      });
      list.appendChild(row);
    });
  });
}

function renderAll() {
  renderCatalog();
  renderStore();
  updateSummary();
  updateBulkBar();
}

// ── ADD / REMOVE ──────────────────────────────────────────────────
function addToStore(ids) {
  let added = 0;
  ids.forEach(id => {
    if (!storeIds.has(id)) { storeIds.add(id); added++; }
  });
  selectedIds.clear();
  renderAll();
  if (added > 0) showToast(added + ' product' + (added > 1 ? 's' : '') + ' added to store');
}

// ── CATEGORY TABS ─────────────────────────────────────────────────
document.querySelectorAll('.prod-cat-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.prod-cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeCat = tab.dataset.cat;
    selectedIds.clear();
    renderCatalog();
    updateSummary();
    updateBulkBar();
  });
});

// ── SEARCH ────────────────────────────────────────────────────────
document.getElementById('prodSearch')?.addEventListener('input', e => {
  searchQuery = e.target.value.trim().toLowerCase();
  selectedIds.clear();
  renderCatalog();
  updateBulkBar();
});

// ── BULK ADD SELECTED ─────────────────────────────────────────────
document.getElementById('prodAddSelected')?.addEventListener('click', () => {
  addToStore([...selectedIds]);
});

document.getElementById('prodClearSel')?.addEventListener('click', () => {
  selectedIds.clear();
  renderCatalog();
  updateBulkBar();
});

// ── ADD ALL VISIBLE ───────────────────────────────────────────────
document.getElementById('addAllVisible')?.addEventListener('click', () => {
  const ids = catalogVisible().filter(p => !storeIds.has(p.id)).map(p => p.id);
  addToStore(ids);
});

// ── ADD ALL IN CATEGORY ───────────────────────────────────────────
document.getElementById('addAllCat')?.addEventListener('click', () => {
  const cat = activeCat;
  const ids = SB_CATALOG
    .filter(p => (cat === 'all' || p.cat === cat) && !storeIds.has(p.id))
    .map(p => p.id);
  addToStore(ids);
});

// ── REMOVE ALL FROM STORE ─────────────────────────────────────────
document.getElementById('removeAllStore')?.addEventListener('click', () => {
  if (!confirm('Remove all products from this store?')) return;
  storeIds.clear();
  renderAll();
  showToast('All products removed from store');
});

// ── INIT PRODUCTS ─────────────────────────────────────────────────
function initProducts() {
  renderAll();
}


// ── INIT ──────────────────────────────────────────────────────────
function init() {
  initProducts();
  // Apply default theme to preview
  applyThemeToPreview(THEMES.default);
  // Sync banner fields to preview on load
  pvKicker.textContent   = document.getElementById('bannerKicker')?.value   || '';
  pvHeadline.textContent = document.getElementById('bannerHeadline')?.value || '';
  pvSub.textContent      = document.getElementById('bannerSub')?.value      || '';
  pvCta.textContent      = document.getElementById('bannerCta')?.value      || '';
  pvCta2.textContent     = document.getElementById('bannerCta2')?.value     || '';
  pvStoreName.textContent= document.getElementById('storeName')?.value      || '';
}

init();
