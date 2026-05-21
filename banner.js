/* ═══════════════════════════════════════════════════
   BANNER CREATOR  — banner.js
   MSP Toolkit  |  PCG IT
═══════════════════════════════════════════════════ */

/* ── A4 at 96 dpi = 794 px (preview / layout unit) ─ */
const A4_W = 794;

/* ── Export modes ───────────────────────────────────
   PRINT = 3.125× → 2481 × n px @ 300 dpi  (matches Xara)
   WEB   = 1×     →  794 × n px @  96 dpi
─────────────────────────────────────────────────── */
const EXPORT_MODES = {
  print: { scale: 3.125, dpi: 300, label: '300 dpi' },
  web:   { scale: 1,     dpi: 96,  label: '96 dpi'  },
};
let exportMode = 'print';

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
const state = {
  company:      '',
  height:       280,
  bgType:       'solid',
  color1:       '#1a3a5c',
  color2:       '#0d2035',
  accentMode:   'none',
  accentPos:    'below',
  accent1:      '#f5a623',
  accent1H:     8,
  accent2:      '#ffffff',
  accent2H:     4,
  logoSrc:      null,
  logoW:        200,
  logoH:        null,
  logoLock:     true,
  logoX:        40,
  logoY:        40,
  logoSelected: false,
};

/* ─────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const inpCompany    = $('inp-company');
const inpHeight     = $('inp-height');
const heightVal     = $('height-val');
const segBgType     = $('seg-bg-type');
const inpColor1     = $('inp-color1');
const inpHex1       = $('inp-hex1');
const gradWrap      = $('grad-color-wrap');
const inpColor2     = $('inp-color2');
const inpHex2       = $('inp-hex2');
const segAccent     = $('seg-accent');
const accentCtrls   = $('accent-controls');
const segAccentPos  = $('seg-accent-pos');
const inpAccent1    = $('inp-accent1');
const inpHexA1      = $('inp-hex-a1');
const inpAh1        = $('inp-ah1');
const ah1Val        = $('ah1-val');
const accent2Wrap   = $('accent2-wrap');
const inpAccent2    = $('inp-accent2');
const inpHexA2      = $('inp-hex-a2');
const inpAh2        = $('inp-ah2');
const ah2Val        = $('ah2-val');
const inpLogo       = $('inp-logo');
const logoDropText  = $('logo-drop-text');
const logoCtrls     = $('logo-controls');
const inpLogoW      = $('inp-logo-w');
const logoWVal      = $('logo-w-val');
const logoHVal      = $('logo-h-val');
const segLogoLock   = $('seg-logo-lock');
const logoHWrap     = $('logo-h-wrap');
const inpLogoH      = $('inp-logo-h');
const logoHHVal     = $('logo-hh-val');
const btnRemoveLogo = $('btn-remove-logo');
const nudgeHint     = $('nudge-hint');
const pvBanner      = $('preview-banner');
const pvMain        = $('pv-main');
const pvLogo        = $('pv-logo');
const previewOuter  = $('preview-outer');
const previewScroll = $('preview-scroll');
const previewDims   = $('preview-dims');
const btnSave       = $('btn-save');
const btnDownload   = $('btn-download');
const segExport     = $('seg-export');
const recentList    = $('recent-list');

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
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
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
   COLOR INPUT SYNC
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

/* Export mode toggle */
initSeg(segExport, val => {
  exportMode = val;
  updateDimLabel();
});

/* ─────────────────────────────────────────────────
   LOGO UPLOAD
───────────────────────────────────────────────── */
inpLogo.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  loadLogoFile(file);
});

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
   LOGO DRAG (preview)
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
  state.logoX = Math.round(dragOriginX + (e.clientX - dragStartX) / scale);
  state.logoY = Math.round(dragOriginY + (e.clientY - dragStartY) / scale);
  positionLogo();
});

document.addEventListener('mouseup', () => {
  if (dragging) { dragging = false; pvLogo.style.cursor = 'grab'; }
});

pvBanner.addEventListener('mousedown', e => {
  if (e.target !== pvLogo) {
    state.logoSelected = false;
    pvLogo.classList.remove('selected');
  }
});

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
  const m = previewOuter.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function positionLogo() {
  pvLogo.style.left = state.logoX + 'px';
  pvLogo.style.top  = state.logoY + 'px';
}

/* ─────────────────────────────────────────────────
   RENDER PREVIEW  (always 1× / 794 px wide)
───────────────────────────────────────────────── */
function render() {
  pvBanner.style.width  = A4_W + 'px';
  pvBanner.style.height = state.height + 'px';
  pvBanner.style.flexDirection = state.accentPos === 'above' ? 'column-reverse' : 'column';

  pvMain.style.background = state.bgType === 'gradient'
    ? `linear-gradient(135deg, ${state.color1}, ${state.color2})`
    : state.color1;

  pvBanner.querySelectorAll('.pv-accent').forEach(el => el.remove());

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

  if (state.logoSrc) {
    pvLogo.src = state.logoSrc;
    pvLogo.style.display = '';
    pvLogo.style.width  = state.logoW + 'px';
    pvLogo.style.height = (state.logoLock || !state.logoH) ? 'auto' : state.logoH + 'px';
    positionLogo();
  } else {
    pvLogo.style.display = 'none';
  }

  scalePreview();
  updateDimLabel();
}

function scalePreview() {
  const avW  = previewScroll.clientWidth  - 48;
  const avH  = previewScroll.clientHeight - 48;
  const scale = Math.min(avW / A4_W, avH / state.height, 1);
  previewOuter.style.transform      = `scale(${scale})`;
  previewOuter.style.width          = A4_W + 'px';
  previewOuter.style.height         = state.height + 'px';
  previewOuter.style.transformOrigin = 'top left';
  previewOuter.style.marginBottom   = ((state.height * scale) - state.height) + 'px';
  previewOuter.style.marginRight    = ((A4_W * scale) - A4_W) + 'px';
}

window.addEventListener('resize', scalePreview);

function updateDimLabel() {
  const m    = EXPORT_MODES[exportMode];
  const outW = Math.round(A4_W * m.scale);
  const outH = Math.round(state.height * m.scale);
  previewDims.textContent = `preview ${A4_W}\u00d7${state.height}px  \u2502  export ${outW}\u00d7${outH}px @ ${m.dpi}dpi`;
}

/* ─────────────────────────────────────────────────
   PNG pHYs CHUNK  — bake DPI into file metadata
   Without this chunk, tools like Photoshop default
   to 72 dpi. With it, the file is correctly labelled
   at 300 dpi (or 96), matching Xara-quality exports.
───────────────────────────────────────────────── */
function injectPHYs(dataUrl, dpi) {
  // dataUrl → binary array
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const src = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) src[i] = bin.charCodeAt(i);

  // pixels per metre
  const ppm = Math.round(dpi * 39.3701);

  function u32be(n) {
    return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
  }

  // CRC-32 table
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i;
      for (let j = 0; j < 8; j++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
      t[i] = v;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // pHYs chunk: length(4) + "pHYs"(4) + Xppm(4) + Yppm(4) + unit(1=metre)(1) + CRC(4) = 21 bytes
  const typeBytes = [0x70, 0x48, 0x59, 0x73]; // "pHYs"
  const data      = new Uint8Array([...u32be(ppm), ...u32be(ppm), 1]);
  const crcVal    = crc32(new Uint8Array([...typeBytes, ...data]));
  const chunk     = new Uint8Array([...u32be(9), ...typeBytes, ...data, ...u32be(crcVal)]);

  // Insert after PNG signature (8) + IHDR chunk (4+4+13+4 = 25) = byte 33
  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.slice(0, 33));
  out.set(chunk, 33);
  out.set(src.slice(33), 33 + chunk.length);

  // Binary → base64 data URL
  let s = '';
  for (let i = 0; i < out.length; i++) s += String.fromCharCode(out[i]);
  return 'data:image/png;base64,' + btoa(s);
}

/* ─────────────────────────────────────────────────
   CANVAS EXPORT
───────────────────────────────────────────────── */
async function exportToPNG(overrideMode) {
  const m   = EXPORT_MODES[overrideMode || exportMode];
  const sc  = m.scale;
  const outW = Math.round(A4_W         * sc);
  const outH = Math.round(state.height * sc);

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Accent heights in output pixels
  const accH1    = (state.accentMode !== 'none')   ? Math.round(state.accent1H * sc) : 0;
  const accH2    = (state.accentMode === 'double')  ? Math.round(state.accent2H * sc) : 0;
  const totalAcc = accH1 + accH2;
  const mainH    = outH - totalAcc;
  const mainY    = state.accentPos === 'above' ? totalAcc : 0;

  // Main background
  if (state.bgType === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, outW, outH);
    g.addColorStop(0, state.color1);
    g.addColorStop(1, state.color2);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = state.color1;
  }
  ctx.fillRect(0, mainY, outW, mainH);

  // Accent bands
  if (state.accentMode !== 'none') {
    if (state.accentPos === 'below') {
      ctx.fillStyle = state.accent1;
      ctx.fillRect(0, mainH, outW, accH1);
      if (state.accentMode === 'double') {
        ctx.fillStyle = state.accent2;
        ctx.fillRect(0, mainH + accH1, outW, accH2);
      }
    } else {
      ctx.fillStyle = state.accent1;
      ctx.fillRect(0, 0, outW, accH1);
      if (state.accentMode === 'double') {
        ctx.fillStyle = state.accent2;
        ctx.fillRect(0, accH1, outW, accH2);
      }
    }
  }

  // Logo — drawn at full resolution, scaled proportionally
  if (state.logoSrc) {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dispW = Math.round(state.logoW * sc);
        const dispH = (state.logoLock || !state.logoH)
          ? Math.round(img.naturalHeight * (dispW / img.naturalWidth))
          : Math.round(state.logoH * sc);
        ctx.drawImage(img, Math.round(state.logoX * sc), Math.round(state.logoY * sc), dispW, dispH);
        resolve();
      };
      img.onerror = reject;
      img.src = state.logoSrc;
    });
  }

  const raw = canvas.toDataURL('image/png', 1.0);
  return injectPHYs(raw, m.dpi);
}

/* ─────────────────────────────────────────────────
   DOWNLOAD
───────────────────────────────────────────────── */
btnDownload.addEventListener('click', async () => {
  const m = EXPORT_MODES[exportMode];
  btnDownload.textContent = '⏳ Generating…';
  btnDownload.disabled = true;
  try {
    const dataUrl = await exportToPNG();
    const a    = document.createElement('a');
    const name = (state.company || 'banner').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    a.download = `${name}_banner_${m.dpi}dpi.png`;
    a.href = dataUrl;
    a.click();
    const outW = Math.round(A4_W * m.scale);
    const outH = Math.round(state.height * m.scale);
    toast(`Downloaded ${outW}\u00d7${outH}px @ ${m.dpi} dpi`);
  } catch (err) {
    console.error(err);
    toast('Export failed — see console');
  } finally {
    btnDownload.textContent = '⬇ Download PNG';
    btnDownload.disabled = false;
  }
});

/* ─────────────────────────────────────────────────
   LOCAL STORAGE
───────────────────────────────────────────────── */
const LS_KEY      = 'bannerCreator_recents';
const MAX_RECENTS = 5;

function getSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

btnSave.addEventListener('click', async () => {
  if (!state.company.trim()) { toast('Enter a company name first'); return; }
  btnSave.textContent = '⏳ Saving…';
  btnSave.disabled = true;
  try {
    // Thumbnails always at 1× for speed / storage
    const thumb   = await exportToPNG('web');
    const recents = getSaved().filter(r => r.company !== state.company.trim());
    recents.unshift({
      company: state.company.trim(),
      savedAt: Date.now(),
      thumb,
      state: JSON.stringify({ ...state, logoSrc: state.logoSrc }),
    });
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar();
    toast(`"${state.company}" saved`);
  } catch (err) {
    console.error(err);
    toast('Save failed');
  } finally {
    btnSave.textContent = '💾 Save';
    btnSave.disabled = false;
  }
});

function loadEntry(entry) {
  Object.assign(state, JSON.parse(entry.state));
  syncUIFromState();
  render();
}

function deleteEntry(company) {
  const recents = getSaved().filter(r => r.company !== company);
  localStorage.setItem(LS_KEY, JSON.stringify(recents));
  renderSidebar();
  toast(`Deleted "${company}"`);
}

function renderSidebar() {
  const recents = getSaved();
  recentList.innerHTML = '';
  if (!recents.length) {
    recentList.innerHTML = '<p class="empty-note">No saved banners yet.</p>';
    return;
  }
  recents.forEach(entry => {
    const card   = document.createElement('div');
    card.className = 'recent-card';

    const delBtn = document.createElement('button');
    delBtn.className = 'recent-card-del';
    delBtn.title = 'Delete';
    delBtn.textContent = '\u2715';
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
   SYNC UI FROM STATE
───────────────────────────────────────────────── */
function syncUIFromState() {
  inpCompany.value = state.company;
  inpHeight.value  = state.height;
  heightVal.textContent = state.height + 'px';

  setSegActive(segBgType, state.bgType);
  gradWrap.style.display = state.bgType === 'gradient' ? '' : 'none';

  inpColor1.value = state.color1; inpHex1.value = state.color1;
  inpColor2.value = state.color2; inpHex2.value = state.color2;

  setSegActive(segAccent, state.accentMode);
  accentCtrls.style.display = state.accentMode === 'none' ? 'none' : '';
  accent2Wrap.style.display  = state.accentMode === 'double' ? '' : 'none';
  setSegActive(segAccentPos, state.accentPos);
  inpAccent1.value = state.accent1; inpHexA1.value = state.accent1;
  inpAh1.value = state.accent1H;    ah1Val.textContent = state.accent1H + 'px';
  inpAccent2.value = state.accent2; inpHexA2.value = state.accent2;
  inpAh2.value = state.accent2H;    ah2Val.textContent = state.accent2H + 'px';

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
  segEl.querySelectorAll('.seg').forEach(btn => btn.classList.toggle('active', btn.dataset.val === val));
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
renderSidebar();
render();
