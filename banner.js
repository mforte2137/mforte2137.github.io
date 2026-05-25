/* ═══════════════════════════════════════════════════
   BANNER CREATOR  — banner.js   Phase 2
   MSP Toolkit  |  PCG IT
═══════════════════════════════════════════════════ */

const A4_W = 794;

const EXPORT_MODES = {
  print: { scale: 3.125, dpi: 300 },
  web:   { scale: 1,     dpi: 96  },
};
let exportMode = 'print';

/* ── Mode ────────────────────────────────────────── */
let currentMode = 'logo'; // 'logo' | 'header'

/* ── Corporate swatches ─────────────────────────── */
const SWATCHES = [
  { hex: '#1a3a5c', label: 'Navy'             },
  { hex: '#0c8fd9', label: 'Corporate Blue'   },
  { hex: '#007b8a', label: 'Teal'             },
  { hex: '#2d6a4f', label: 'Forest Green'     },
  { hex: '#6b2737', label: 'Burgundy'         },
  { hex: '#2e2e2e', label: 'Charcoal'         },
  { hex: '#8a9bb0', label: 'Warm Grey'        },
  { hex: '#be5103', label: 'Corporate Orange' },
];

/* ─────────────────────────────────────────────────
   DEFAULT STATE
───────────────────────────────────────────────── */
function defaultState() {
  return {
    mode:         'logo',
    company:      '',
    height:       280,
    radius:       0,
    bgType:       'solid',
    gradDir:      '135',
    color1:       '#1a3a5c',
    color2:       '#0d2035',
    borderOn:     false,
    borderW:      2,
    borderColor:  '#f5a623',
    accentMode:   'none',
    accentPos:    'below',
    accent1:      '#f5a623',
    accent1H:     8,
    accent2:      '#c8c8c8',
    accent2H:     4,
    shadowOn:     false,
    shadowX:      4,
    shadowY:      4,
    shadowBlur:   12,
    shadowColor:  '#000000',
    textOn:       false,
    textStr:      '',
    textFont:     'Arial, sans-serif',
    textWeight:   '700',
    textSize:     36,
    textAlign:    'left',
    textColor:    '#ffffff',
    textX:        40,
    textY:        40,
    textSelected: false,
    logoSrc:      null,
    logoW:        200,
    logoH:        null,
    logoLock:     true,
    logoX:        40,
    logoY:        40,
    logoSelected: false,
    _cleared:     false,
  };
}

let state = defaultState();

/* ─────────────────────────────────────────────────
   DOM
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const inpCompany      = $('inp-company');
const inpHeight       = $('inp-height');
const heightVal       = $('height-val');
const inpRadius       = $('inp-radius');
const radiusVal       = $('radius-val');
const segBgTypeLogo   = $('seg-bg-type-logo');
const segBgTypeHeader = $('seg-bg-type-header');
const gradDirWrap     = $('grad-dir-wrap');
const segGradDir      = $('seg-grad-dir');
const inpColor1       = $('inp-color1');
const inpHex1         = $('inp-hex1');
const color1Label     = $('color1-label');
const gradColorWrap   = $('grad-color-wrap');
const inpColor2       = $('inp-color2');
const inpHex2         = $('inp-hex2');
const color2Label     = $('color2-label');
const inpBorder       = $('inp-border');
const borderCtrls     = $('border-controls');
const inpBorderW      = $('inp-border-w');
const borderWVal      = $('border-w-val');
const inpBorderColor  = $('inp-border-color');
const inpHexBorder    = $('inp-hex-border');
const accentSection   = $('accent-section');
const segAccent       = $('seg-accent');
const accentCtrls     = $('accent-controls');
const segAccentPos    = $('seg-accent-pos');
const inpAccent1      = $('inp-accent1');
const inpHexA1        = $('inp-hex-a1');
const inpAh1          = $('inp-ah1');
const ah1Val          = $('ah1-val');
const accent2Wrap     = $('accent2-wrap');
const inpAccent2      = $('inp-accent2');
const inpHexA2        = $('inp-hex-a2');
const inpAh2          = $('inp-ah2');
const ah2Val          = $('ah2-val');
const inpShadow       = $('inp-shadow');
const shadowCtrls     = $('shadow-controls');
const inpShadowX      = $('inp-shadow-x');
const shadowXVal      = $('shadow-x-val');
const inpShadowY      = $('inp-shadow-y');
const shadowYVal      = $('shadow-y-val');
const inpShadowBlur   = $('inp-shadow-blur');
const shadowBlurVal   = $('shadow-blur-val');
const inpShadowColor  = $('inp-shadow-color');
const inpHexShadow    = $('inp-hex-shadow');
const inpTextOn       = $('inp-text-on');
const textCtrls       = $('text-controls');
const inpText         = $('inp-text');
const inpFont         = $('inp-font');
const segFontWeight   = $('seg-font-weight');
const inpFontSize     = $('inp-font-size');
const fontSizeVal     = $('font-size-val');
const segTextAlign    = $('seg-text-align');
const inpTextColor    = $('inp-text-color');
const inpHexText      = $('inp-hex-text');
const logoSection     = $('logo-section');
const inpLogo         = $('inp-logo');
const logoDropText    = $('logo-drop-text');
const logoCtrls       = $('logo-controls');
const inpLogoW        = $('inp-logo-w');
const logoWVal        = $('logo-w-val');
const logoHVal        = $('logo-h-val');
const segLogoLock     = $('seg-logo-lock');
const logoHWrap       = $('logo-h-wrap');
const inpLogoH        = $('inp-logo-h');
const logoHHVal       = $('logo-hh-val');
const btnRemoveLogo   = $('btn-remove-logo');
const nudgeHint       = $('nudge-hint');
const pvBanner        = $('preview-banner');
const pvMain          = $('pv-main');
const pvLogo          = $('pv-logo');
const pvText          = $('pv-text');
const pvBorderEl      = $('pv-border');
const previewOuter    = $('preview-outer');
const previewScroll   = $('preview-scroll');
const previewDims     = $('preview-dims');
const btnSave         = $('btn-save');
const btnClear        = $('btn-clear');
const btnDownload     = $('btn-download');
const segExport       = $('seg-export');
const recentList      = $('recent-list');
const tabLogo         = $('tab-logo');
const tabHeader       = $('tab-header');

/* ─────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────────
   SEGMENTED CONTROLS
───────────────────────────────────────────────── */
function initSeg(el, onChange) {
  if (!el) return;
  el.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.val);
    });
  });
}
function setSegActive(el, val) {
  if (!el) return;
  el.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}

/* ─────────────────────────────────────────────────
   COLOR SYNC
───────────────────────────────────────────────── */
function syncColor(picker, hexInput, key, swatchRowId) {
  const update = (val) => {
    state[key] = val;
    state._cleared = false;
    picker.value = val;
    hexInput.value = val;
    if (swatchRowId) highlightSwatch(swatchRowId, val);
    render();
  };
  picker.addEventListener('input', () => update(picker.value));
  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) update(v);
  });
}

/* ─────────────────────────────────────────────────
   SWATCHES
───────────────────────────────────────────────── */
function buildSwatches(containerId, pickerEl, hexEl, stateKey) {
  const row = $(containerId);
  if (!row) return;
  SWATCHES.forEach(sw => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.title = sw.label;
    btn.dataset.hex = sw.hex;
    btn.style.background = sw.hex;
    btn.addEventListener('click', () => {
      state[stateKey] = sw.hex;
      state._cleared = false;
      pickerEl.value = sw.hex;
      hexEl.value = sw.hex;
      highlightSwatch(containerId, sw.hex);
      render(true);
    });
    row.appendChild(btn);
  });
}
function highlightSwatch(containerId, hex) {
  const row = $(containerId);
  if (!row) return;
  row.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.hex.toLowerCase() === hex.toLowerCase())
  );
}

/* ─────────────────────────────────────────────────
   MODE SWITCH
───────────────────────────────────────────────── */
function setMode(mode) {
  currentMode = mode;
  state.mode  = mode;
  tabLogo.classList.toggle('active',   mode === 'logo');
  tabHeader.classList.toggle('active', mode === 'header');

  // bg type selectors
  segBgTypeLogo.style.display   = mode === 'logo'   ? '' : 'none';
  segBgTypeHeader.style.display = mode === 'header' ? '' : 'none';

  // accents only for logo mode
  accentSection.style.display = mode === 'logo' ? '' : 'none';

  // logo upload only for logo mode
  logoSection.style.display = mode === 'logo' ? '' : 'none';

  // if switching to header, reset logo-only bgType
  if (mode === 'header' && state.bgType === 'gradient') {
    // keep as-is (linear is valid in header too)
  }
  if (mode === 'header' && state.bgType === 'solid') {
    // fine
  }
  if (mode === 'logo' && (state.bgType === 'spotlight' || state.bgType === 'streaks')) {
    state.bgType = 'solid';
    setSegActive(segBgTypeLogo, 'solid');
  }

  updateBgControls();
  render();
}

tabLogo.addEventListener('click',   () => setMode('logo'));
tabHeader.addEventListener('click', () => setMode('header'));

/* ─────────────────────────────────────────────────
   BG TYPE CONTROLS VISIBILITY
───────────────────────────────────────────────── */
function updateBgControls() {
  const t = state.bgType;
  const needsColor2  = (t === 'gradient' || t === 'spotlight');
  const needsGradDir = (t === 'gradient');

  gradColorWrap.style.display = needsColor2  ? '' : 'none';
  gradDirWrap.style.display   = needsGradDir ? '' : 'none';

  // Update labels
  if (t === 'spotlight') {
    color1Label.textContent = 'Base Color';
    color2Label.textContent = 'Highlight Color';
  } else if (t === 'gradient') {
    color1Label.textContent = 'Gradient Start';
    color2Label.textContent = 'Gradient End';
  } else {
    color1Label.textContent = 'Main Color';
  }
}

/* ─────────────────────────────────────────────────
   CLEAR
───────────────────────────────────────────────── */
btnClear.addEventListener('click', () => {
  const savedMode = currentMode;
  state = defaultState();
  state._cleared = true;
  state.mode = savedMode;
  inpLogo.value = '';
  logoDropText.textContent = 'Click or drag to upload logo';
  syncUIFromState();
  render();
  toast('Canvas cleared');
});

/* ─────────────────────────────────────────────────
   INIT CONTROLS
───────────────────────────────────────────────── */
inpCompany.addEventListener('input', () => { state.company = inpCompany.value; });

inpHeight.addEventListener('input', () => {
  state.height = +inpHeight.value;
  heightVal.textContent = state.height + 'px';
  render();
});

inpRadius.addEventListener('input', () => {
  state.radius = +inpRadius.value;
  radiusVal.textContent = state.radius + 'px';
  render();
});

// Logo mode bg
initSeg(segBgTypeLogo, val => {
  state.bgType = val;
  updateBgControls();
  render();
});

// Header mode bg
initSeg(segBgTypeHeader, val => {
  state.bgType = val;
  updateBgControls();
  render();
});

// Gradient direction
initSeg(segGradDir, val => { state.gradDir = val; render(); });

syncColor(inpColor1, inpHex1, 'color1', 'swatches-color1');
syncColor(inpColor2, inpHex2, 'color2', 'swatches-color2');

// Border
inpBorder.addEventListener('change', () => {
  state.borderOn = inpBorder.checked;
  borderCtrls.style.display = state.borderOn ? '' : 'none';
  render();
});
inpBorderW.addEventListener('input', () => {
  state.borderW = +inpBorderW.value;
  borderWVal.textContent = state.borderW + 'px';
  render();
});
syncColor(inpBorderColor, inpHexBorder, 'borderColor', 'swatches-border');

// Accents
initSeg(segAccent, val => {
  state.accentMode = val;
  accentCtrls.style.display = val === 'none' ? 'none' : '';
  accent2Wrap.style.display  = val === 'double' ? '' : 'none';
  render();
});
initSeg(segAccentPos, val => { state.accentPos = val; render(); });
syncColor(inpAccent1, inpHexA1, 'accent1', 'swatches-accent1');
syncColor(inpAccent2, inpHexA2, 'accent2', 'swatches-accent2');
inpAh1.addEventListener('input', () => {
  state.accent1H = +inpAh1.value; ah1Val.textContent = state.accent1H + 'px'; render();
});
inpAh2.addEventListener('input', () => {
  state.accent2H = +inpAh2.value; ah2Val.textContent = state.accent2H + 'px'; render();
});

// Shadow
inpShadow.addEventListener('change', () => {
  state.shadowOn = inpShadow.checked;
  shadowCtrls.style.display = state.shadowOn ? '' : 'none';
  render();
});
inpShadowX.addEventListener('input', () => { state.shadowX = +inpShadowX.value; shadowXVal.textContent = state.shadowX + 'px'; render(); });
inpShadowY.addEventListener('input', () => { state.shadowY = +inpShadowY.value; shadowYVal.textContent = state.shadowY + 'px'; render(); });
inpShadowBlur.addEventListener('input', () => { state.shadowBlur = +inpShadowBlur.value; shadowBlurVal.textContent = state.shadowBlur + 'px'; render(); });
syncColor(inpShadowColor, inpHexShadow, 'shadowColor', null);

// Text
inpTextOn.addEventListener('change', () => {
  state.textOn = inpTextOn.checked;
  textCtrls.style.display = state.textOn ? '' : 'none';
  pvText.style.display = (state.textOn && state.textStr) ? '' : 'none';
  render();
});
inpText.addEventListener('input', () => { state.textStr = inpText.value; render(); });
inpFont.addEventListener('change', () => { state.textFont = inpFont.value; render(); });
initSeg(segFontWeight, val => { state.textWeight = val; render(); });
inpFontSize.addEventListener('input', () => { state.textSize = +inpFontSize.value; fontSizeVal.textContent = state.textSize + 'px'; render(); });
initSeg(segTextAlign, val => { state.textAlign = val; render(); });
syncColor(inpTextColor, inpHexText, 'textColor', 'swatches-text');

/* ─────────────────────────────────────────────────
   LOGO UPLOAD
───────────────────────────────────────────────── */
inpLogo.addEventListener('change', e => { if (e.target.files[0]) loadLogoFile(e.target.files[0]); });
const logoDrop = $('logo-drop');
logoDrop.addEventListener('dragover', e => { e.preventDefault(); logoDrop.style.borderColor = 'var(--accent)'; });
logoDrop.addEventListener('dragleave', () => { logoDrop.style.borderColor = ''; });
logoDrop.addEventListener('drop', e => {
  e.preventDefault(); logoDrop.style.borderColor = '';
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) loadLogoFile(f);
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
      inpLogoW.value = state.logoW; logoWVal.textContent = state.logoW + 'px';
      logoHVal.textContent = 'auto';
      logoCtrls.style.display = ''; nudgeHint.style.display = '';
      logoDropText.textContent = file.name;
      render();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
inpLogoW.addEventListener('input', () => { state.logoW = +inpLogoW.value; logoWVal.textContent = state.logoW + 'px'; render(); });
initSeg(segLogoLock, val => {
  state.logoLock = val === 'locked';
  logoHWrap.style.display = state.logoLock ? 'none' : '';
  logoHVal.textContent = state.logoLock ? 'auto' : (state.logoH || 100) + 'px';
  if (!state.logoLock && !state.logoH) state.logoH = 100;
  render();
});
inpLogoH.addEventListener('input', () => { state.logoH = +inpLogoH.value; logoHHVal.textContent = state.logoH + 'px'; render(); });
btnRemoveLogo.addEventListener('click', () => {
  state.logoSrc = null;
  pvLogo.style.display = 'none'; logoCtrls.style.display = 'none'; nudgeHint.style.display = 'none';
  logoDropText.textContent = 'Click or drag to upload logo'; inpLogo.value = ''; render();
});

/* ─────────────────────────────────────────────────
   DRAG + NUDGE (logo & text)
───────────────────────────────────────────────── */
let dragging = false, dragTarget = null;
let dragStartX, dragStartY, dragOriginX, dragOriginY;

function startDrag(e, target, xKey, yKey) {
  e.preventDefault(); dragging = true;
  dragTarget = { target, xKey, yKey };
  dragStartX = e.clientX; dragStartY = e.clientY;
  dragOriginX = state[xKey]; dragOriginY = state[yKey];
  target.style.cursor = 'grabbing';
}
pvLogo.addEventListener('mousedown', e => {
  if (!state.logoSrc) return;
  state.logoSelected = true; state.textSelected = false;
  pvLogo.classList.add('selected'); pvText.classList.remove('selected');
  startDrag(e, pvLogo, 'logoX', 'logoY');
});
pvText.addEventListener('mousedown', e => {
  if (!state.textOn || !state.textStr) return;
  state.textSelected = true; state.logoSelected = false;
  pvText.classList.add('selected'); pvLogo.classList.remove('selected');
  startDrag(e, pvText, 'textX', 'textY');
});
document.addEventListener('mousemove', e => {
  if (!dragging || !dragTarget) return;
  const sc = getScale();
  state[dragTarget.xKey] = Math.round(dragOriginX + (e.clientX - dragStartX) / sc);
  state[dragTarget.yKey] = Math.round(dragOriginY + (e.clientY - dragStartY) / sc);
  dragTarget.target.style.left = state[dragTarget.xKey] + 'px';
  dragTarget.target.style.top  = state[dragTarget.yKey] + 'px';
});
document.addEventListener('mouseup', () => {
  if (dragging && dragTarget) dragTarget.target.style.cursor = 'grab';
  dragging = false; dragTarget = null;
});
pvBanner.addEventListener('mousedown', e => {
  if (e.target !== pvLogo && e.target !== pvText) {
    state.logoSelected = false; state.textSelected = false;
    pvLogo.classList.remove('selected'); pvText.classList.remove('selected');
  }
});
document.addEventListener('keydown', e => {
  const step = e.shiftKey ? 10 : 1; let moved = false;
  if (state.logoSelected && state.logoSrc)  moved = nudgeXY(e.key, step, 'logoX', 'logoY');
  else if (state.textSelected && state.textOn) moved = nudgeXY(e.key, step, 'textX', 'textY');
  if (moved) {
    e.preventDefault();
    if (state.logoSelected) { pvLogo.style.left = state.logoX + 'px'; pvLogo.style.top = state.logoY + 'px'; }
    else { pvText.style.left = state.textX + 'px'; pvText.style.top = state.textY + 'px'; }
  }
});
function nudgeXY(key, step, xk, yk) {
  if (key==='ArrowLeft')  { state[xk]-=step; return true; }
  if (key==='ArrowRight') { state[xk]+=step; return true; }
  if (key==='ArrowUp')    { state[yk]-=step; return true; }
  if (key==='ArrowDown')  { state[yk]+=step; return true; }
  return false;
}
function getScale() {
  const m = previewOuter.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

/* ─────────────────────────────────────────────────
   BACKGROUND DRAWING — canvas helper
   Used by both render (CSS preview approx) and export (precise canvas)
───────────────────────────────────────────────── */
function drawBackground(ctx, w, h, s) {
  switch (s.bgType) {
    case 'solid':
      ctx.fillStyle = s.color1;
      ctx.fillRect(0, 0, w, h);
      break;

    case 'gradient': {
      const deg = parseFloat(s.gradDir || 135);
      const rad = (deg - 90) * Math.PI / 180;
      const cx = w / 2, cy = h / 2;
      const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
      const x1 = cx - Math.cos(rad) * len / 2;
      const y1 = cy - Math.sin(rad) * len / 2;
      const x2 = cx + Math.cos(rad) * len / 2;
      const y2 = cy + Math.sin(rad) * len / 2;
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, s.color1);
      g.addColorStop(1, s.color2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'spotlight': {
      // Dark base fill
      ctx.fillStyle = s.color1;
      ctx.fillRect(0, 0, w, h);
      // Radial glow from center-right area
      const gr = ctx.createRadialGradient(w * 0.65, h * 0.4, 0, w * 0.65, h * 0.4, Math.max(w, h) * 0.75);
      gr.addColorStop(0,   hexToRgba(s.color2, 0.75));
      gr.addColorStop(0.4, hexToRgba(s.color2, 0.25));
      gr.addColorStop(1,   hexToRgba(s.color2, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'streaks': {
      // Dark base
      ctx.fillStyle = s.color1;
      ctx.fillRect(0, 0, w, h);
      // Draw light ray streaks emanating from right side
      const rays = 14;
      ctx.save();
      ctx.translate(w * 1.1, h * 0.5);
      for (let i = 0; i < rays; i++) {
        const angle  = ((i / rays) - 0.5) * Math.PI * 0.7;
        const spread = 0.012 + Math.random() * 0.018;
        const len2   = Math.max(w, h) * 1.6;
        const bright = 0.08 + Math.random() * 0.22;
        // Hue-shift the streak color slightly for variety
        const hShift = (i % 3 === 0) ? shiftHue(s.color2, 30) : (i % 3 === 1) ? s.color2 : shiftHue(s.color2, -25);
        ctx.save();
        ctx.rotate(angle);
        const sg = ctx.createLinearGradient(0, 0, -len2, 0);
        sg.addColorStop(0,   hexToRgba(hShift, bright));
        sg.addColorStop(0.4, hexToRgba(hShift, bright * 0.5));
        sg.addColorStop(1,   hexToRgba(hShift, 0));
        ctx.fillStyle = sg;
        // Streak as a thin tapered quad
        const halfW = len2 * spread;
        ctx.beginPath();
        ctx.moveTo(0, -1);
        ctx.lineTo(-len2, -halfW);
        ctx.lineTo(-len2,  halfW);
        ctx.lineTo(0, 1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // Subtle vignette overlay
      const vg = ctx.createRadialGradient(w*0.5, h*0.5, h*0.2, w*0.5, h*0.5, Math.max(w,h)*0.9);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}

/* ── Color utilities ────────────────────────────── */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function shiftHue(hex, degrees) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
  if(d!==0){
    if(max===r) h=((g-b)/d+6)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h/=6;
  }
  h=(h+(degrees/360)+1)%1;
  const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t2=v*(1-(1-f)*s);
  let nr,ng,nb;
  switch(i%6){case 0:nr=v;ng=t2;nb=p;break;case 1:nr=q;ng=v;nb=p;break;case 2:nr=p;ng=v;nb=t2;break;case 3:nr=p;ng=q;nb=v;break;case 4:nr=t2;ng=p;nb=v;break;default:nr=v;ng=p;nb=q;}
  return '#'+[nr,ng,nb].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

/* ─────────────────────────────────────────────────
   PREVIEW  — off-screen canvas → dataURL → CSS bg
   This gives a pixel-perfect preview including
   spotlight and streaks without relying on CSS hacks
───────────────────────────────────────────────── */
function renderPreviewBg() {
  const canvas = document.createElement('canvas');
  canvas.width  = A4_W;
  canvas.height = state.height;
  const ctx = canvas.getContext('2d');

  if (state.mode === 'logo') {
    // Logo mode: draw main + accents
    const accH1    = state.accentMode !== 'none'   ? state.accent1H : 0;
    const accH2    = state.accentMode === 'double'  ? state.accent2H : 0;
    const totalAcc = accH1 + accH2;
    const mainH    = state.height - totalAcc;
    const mainY    = state.accentPos === 'above' ? totalAcc : 0;

    // clip main area for drawBackground
    ctx.save();
    ctx.beginPath(); ctx.rect(0, mainY, A4_W, mainH); ctx.clip();
    const s2 = {...state, bgType: state.bgType};
    drawBackground(ctx, A4_W, mainH, s2);
    ctx.restore();

    if (state.accentMode !== 'none') {
      if (state.accentPos === 'below') {
        ctx.fillStyle = state.accent1; ctx.fillRect(0, mainH, A4_W, accH1);
        if (state.accentMode === 'double') { ctx.fillStyle = state.accent2; ctx.fillRect(0, mainH+accH1, A4_W, accH2); }
      } else {
        ctx.fillStyle = state.accent1; ctx.fillRect(0, 0, A4_W, accH1);
        if (state.accentMode === 'double') { ctx.fillStyle = state.accent2; ctx.fillRect(0, accH1, A4_W, accH2); }
      }
    }
  } else {
    // Header mode: full-size bg
    drawBackground(ctx, A4_W, state.height, state);
  }
  return canvas.toDataURL('image/png');
}

/* ─────────────────────────────────────────────────
   RENDER PREVIEW
───────────────────────────────────────────────── */
function render(force) {
  if (force) state._cleared = false;
  const isEmpty = state._cleared === true
    && !state.logoSrc && !state.textOn
    && state.accentMode === 'none' && !state.shadowOn && !state.borderOn;

  pvBanner.style.width        = A4_W + 'px';
  pvBanner.style.height       = state.height + 'px';
  pvBanner.style.borderRadius = state.radius + 'px';
  pvBanner.style.overflow     = 'hidden';
  pvBanner.style.flexDirection = state.accentPos === 'above' ? 'column-reverse' : 'column';

  // Shadow
  pvBanner.style.filter    = state.shadowOn
    ? `drop-shadow(${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${state.shadowColor})`
    : 'none';
  pvBanner.style.boxShadow = isEmpty ? 'none' : '0 8px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06)';
  pvBanner.classList.toggle('empty', isEmpty);

  if (!isEmpty) {
    // Use off-screen canvas to render bg (handles spotlight/streaks perfectly)
    pvMain.style.background    = 'none';
    pvMain.style.backgroundSize = '';
    pvBanner.style.background  = `url(${renderPreviewBg()}) center/cover no-repeat`;
    pvBanner.style.backgroundSize = '100% 100%';
    pvMain.style.flex = '1';
  } else {
    pvBanner.style.background = '';
  }

  // Remove accent divs (not needed when bg is a single canvas image)
  pvBanner.querySelectorAll('.pv-accent').forEach(el => el.remove());

  // Border overlay
  if (state.borderOn && !isEmpty) {
    pvBorderEl.style.border       = `${state.borderW}px solid ${state.borderColor}`;
    pvBorderEl.style.borderRadius = state.radius + 'px';
    pvBorderEl.style.display      = '';
  } else {
    pvBorderEl.style.display = 'none';
  }

  // Logo
  if (state.logoSrc && currentMode === 'logo') {
    pvLogo.src = state.logoSrc;
    pvLogo.style.display = '';
    pvLogo.style.width  = state.logoW + 'px';
    pvLogo.style.height = (state.logoLock || !state.logoH) ? 'auto' : state.logoH + 'px';
    pvLogo.style.left = state.logoX + 'px';
    pvLogo.style.top  = state.logoY + 'px';
  } else {
    pvLogo.style.display = 'none';
  }

  // Text overlay
  if (state.textOn && state.textStr) {
    pvText.style.display     = '';
    pvText.style.fontFamily  = state.textFont;
    pvText.style.fontWeight  = state.textWeight;
    pvText.style.fontSize    = state.textSize + 'px';
    pvText.style.color       = state.textColor;
    pvText.style.textAlign   = state.textAlign;
    pvText.style.left = state.textX + 'px';
    pvText.style.top  = state.textY + 'px';
    pvText.textContent = state.textStr;
  } else {
    pvText.style.display = 'none';
  }

  scalePreview();
  updateDimLabel();
}

function scalePreview() {
  const avW  = previewScroll.clientWidth  - 48;
  const avH  = previewScroll.clientHeight - 48;
  const scale = Math.min(avW / A4_W, avH / state.height, 1);
  previewOuter.style.transform       = `scale(${scale})`;
  previewOuter.style.width           = A4_W + 'px';
  previewOuter.style.height          = state.height + 'px';
  previewOuter.style.transformOrigin = 'top left';
  previewOuter.style.marginBottom    = ((state.height * scale) - state.height) + 'px';
  previewOuter.style.marginRight     = ((A4_W * scale) - A4_W) + 'px';
}
window.addEventListener('resize', scalePreview);

function updateDimLabel() {
  const m = EXPORT_MODES[exportMode];
  const outW = Math.round(A4_W * m.scale);
  const outH = Math.round(state.height * m.scale);
  previewDims.textContent = `preview ${A4_W}\u00d7${state.height}px  \u2502  export ${outW}\u00d7${outH}px @ ${m.dpi}dpi`;
}

/* ─────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────── */
async function exportToPNG(overrideMode) {
  const m   = EXPORT_MODES[overrideMode || exportMode];
  const sc  = m.scale;
  const outW = Math.round(A4_W         * sc);
  const outH = Math.round(state.height * sc);
  const r    = Math.round(state.radius * sc);

  // ── Content canvas (no shadow) ───────────────
  const content = document.createElement('canvas');
  content.width  = outW;
  content.height = outH;
  const cc = content.getContext('2d');
  cc.imageSmoothingEnabled = true;
  cc.imageSmoothingQuality = 'high';

  // Clip to rounded rect
  if (r > 0) {
    cc.beginPath(); cc.roundRect(0, 0, outW, outH, r); cc.clip();
  }

  if (state.mode === 'logo') {
    const accH1    = state.accentMode !== 'none'   ? Math.round(state.accent1H * sc) : 0;
    const accH2    = state.accentMode === 'double'  ? Math.round(state.accent2H * sc) : 0;
    const totalAcc = accH1 + accH2;
    const mainH    = outH - totalAcc;
    const mainY    = state.accentPos === 'above' ? totalAcc : 0;

    // Draw main bg into clipped region
    cc.save();
    cc.beginPath(); cc.rect(0, mainY, outW, mainH); cc.clip();
    drawBackground(cc, outW, mainH, state);
    cc.restore();

    if (state.accentMode !== 'none') {
      if (state.accentPos === 'below') {
        cc.fillStyle = state.accent1; cc.fillRect(0, mainH, outW, accH1);
        if (state.accentMode === 'double') { cc.fillStyle = state.accent2; cc.fillRect(0, mainH+accH1, outW, accH2); }
      } else {
        cc.fillStyle = state.accent1; cc.fillRect(0, 0, outW, accH1);
        if (state.accentMode === 'double') { cc.fillStyle = state.accent2; cc.fillRect(0, accH1, outW, accH2); }
      }
    }
  } else {
    drawBackground(cc, outW, outH, state);
  }

  // Logo (logo mode only)
  if (state.logoSrc && state.mode === 'logo') {
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dw = Math.round(state.logoW * sc);
        const dh = (state.logoLock || !state.logoH)
          ? Math.round(img.naturalHeight * (dw / img.naturalWidth))
          : Math.round(state.logoH * sc);
        cc.drawImage(img, Math.round(state.logoX * sc), Math.round(state.logoY * sc), dw, dh);
        resolve();
      };
      img.onerror = reject; img.src = state.logoSrc;
    });
  }

  // Text overlay
  if (state.textOn && state.textStr) {
    cc.font          = `${state.textWeight} ${Math.round(state.textSize * sc)}px ${state.textFont}`;
    cc.fillStyle     = state.textColor;
    cc.textAlign     = state.textAlign;
    cc.textBaseline  = 'top';
    const tx = state.textAlign === 'center' ? outW / 2
             : state.textAlign === 'right'  ? outW - Math.round(state.textX * sc)
             : Math.round(state.textX * sc);
    cc.fillText(state.textStr, tx, Math.round(state.textY * sc));
  }

  // Border (drawn last on content canvas, inside the clip)
  if (state.borderOn) {
    const bw = Math.round(state.borderW * sc);
    cc.strokeStyle = state.borderColor;
    cc.lineWidth   = bw * 2; // *2 because half is clipped away by roundRect
    if (r > 0) {
      cc.beginPath(); cc.roundRect(0, 0, outW, outH, r); cc.stroke();
    } else {
      cc.strokeRect(0, 0, outW, outH);
    }
  }

  // ── Shadow compositing ────────────────────────
  const pad = state.shadowOn
    ? Math.round((Math.abs(state.shadowX) + Math.abs(state.shadowY) + state.shadowBlur * 2) * sc)
    : 0;

  const canvas = document.createElement('canvas');
  canvas.width  = outW + pad * 2;
  canvas.height = outH + pad * 2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (state.shadowOn) {
    ctx.shadowOffsetX = state.shadowX   * sc;
    ctx.shadowOffsetY = state.shadowY   * sc;
    ctx.shadowBlur    = state.shadowBlur * sc;
    ctx.shadowColor   = state.shadowColor;
  }
  ctx.drawImage(content, pad, pad);

  return injectPHYs(canvas.toDataURL('image/png', 1.0), m.dpi);
}

/* ─────────────────────────────────────────────────
   PNG pHYs DPI chunk
───────────────────────────────────────────────── */
function injectPHYs(dataUrl, dpi) {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const src = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) src[i] = bin.charCodeAt(i);
  const ppm = Math.round(dpi * 39.3701);
  function u32be(n) { return [(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff]; }
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for(let i=0;i<256;i++){let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>>1)):(v>>>1);t[i]=v;}
    return t;
  })();
  function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=crcTable[(c^bytes[i])&0xff]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  const typeBytes=[0x70,0x48,0x59,0x73];
  const data=new Uint8Array([...u32be(ppm),...u32be(ppm),1]);
  const crcVal=crc32(new Uint8Array([...typeBytes,...data]));
  const chunk=new Uint8Array([...u32be(9),...typeBytes,...data,...u32be(crcVal)]);
  const out=new Uint8Array(src.length+chunk.length);
  out.set(src.slice(0,33));out.set(chunk,33);out.set(src.slice(33),33+chunk.length);
  let s='';for(let i=0;i<out.length;i++)s+=String.fromCharCode(out[i]);
  return 'data:image/png;base64,'+btoa(s);
}

/* ─────────────────────────────────────────────────
   DOWNLOAD
───────────────────────────────────────────────── */
btnDownload.addEventListener('click', async () => {
  const m = EXPORT_MODES[exportMode];
  btnDownload.textContent = '⏳ Generating…'; btnDownload.disabled = true;
  try {
    const dataUrl = await exportToPNG();
    const a = document.createElement('a');
    const name = (state.company || 'banner').replace(/[^a-z0-9_\-]/gi,'_').toLowerCase();
    const modeTag = state.mode === 'header' ? 'header' : 'banner';
    a.download = `${name}_${modeTag}_${m.dpi}dpi.png`;
    a.href = dataUrl; a.click();
    toast(`Downloaded ${Math.round(A4_W*m.scale)}\u00d7${Math.round(state.height*m.scale)}px @ ${m.dpi}dpi`);
  } catch(err) { console.error(err); toast('Export failed — see console');
  } finally { btnDownload.textContent = '⬇ Download PNG'; btnDownload.disabled = false; }
});

initSeg(segExport, val => { exportMode = val; updateDimLabel(); });

/* ─────────────────────────────────────────────────
   LOCAL STORAGE
───────────────────────────────────────────────── */
const LS_KEY = 'bannerCreator_recents';
const MAX_RECENTS = 5;
function getSaved(){try{return JSON.parse(localStorage.getItem(LS_KEY))||[];}catch{return[];}}

btnSave.addEventListener('click', async () => {
  if (!state.company.trim()) { toast('Enter a company name first'); return; }
  btnSave.textContent = '⏳ Saving…'; btnSave.disabled = true;
  try {
    const thumb = await exportToPNG('web');
    const recents = getSaved().filter(r => r.company !== state.company.trim());
    recents.unshift({ company: state.company.trim(), savedAt: Date.now(), thumb,
      mode: state.mode, state: JSON.stringify({...state, logoSrc: state.logoSrc}) });
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar(); toast(`"${state.company}" saved`);
  } catch(err){ console.error(err); toast('Save failed');
  } finally { btnSave.textContent = '💾 Save'; btnSave.disabled = false; }
});

function loadEntry(entry) {
  Object.assign(state, JSON.parse(entry.state));
  inpLogo.value = '';
  if (state.logoSrc) logoDropText.textContent = 'Logo loaded from save';
  currentMode = state.mode || 'logo';
  syncUIFromState(); render();
}
function deleteEntry(company) {
  localStorage.setItem(LS_KEY, JSON.stringify(getSaved().filter(r=>r.company!==company)));
  renderSidebar(); toast(`Deleted "${company}"`);
}
function renderSidebar() {
  const recents = getSaved();
  recentList.innerHTML = '';
  if (!recents.length) { recentList.innerHTML = '<p class="empty-note">No saved banners yet.</p>'; return; }
  recents.forEach(entry => {
    const card = document.createElement('div'); card.className = 'recent-card';
    const modeTag = document.createElement('div');
    modeTag.style.cssText = 'font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:3px';
    modeTag.textContent = entry.mode === 'header' ? '✦ Header' : '🖼 Logo Banner';
    const del = document.createElement('button'); del.className='recent-card-del'; del.title='Delete'; del.textContent='\u2715';
    del.addEventListener('click', e=>{e.stopPropagation();deleteEntry(entry.company);});
    const thumb = document.createElement('img'); thumb.className='recent-card-thumb'; thumb.src=entry.thumb; thumb.alt=entry.company;
    const name  = document.createElement('div'); name.className='recent-card-name'; name.textContent=entry.company;
    const date  = document.createElement('div'); date.className='recent-card-date';
    date.textContent=new Date(entry.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    card.append(del,modeTag,thumb,name,date);
    card.addEventListener('click',()=>loadEntry(entry));
    recentList.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────
   SYNC UI FROM STATE
───────────────────────────────────────────────── */
function syncUIFromState() {
  // Mode tabs
  tabLogo.classList.toggle('active',   currentMode === 'logo');
  tabHeader.classList.toggle('active', currentMode === 'header');
  segBgTypeLogo.style.display   = currentMode === 'logo'   ? '' : 'none';
  segBgTypeHeader.style.display = currentMode === 'header' ? '' : 'none';
  accentSection.style.display   = currentMode === 'logo'   ? '' : 'none';
  logoSection.style.display     = currentMode === 'logo'   ? '' : 'none';

  inpCompany.value = state.company;
  inpHeight.value  = state.height;  heightVal.textContent  = state.height  + 'px';
  inpRadius.value  = state.radius;  radiusVal.textContent  = state.radius  + 'px';

  // bg type
  if (currentMode === 'logo') setSegActive(segBgTypeLogo, state.bgType);
  else setSegActive(segBgTypeHeader, state.bgType);
  setSegActive(segGradDir, state.gradDir || '135');
  updateBgControls();

  inpColor1.value=state.color1; inpHex1.value=state.color1; highlightSwatch('swatches-color1',state.color1);
  inpColor2.value=state.color2; inpHex2.value=state.color2; highlightSwatch('swatches-color2',state.color2);

  inpBorder.checked = state.borderOn;
  borderCtrls.style.display = state.borderOn ? '' : 'none';
  inpBorderW.value = state.borderW; borderWVal.textContent = state.borderW + 'px';
  inpBorderColor.value=state.borderColor; inpHexBorder.value=state.borderColor;
  highlightSwatch('swatches-border', state.borderColor);

  setSegActive(segAccent, state.accentMode);
  accentCtrls.style.display = state.accentMode==='none'?'none':'';
  accent2Wrap.style.display  = state.accentMode==='double'?'':'none';
  setSegActive(segAccentPos, state.accentPos);
  inpAccent1.value=state.accent1; inpHexA1.value=state.accent1; highlightSwatch('swatches-accent1',state.accent1);
  inpAh1.value=state.accent1H; ah1Val.textContent=state.accent1H+'px';
  inpAccent2.value=state.accent2; inpHexA2.value=state.accent2; highlightSwatch('swatches-accent2',state.accent2);
  inpAh2.value=state.accent2H; ah2Val.textContent=state.accent2H+'px';

  inpShadow.checked=state.shadowOn; shadowCtrls.style.display=state.shadowOn?'':'none';
  inpShadowX.value=state.shadowX; shadowXVal.textContent=state.shadowX+'px';
  inpShadowY.value=state.shadowY; shadowYVal.textContent=state.shadowY+'px';
  inpShadowBlur.value=state.shadowBlur; shadowBlurVal.textContent=state.shadowBlur+'px';
  inpShadowColor.value=state.shadowColor; inpHexShadow.value=state.shadowColor;

  inpTextOn.checked=state.textOn; textCtrls.style.display=state.textOn?'':'none';
  inpText.value=state.textStr; inpFont.value=state.textFont;
  setSegActive(segFontWeight,state.textWeight);
  inpFontSize.value=state.textSize; fontSizeVal.textContent=state.textSize+'px';
  setSegActive(segTextAlign,state.textAlign);
  inpTextColor.value=state.textColor; inpHexText.value=state.textColor; highlightSwatch('swatches-text',state.textColor);

  if (state.logoSrc && currentMode==='logo') {
    pvLogo.src=state.logoSrc; pvLogo.style.display='';
    logoCtrls.style.display=''; nudgeHint.style.display='';
    inpLogoW.value=state.logoW; logoWVal.textContent=state.logoW+'px';
    state.logoLock=state.logoLock!==false;
    setSegActive(segLogoLock,state.logoLock?'locked':'free');
    logoHWrap.style.display=state.logoLock?'none':'';
    if(!state.logoLock&&state.logoH){inpLogoH.value=state.logoH;logoHHVal.textContent=state.logoH+'px';}
  } else {
    logoCtrls.style.display='none'; nudgeHint.style.display='none'; pvLogo.style.display='none';
  }
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
buildSwatches('swatches-color1',  inpColor1,      inpHex1,       'color1');
buildSwatches('swatches-color2',  inpColor2,      inpHex2,       'color2');
buildSwatches('swatches-accent1', inpAccent1,     inpHexA1,      'accent1');
buildSwatches('swatches-accent2', inpAccent2,     inpHexA2,      'accent2');
buildSwatches('swatches-border',  inpBorderColor, inpHexBorder,  'borderColor');
buildSwatches('swatches-text',    inpTextColor,   inpHexText,    'textColor');

highlightSwatch('swatches-color1',  state.color1);
highlightSwatch('swatches-color2',  state.color2);
highlightSwatch('swatches-border',  state.borderColor);
highlightSwatch('swatches-text',    state.textColor);

renderSidebar();
syncUIFromState();
render();
