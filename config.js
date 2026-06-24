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

// ── INIT ──────────────────────────────────────────────────────────
function init() {
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
