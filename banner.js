/* ═══════════════════════════════════════════════════
   BANNER CREATOR  — banner.js
   MSP Toolkit  |  PCG IT
═══════════════════════════════════════════════════ */

/* ── A4 at 96 dpi = 794 px ──────────────────────── */
const A4_W = 794;

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
const state = {
  company:     '',
  height:      280,
  bgType:      'solid',          // 'solid' | 'gradient'
  color1:      '#1a3a5c',
  color2:      '#0d2035',
  accentMode:  'none',           // 'none' | 'single' | 'double'
  accentPos:   'below',          // 'below' | 'above'
  accent1:     '#f5a623',
  accent1H:    8,
  accent2:     '#ffffff',
  accent2H:    4,
  logoSrc:     null,             // data URL
  logoW:       200,
  logoH:       null,             // null = auto (aspect locked)
  logoLock:    true,
  logoX:       40,
  logoY:       40,
  logoSelected: false,
};

/* ─────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const inpCompany   = $('inp-company');
const inpHeight    = $('inp-height');
const heightVal    = $('height-val');
const segBgType    = $('seg-bg-type');
const inpColor1    = $('inp-color1');
const inpHex1      = $('inp-hex1');
const gradWrap     = $('grad-color-wrap');
const inpColor2    = $('inp-color2');
const inpHex2      = $('inp-hex2');
const segAccent    = $('seg-accent');
const accentCtrls  = $('accent-controls');
const segAccentPos = $('seg-accent-pos');
const inpAccent1   = $('inp-accent1');
const inpHexA1     = $('inp-hex-a1');
const inpAh1       = $('inp-ah1');
const ah1Val       = $('ah1-val');
const accent2Wrap  = $('accent2-wrap');
const inpAccent2   = $('inp-accent2');
const inpHexA2     = $('inp-hex-a2');
const inpAh2       = $('inp-ah2');
const ah2Val       = $('ah2-val');
const inpLogo      = $('inp-logo');
const logoDropText = $('logo-drop-text');
const logoCtrls    = $('logo-controls');
const inpLogoW     = $('inp-logo-w');
const logoWVal     = $('logo-w-val');
const logoHVal     = $('logo-h-val');
const segLogoLock  = $('seg-logo-lock');
const logoHWrap    = $('logo-h-wrap');
const inpLogoH     = $('inp-logo-h');
const logoHHVal    = $('logo-hh-val');
const btnRemoveLogo= $('btn-remove-logo');
const nudgeHint    = $('nudge-hint');
const pvBanner     = $('preview-banner');
const pvMain       = $('pv-main');
const pvLogo       = $('pv-logo');
const previewOuter = $('preview-outer');
const previewScroll= $('preview-scroll');
const previewDims  = $('preview-dims');
const btnSave      = $('btn-save');
const btnDownload  = $('btn-download');
const recentList   = $('recent-list');

/* ─────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  let t = $('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ─────────────────────────────────────────────────
   SEGMENTED CONTROL HELPER
───────────────────────────────────────────────── */
function initSeg(el, onChange) {
  el.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}

/* ─────────────────────────────────────────────────
   COLOR INPUT SYNC  (color picker ↔ hex text)
───────────────────────────────────────────────── */
function syncColor(picker, hexInput, key) {
  picker.addEventListener('input', () => {
    state[key] = picker.value;
    hexInput.value = picker.value;
    render();
  });
  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      state[key] = v;
      picker.value = v;
      render();
    }
  });
}

/* ─────────────────────────────────────────────────
   INIT CONTROLS
───────────────────────────────────────────────── */
inpCompany.addEventListener('input', () => { state.company = inpCompany.value; });

inpHeight.addEventListener('input', () => {
  state.height = +inpHeight.value;
  heightVal.textContent = state.height + 'px';
  render();
});

initSeg(segBgType, val => {
  state.bgType = val;
  gradWrap.style.display = val === 'gradient' ? '' : 'none';
  render();
});

syncColor(inpColor1, inpHex1, 'color1');
syncColor(inpColor2, inpHex2, 'color2');

initSeg(segAccent, val => {
  state.accentMode = val;
  accentCtrls.style.display = val === 'none' ? 'none' : '';
  accent2Wrap.style.display  = val === 'double' ? '' : 'none';
  render();
});

initSeg(segAccentPos, val => { state.accentPos = val; render(); });

syncColor(inpAccent1, inpHexA1, 'accent1');
syncColor(inpAccent2, inpHexA2, 'accent2');

inpAh1.addEventListener('input', () => {
  state.accent1H = +inpAh1.value;
  ah1Val.textContent = state.accent1H + 'px';
  render();
});
inpAh2.addEventListener('input', () => {
  state.accent2H = +inpAh2.value;
  ah2Val.textContent = state.accent2H + 'px';
  render();
});

/* ─────────────────────────────────────────────────
   LOGO UPLOAD
───────────────────────────────────────────────── */
inpLogo.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  loadLogoFile(file);
});

// Drag-drop onto the label
const logoDrop = $('logo-drop');
logoDrop.addEventListener('dragover', e => { e.preventDefault(); logoDrop.style.borderColor = 'var(--accent)'; });
logoDrop.addEventListener('dragleave', () => { logoDrop.style.borderColor = ''; });
logoDrop.addEventListener('drop', e => {
  e.preventDefault();
  logoDrop.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadLogoFile(file);
});

function loadLogoFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      state.logoSrc = ev.target.result;
      state.logoW   = Math.min(200, img.naturalWidth);
      state.logoH   = null;
      state.logoX   = 40;
      state.logoY   = Math.round((state.height - state.logoW / (img.naturalWidth / img.naturalHeight)) / 2);
      inpLogoW.value = state.logoW;
      logoWVal.textContent = state.logoW + 'px';
      logoHVal.textContent = 'auto';
      logoCtrls.style.display = '';
      nudgeHint.style.display = '';
      logoDropText.textContent = file.name;
      render();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

inpLogoW.addEventListener('input', () => {
  state.logoW = +inpLogoW.value;
  logoWVal.textContent = state.logoW + 'px';
  if (state.logoLock) logoHVal.textContent = 'auto';
  render();
});

initSeg(segLogoLock, val => {
  state.logoLock = val === 'locked';
  logoHWrap.style.display = state.logoLock ? 'none' : '';
  logoHVal.textContent = state.logoLock ? 'auto' : (state.logoH || 100) + 'px';
  if (!state.logoLock && !state.logoH) state.logoH = 100;
  render();
});

inpLogoH.addEventListener('input', () => {
  state.logoH = +inpLogoH.value;
  logoHHVal.textContent = state.logoH + 'px';
  render();
});

btnRemoveLogo.addEventListener('click', () => {
  state.logoSrc = null;
  pvLogo.style.display = 'none';
  logoCtrls.style.display = 'none';
  nudgeHint.style.display = 'none';
  logoDropText.textContent = 'Click or drag to upload logo';
  inpLogo.value = '';
  render();
});

/* ─────────────────────────────────────────────────
   LOGO DRAG-TO-POSITION (on preview)
───────────────────────────────────────────────── */
let dragging = false, dragStartX, dragStartY, dragOriginX, dragOriginY;

pvLogo.addEventListener('mousedown', e => {
  if (!state.logoSrc) return;
  e.preventDefault();
  dragging = true;
  dragStartX  = e.clientX;
  dragStartY  = e.clientY;
  dragOriginX = state.logoX;
  dragOriginY = state.logoY;
  state.logoSelected = true;
  pvLogo.classList.add('selected');
  pvLogo.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const scale = getScale();
  const dx = (e.clientX - dragStartX) / scale;
  const dy = (e.clientY - dragStartY) / scale;
  state.logoX = Math.round(dragOriginX + dx);
  state.logoY = Math.round(dragOriginY + dy);
  positionLogo();
});

document.addEventListener('mouseup', () => {
  if (dragging) {
    dragging = false;
    pvLogo.style.cursor = 'grab';
  }
});

// Click outside logo → deselect
pvBanner.addEventListener('mousedown', e => {
  if (e.target !== pvLogo) {
    state.logoSelected = false;
    pvLogo.classList.remove('selected');
  }
});

/* ── Arrow-key nudge ────────────────────────────── */
document.addEventListener('keydown', e => {
  if (!state.logoSelected || !state.logoSrc) return;
  const step = e.shiftKey ? 10 : 1;
  let moved = true;
  switch (e.key) {
    case 'ArrowLeft':  state.logoX -= step; break;
    case 'ArrowRight': state.logoX += step; break;
    case 'ArrowUp':    state.logoY -= step; break;
    case 'ArrowDown':  state.logoY += step; break;
    default: moved = false;
  }
  if (moved) { e.preventDefault(); positionLogo(); }
});

function getScale() {
  const transform = previewOuter.style.transform;
  const m = transform && transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function positionLogo() {
  pvLogo.style.left = state.logoX + 'px';
  pvLogo.style.top  = state.logoY + 'px';
}

/* ─────────────────────────────────────────────────
   RENDER PREVIEW
───────────────────────────────────────────────── */
function render() {
  /* Banner outer size */
  pvBanner.style.width  = A4_W + 'px';
  pvBanner.style.height = state.height + 'px';
  pvBanner.style.flexDirection = state.accentPos === 'above' ? 'column-reverse' : 'column';

  /* Main background */
  if (state.bgType === 'gradient') {
    pvMain.style.background = `linear-gradient(135deg, ${state.color1}, ${state.color2})`;
  } else {
    pvMain.style.background = state.color1;
  }

  /* Remove old accent bands */
  pvBanner.querySelectorAll('.pv-accent').forEach(el => el.remove());

  /* Add new accent bands */
  if (state.accentMode !== 'none') {
    const a1 = document.createElement('div');
    a1.className = 'pv-accent';
    a1.style.height = state.accent1H + 'px';
    a1.style.background = state.accent1;
    pvBanner.appendChild(a1);

    if (state.accentMode === 'double') {
      const a2 = document.createElement('div');
      a2.className = 'pv-accent';
      a2.style.height = state.accent2H + 'px';
      a2.style.background = state.accent2;
      pvBanner.appendChild(a2);
    }
  }

  /* Logo */
  if (state.logoSrc) {
    pvLogo.src = state.logoSrc;
    pvLogo.style.display = '';
    pvLogo.style.width  = state.logoW + 'px';
    pvLogo.style.height = (state.logoLock || !state.logoH) ? 'auto' : state.logoH + 'px';
    positionLogo();
  } else {
    pvLogo.style.display = 'none';
  }

  /* Scale preview to fit available area */
  scalePreview();
  updateDimLabel();
}

function scalePreview() {
  const avW = previewScroll.clientWidth  - 48;
  const avH = previewScroll.clientHeight - 48;
  const scaleW = avW / A4_W;
  const scaleH = avH / state.height;
  const scale  = Math.min(scaleW, scaleH, 1);  // never upscale
  previewOuter.style.transform = `scale(${scale})`;
  previewOuter.style.width  = A4_W + 'px';
  previewOuter.style.height = state.height + 'px';
  previewOuter.style.transformOrigin = 'top left';
  // Adjust scroll container so the scaled element takes real space
  previewOuter.style.marginBottom = ((state.height * scale) - state.height) + 'px';
  previewOuter.style.marginRight  = ((A4_W     * scale) - A4_W) + 'px';
}

window.addEventListener('resize', scalePreview);

function updateDimLabel() {
  previewDims.textContent = `${A4_W} × ${state.height} px`;
}

/* ─────────────────────────────────────────────────
   CANVAS EXPORT  — high-quality PNG
───────────────────────────────────────────────── */
async function exportToPNG() {
  const canvas = document.createElement('canvas');
  canvas.width  = A4_W;
  canvas.height = state.height;
  const ctx = canvas.getContext('2d');

  /* Main background */
  if (state.bgType === 'gradient') {
    const grd = ctx.createLinearGradient(0, 0, A4_W * Math.cos(Math.PI * 135 / 180) + A4_W/2, state.height * Math.sin(Math.PI * 135 / 180) + state.height/2);
    // Simple 135° gradient
    const g2 = ctx.createLinearGradient(0, 0, A4_W, state.height);
    g2.addColorStop(0, state.color1);
    g2.addColorStop(1, state.color2);
    ctx.fillStyle = g2;
  } else {
    ctx.fillStyle = state.color1;
  }

  /* Accent heights */
  const accH1 = (state.accentMode !== 'none') ? state.accent1H : 0;
  const accH2 = (state.accentMode === 'double') ? state.accent2H : 0;
  const totalAccH = accH1 + accH2;
  const mainH = state.height - totalAccH;

  const mainY = state.accentPos === 'above' ? totalAccH : 0;
  ctx.fillRect(0, mainY, A4_W, mainH);

  /* Accent bands */
  if (state.accentMode !== 'none') {
    if (state.accentPos === 'below') {
      ctx.fillStyle = state.accent1;
      ctx.fillRect(0, mainH, A4_W, accH1);
      if (state.accentMode === 'double') {
        ctx.fillStyle = state.accent2;
        ctx.fillRect(0, mainH + accH1, A4_W, accH2);
      }
    } else {
      /* above */
      ctx.fillStyle = state.accent1;
      ctx.fillRect(0, 0, A4_W, accH1);
      if (state.accentMode === 'double') {
        ctx.fillStyle = state.accent2;
        ctx.fillRect(0, accH1, A4_W, accH2);
      }
    }
  }

  /* Logo */
  if (state.logoSrc) {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dispW = state.logoW;
        let dispH;
        if (state.logoLock || !state.logoH) {
          dispH = Math.round(img.naturalHeight * (dispW / img.naturalWidth));
        } else {
          dispH = state.logoH;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, state.logoX, state.logoY, dispW, dispH);
        resolve();
      };
      img.onerror = reject;
      img.src = state.logoSrc;
    });
  }

  return canvas.toDataURL('image/png', 1.0);
}

/* ─────────────────────────────────────────────────
   DOWNLOAD
───────────────────────────────────────────────── */
btnDownload.addEventListener('click', async () => {
  btnDownload.textContent = '⏳ Generating…';
  btnDownload.disabled = true;
  try {
    const dataUrl = await exportToPNG();
    const a = document.createElement('a');
    const name = (state.company || 'banner').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    a.download = `${name}_banner.png`;
    a.href = dataUrl;
    a.click();
    toast('✅ PNG downloaded!');
  } catch (err) {
    console.error(err);
    toast('❌ Export failed — see console');
  } finally {
    btnDownload.textContent = '⬇ Download PNG';
    btnDownload.disabled = false;
  }
});

/* ─────────────────────────────────────────────────
   LOCAL STORAGE — save / load
───────────────────────────────────────────────── */
const LS_KEY = 'bannerCreator_recents';
const MAX_RECENTS = 5;

function getSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

btnSave.addEventListener('click', async () => {
  if (!state.company.trim()) {
    toast('⚠ Enter a company name first');
    return;
  }
  btnSave.textContent = '⏳ Saving…';
  btnSave.disabled = true;
  try {
    const thumb = await exportToPNG();
    const recents = getSaved().filter(r => r.company !== state.company.trim());
    const entry = {
      company:   state.company.trim(),
      savedAt:   Date.now(),
      thumb,
      state:     JSON.stringify({ ...state, logoSrc: state.logoSrc }),
    };
    recents.unshift(entry);
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar();
    toast(`💾 "${state.company}" saved`);
  } catch (err) {
    console.error(err);
    toast('❌ Save failed');
  } finally {
    btnSave.textContent = '💾 Save';
    btnSave.disabled = false;
  }
});

function loadEntry(entry) {
  const s = JSON.parse(entry.state);
  Object.assign(state, s);
  syncUIFromState();
  render();
}

function deleteEntry(company) {
  const recents = getSaved().filter(r => r.company !== company);
  localStorage.setItem(LS_KEY, JSON.stringify(recents));
  renderSidebar();
  toast(`🗑 Deleted "${company}"`);
}

function renderSidebar() {
  const recents = getSaved();
  recentList.innerHTML = '';
  if (!recents.length) {
    recentList.innerHTML = '<p class="empty-note">No saved banners yet.</p>';
    return;
  }
  recents.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'recent-card';

    const delBtn = document.createElement('button');
    delBtn.className = 'recent-card-del';
    delBtn.title = 'Delete';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteEntry(entry.company); });

    const thumb = document.createElement('img');
    thumb.className = 'recent-card-thumb';
    thumb.src = entry.thumb;
    thumb.alt = entry.company;

    const name = document.createElement('div');
    name.className = 'recent-card-name';
    name.textContent = entry.company;

    const date = document.createElement('div');
    date.className = 'recent-card-date';
    date.textContent = new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    card.appendChild(delBtn);
    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(date);
    card.addEventListener('click', () => loadEntry(entry));
    recentList.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────
   SYNC UI FROM STATE  (used when loading saved)
───────────────────────────────────────────────── */
function syncUIFromState() {
  inpCompany.value  = state.company;
  inpHeight.value   = state.height;
  heightVal.textContent = state.height + 'px';

  /* bg type */
  setSegActive(segBgType, state.bgType);
  gradWrap.style.display = state.bgType === 'gradient' ? '' : 'none';

  /* colors */
  inpColor1.value = state.color1; inpHex1.value = state.color1;
  inpColor2.value = state.color2; inpHex2.value = state.color2;

  /* accent */
  setSegActive(segAccent, state.accentMode);
  accentCtrls.style.display = state.accentMode === 'none' ? 'none' : '';
  accent2Wrap.style.display  = state.accentMode === 'double' ? '' : 'none';
  setSegActive(segAccentPos, state.accentPos);
  inpAccent1.value = state.accent1; inpHexA1.value = state.accent1;
  inpAh1.value = state.accent1H;    ah1Val.textContent = state.accent1H + 'px';
  inpAccent2.value = state.accent2; inpHexA2.value = state.accent2;
  inpAh2.value = state.accent2H;    ah2Val.textContent = state.accent2H + 'px';

  /* logo */
  if (state.logoSrc) {
    pvLogo.src = state.logoSrc;
    pvLogo.style.display = '';
    logoCtrls.style.display = '';
    nudgeHint.style.display = '';
    inpLogoW.value = state.logoW;
    logoWVal.textContent = state.logoW + 'px';
    state.logoLock = state.logoLock !== false;
    setSegActive(segLogoLock, state.logoLock ? 'locked' : 'free');
    logoHWrap.style.display = state.logoLock ? 'none' : '';
    if (!state.logoLock && state.logoH) {
      inpLogoH.value = state.logoH;
      logoHHVal.textContent = state.logoH + 'px';
    }
  } else {
    logoCtrls.style.display = 'none';
    nudgeHint.style.display = 'none';
  }
}

function setSegActive(segEl, val) {
  segEl.querySelectorAll('.seg').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === val);
  });
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
renderSidebar();
render();
