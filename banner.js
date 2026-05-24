/* ═══════════════════════════════════════════════════
   BANNER CREATOR  — banner.js   Phase 1
   MSP Toolkit  |  PCG IT
═══════════════════════════════════════════════════ */

const A4_W = 794;

const EXPORT_MODES = {
  print: { scale: 3.125, dpi: 300 },
  web:   { scale: 1,     dpi: 96  },
};
let exportMode = 'print';

/* ── Corporate color swatches ───────────────────────
   8 presets: navy, slate blue, teal, forest green,
   burgundy, charcoal, warm grey, corporate orange
─────────────────────────────────────────────────── */
const SWATCHES = [
  { hex: '#1a3a5c', label: 'Navy'             },
  { hex: '#3b5998', label: 'Slate Blue'       },
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
    company:      '',
    height:       280,
    radius:       0,
    bgType:       'solid',
    color1:       '#1a3a5c',
    color2:       '#0d2035',
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
  };
}

let state = defaultState();

/* ─────────────────────────────────────────────────
   DOM
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const inpCompany    = $('inp-company');
const inpHeight     = $('inp-height');
const heightVal     = $('height-val');
const inpRadius     = $('inp-radius');
const radiusVal     = $('radius-val');
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
const inpShadow     = $('inp-shadow');
const shadowCtrls   = $('shadow-controls');
const inpShadowX    = $('inp-shadow-x');
const shadowXVal    = $('shadow-x-val');
const inpShadowY    = $('inp-shadow-y');
const shadowYVal    = $('shadow-y-val');
const inpShadowBlur = $('inp-shadow-blur');
const shadowBlurVal = $('shadow-blur-val');
const inpShadowColor= $('inp-shadow-color');
const inpHexShadow  = $('inp-hex-shadow');
const inpTextOn     = $('inp-text-on');
const textCtrls     = $('text-controls');
const inpText       = $('inp-text');
const inpFont       = $('inp-font');
const segFontWeight = $('seg-font-weight');
const inpFontSize   = $('inp-font-size');
const fontSizeVal   = $('font-size-val');
const segTextAlign  = $('seg-text-align');
const inpTextColor  = $('inp-text-color');
const inpHexText    = $('inp-hex-text');
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
const pvText        = $('pv-text');
const previewOuter  = $('preview-outer');
const previewScroll = $('preview-scroll');
const previewDims   = $('preview-dims');
const btnSave       = $('btn-save');
const btnClear      = $('btn-clear');
const btnDownload   = $('btn-download');
const segExport     = $('seg-export');
const recentList    = $('recent-list');

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
   SEGMENTED CONTROL
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
function setSegActive(el, val) {
  el.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}

/* ─────────────────────────────────────────────────
   COLOR SYNC  (picker ↔ hex text)
───────────────────────────────────────────────── */
function syncColor(picker, hexInput, key, swatchRowId) {
  const update = (val) => {
    state[key] = val;
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
      pickerEl.value = sw.hex;
      hexEl.value = sw.hex;
      highlightSwatch(containerId, sw.hex);
      render();
    });
    row.appendChild(btn);
  });
}

function highlightSwatch(containerId, hex) {
  const row = $(containerId);
  if (!row) return;
  row.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.hex.toLowerCase() === hex.toLowerCase());
  });
}

/* ─────────────────────────────────────────────────
   CLEAR
───────────────────────────────────────────────── */
btnClear.addEventListener('click', () => {
  state = defaultState();
  // reset logo file input
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

initSeg(segBgType, val => {
  state.bgType = val;
  gradWrap.style.display = val === 'gradient' ? '' : 'none';
  render();
});

syncColor(inpColor1, inpHex1, 'color1', 'swatches-color1');
syncColor(inpColor2, inpHex2, 'color2', 'swatches-color2');

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
  state.accent1H = +inpAh1.value;
  ah1Val.textContent = state.accent1H + 'px';
  render();
});
inpAh2.addEventListener('input', () => {
  state.accent2H = +inpAh2.value;
  ah2Val.textContent = state.accent2H + 'px';
  render();
});

/* Shadow */
inpShadow.addEventListener('change', () => {
  state.shadowOn = inpShadow.checked;
  shadowCtrls.style.display = state.shadowOn ? '' : 'none';
  render();
});
inpShadowX.addEventListener('input', () => {
  state.shadowX = +inpShadowX.value;
  shadowXVal.textContent = state.shadowX + 'px';
  render();
});
inpShadowY.addEventListener('input', () => {
  state.shadowY = +inpShadowY.value;
  shadowYVal.textContent = state.shadowY + 'px';
  render();
});
inpShadowBlur.addEventListener('input', () => {
  state.shadowBlur = +inpShadowBlur.value;
  shadowBlurVal.textContent = state.shadowBlur + 'px';
  render();
});
syncColor(inpShadowColor, inpHexShadow, 'shadowColor', null);

/* Text overlay */
inpTextOn.addEventListener('change', () => {
  state.textOn = inpTextOn.checked;
  textCtrls.style.display = state.textOn ? '' : 'none';
  pvText.style.display = (state.textOn && state.textStr) ? '' : 'none';
  render();
});
inpText.addEventListener('input', () => {
  state.textStr = inpText.value;
  render();
});
inpFont.addEventListener('change', () => {
  state.textFont = inpFont.value;
  render();
});
initSeg(segFontWeight, val => { state.textWeight = val; render(); });
inpFontSize.addEventListener('input', () => {
  state.textSize = +inpFontSize.value;
  fontSizeVal.textContent = state.textSize + 'px';
  render();
});
initSeg(segTextAlign, val => { state.textAlign = val; render(); });
syncColor(inpTextColor, inpHexText, 'textColor', 'swatches-text');

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
   DRAGGING  — shared for logo & text
───────────────────────────────────────────────── */
let dragging = false, dragTarget = null;
let dragStartX, dragStartY, dragOriginX, dragOriginY;

function startDrag(e, target, xKey, yKey) {
  e.preventDefault();
  dragging = true;
  dragTarget = { target, xKey, yKey };
  dragStartX  = e.clientX;
  dragStartY  = e.clientY;
  dragOriginX = state[xKey];
  dragOriginY = state[yKey];
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
  const scale = getScale();
  state[dragTarget.xKey] = Math.round(dragOriginX + (e.clientX - dragStartX) / scale);
  state[dragTarget.yKey] = Math.round(dragOriginY + (e.clientY - dragStartY) / scale);
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

/* Arrow nudge */
document.addEventListener('keydown', e => {
  const step = e.shiftKey ? 10 : 1;
  let moved = false;
  if (state.logoSelected && state.logoSrc) {
    moved = nudge(e.key, step, 'logoX', 'logoY');
    if (moved) { pvLogo.style.left = state.logoX + 'px'; pvLogo.style.top = state.logoY + 'px'; }
  } else if (state.textSelected && state.textOn) {
    moved = nudge(e.key, step, 'textX', 'textY');
    if (moved) { pvText.style.left = state.textX + 'px'; pvText.style.top = state.textY + 'px'; }
  }
  if (moved) e.preventDefault();
});

function nudge(key, step, xKey, yKey) {
  switch (key) {
    case 'ArrowLeft':  state[xKey] -= step; return true;
    case 'ArrowRight': state[xKey] += step; return true;
    case 'ArrowUp':    state[yKey] -= step; return true;
    case 'ArrowDown':  state[yKey] += step; return true;
    default: return false;
  }
}

function getScale() {
  const m = previewOuter.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

/* ─────────────────────────────────────────────────
   RENDER PREVIEW
───────────────────────────────────────────────── */
function render() {
  const isEmpty = !state.logoSrc && !state.textOn && state.color1 === defaultState().color1
    && state.accentMode === 'none' && !state.shadowOn;

  pvBanner.style.width  = A4_W + 'px';
  pvBanner.style.height = state.height + 'px';
  pvBanner.style.borderRadius = state.radius + 'px';
  pvBanner.style.flexDirection = state.accentPos === 'above' ? 'column-reverse' : 'column';

  // Shadow on preview wrapper
  if (state.shadowOn) {
    pvBanner.style.filter = `drop-shadow(${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${state.shadowColor})`;
  } else {
    pvBanner.style.filter = 'none';
  }
  pvBanner.style.boxShadow = isEmpty ? 'none' : '0 8px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06)';
  pvBanner.classList.toggle('empty', isEmpty);

  // Background
  pvMain.style.background = state.bgType === 'gradient'
    ? `linear-gradient(135deg, ${state.color1}, ${state.color2})`
    : state.color1;
  pvMain.style.borderRadius = state.radius > 0
    ? `${state.radius}px ${state.radius}px ${state.accentMode === 'none' ? state.radius : 0}px ${state.accentMode === 'none' ? state.radius : 0}px`
    : '0';

  // Remove old accent bands
  pvBanner.querySelectorAll('.pv-accent').forEach(el => el.remove());

  if (state.accentMode !== 'none') {
    const a1 = document.createElement('div');
    a1.className = 'pv-accent';
    a1.style.height = state.accent1H + 'px';
    a1.style.background = state.accent1;
    if (state.radius > 0 && state.accentMode === 'single') {
      a1.style.borderRadius = state.accentPos === 'above'
        ? `${state.radius}px ${state.radius}px 0 0` : `0 0 ${state.radius}px ${state.radius}px`;
    }
    pvBanner.appendChild(a1);

    if (state.accentMode === 'double') {
      const a2 = document.createElement('div');
      a2.className = 'pv-accent';
      a2.style.height = state.accent2H + 'px';
      a2.style.background = state.accent2;
      if (state.radius > 0) {
        a2.style.borderRadius = state.accentPos === 'above'
          ? `${state.radius}px ${state.radius}px 0 0` : `0 0 ${state.radius}px ${state.radius}px`;
      }
      pvBanner.appendChild(a2);
    }
  }

  // Logo
  if (state.logoSrc) {
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
    pvText.style.display = '';
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
   EXPORT  — 300 dpi canvas + DPI metadata
───────────────────────────────────────────────── */
async function exportToPNG(overrideMode) {
  const m   = EXPORT_MODES[overrideMode || exportMode];
  const sc  = m.scale;
  const outW = Math.round(A4_W         * sc);
  const outH = Math.round(state.height * sc);
  const r    = Math.round(state.radius * sc);

  const canvas = document.createElement('canvas');
  canvas.width  = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clip to rounded rectangle
  if (r > 0) {
    ctx.beginPath();
    ctx.roundRect(0, 0, outW, outH, r);
    ctx.clip();
  }

  // Shadow
  if (state.shadowOn) {
    ctx.shadowOffsetX = state.shadowX * sc;
    ctx.shadowOffsetY = state.shadowY * sc;
    ctx.shadowBlur    = state.shadowBlur * sc;
    ctx.shadowColor   = state.shadowColor;
  }

  // Accent heights
  const accH1    = state.accentMode !== 'none'   ? Math.round(state.accent1H * sc) : 0;
  const accH2    = state.accentMode === 'double'  ? Math.round(state.accent2H * sc) : 0;
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

  // Turn off shadow for accent / logo / text layers
  ctx.shadowColor = 'transparent';

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

  // Logo
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

  // Text overlay
  if (state.textOn && state.textStr) {
    ctx.font = `${state.textWeight} ${Math.round(state.textSize * sc)}px ${state.textFont}`;
    ctx.fillStyle   = state.textColor;
    ctx.textAlign   = state.textAlign;
    ctx.textBaseline = 'top';
    const tx = state.textAlign === 'center' ? outW / 2
             : state.textAlign === 'right'  ? outW - Math.round(state.textX * sc)
             : Math.round(state.textX * sc);
    ctx.fillText(state.textStr, tx, Math.round(state.textY * sc));
  }

  const raw = canvas.toDataURL('image/png', 1.0);
  return injectPHYs(raw, m.dpi);
}

/* ─────────────────────────────────────────────────
   PNG pHYs DPI chunk injection
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
    for (let i=0;i<256;i++){let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>>1)):(v>>>1);t[i]=v;}
    return t;
  })();
  function crc32(bytes) {
    let c=0xFFFFFFFF;
    for(let i=0;i<bytes.length;i++) c=crcTable[(c^bytes[i])&0xff]^(c>>>8);
    return (c^0xFFFFFFFF)>>>0;
  }

  const typeBytes = [0x70,0x48,0x59,0x73];
  const data = new Uint8Array([...u32be(ppm),...u32be(ppm),1]);
  const crcVal = crc32(new Uint8Array([...typeBytes,...data]));
  const chunk  = new Uint8Array([...u32be(9),...typeBytes,...data,...u32be(crcVal)]);

  const out = new Uint8Array(src.length + chunk.length);
  out.set(src.slice(0,33));
  out.set(chunk,33);
  out.set(src.slice(33),33+chunk.length);

  let s='';
  for(let i=0;i<out.length;i++) s+=String.fromCharCode(out[i]);
  return 'data:image/png;base64,' + btoa(s);
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
    const name = (state.company || 'banner').replace(/[^a-z0-9_\-]/gi,'_').toLowerCase();
    a.download = `${name}_banner_${m.dpi}dpi.png`;
    a.href = dataUrl;
    a.click();
    toast(`Downloaded ${Math.round(A4_W*m.scale)}\u00d7${Math.round(state.height*m.scale)}px @ ${m.dpi}dpi`);
  } catch(err) {
    console.error(err);
    toast('Export failed — see console');
  } finally {
    btnDownload.textContent = '⬇ Download PNG';
    btnDownload.disabled = false;
  }
});

/* Export mode toggle */
initSeg(segExport, val => { exportMode = val; updateDimLabel(); });

/* ─────────────────────────────────────────────────
   LOCAL STORAGE
───────────────────────────────────────────────── */
const LS_KEY = 'bannerCreator_recents';
const MAX_RECENTS = 5;
function getSaved() { try { return JSON.parse(localStorage.getItem(LS_KEY))||[]; } catch { return []; } }

btnSave.addEventListener('click', async () => {
  if (!state.company.trim()) { toast('Enter a company name first'); return; }
  btnSave.textContent = '⏳ Saving…'; btnSave.disabled = true;
  try {
    const thumb   = await exportToPNG('web');
    const recents = getSaved().filter(r => r.company !== state.company.trim());
    recents.unshift({ company: state.company.trim(), savedAt: Date.now(), thumb,
      state: JSON.stringify({...state, logoSrc: state.logoSrc}) });
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar();
    toast(`"${state.company}" saved`);
  } catch(err) { console.error(err); toast('Save failed');
  } finally { btnSave.textContent = '💾 Save'; btnSave.disabled = false; }
});

function loadEntry(entry) {
  Object.assign(state, JSON.parse(entry.state));
  inpLogo.value = '';
  if (state.logoSrc) logoDropText.textContent = 'Logo loaded from save';
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
    const card = document.createElement('div'); card.className='recent-card';
    const del  = document.createElement('button'); del.className='recent-card-del'; del.title='Delete'; del.textContent='\u2715';
    del.addEventListener('click', e=>{e.stopPropagation(); deleteEntry(entry.company);});
    const thumb = document.createElement('img'); thumb.className='recent-card-thumb'; thumb.src=entry.thumb; thumb.alt=entry.company;
    const name  = document.createElement('div'); name.className='recent-card-name';  name.textContent=entry.company;
    const date  = document.createElement('div'); date.className='recent-card-date';
    date.textContent = new Date(entry.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    card.append(del,thumb,name,date);
    card.addEventListener('click',()=>loadEntry(entry));
    recentList.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────
   SYNC UI FROM STATE
───────────────────────────────────────────────── */
function syncUIFromState() {
  inpCompany.value = state.company;
  inpHeight.value  = state.height;  heightVal.textContent  = state.height  + 'px';
  inpRadius.value  = state.radius;  radiusVal.textContent  = state.radius  + 'px';

  setSegActive(segBgType, state.bgType);
  gradWrap.style.display = state.bgType === 'gradient' ? '' : 'none';
  inpColor1.value=state.color1; inpHex1.value=state.color1; highlightSwatch('swatches-color1', state.color1);
  inpColor2.value=state.color2; inpHex2.value=state.color2; highlightSwatch('swatches-color2', state.color2);

  setSegActive(segAccent, state.accentMode);
  accentCtrls.style.display = state.accentMode==='none' ? 'none' : '';
  accent2Wrap.style.display  = state.accentMode==='double' ? '' : 'none';
  setSegActive(segAccentPos, state.accentPos);
  inpAccent1.value=state.accent1; inpHexA1.value=state.accent1; highlightSwatch('swatches-accent1',state.accent1);
  inpAh1.value=state.accent1H; ah1Val.textContent=state.accent1H+'px';
  inpAccent2.value=state.accent2; inpHexA2.value=state.accent2; highlightSwatch('swatches-accent2',state.accent2);
  inpAh2.value=state.accent2H; ah2Val.textContent=state.accent2H+'px';

  inpShadow.checked = state.shadowOn;
  shadowCtrls.style.display = state.shadowOn ? '' : 'none';
  inpShadowX.value=state.shadowX;    shadowXVal.textContent=state.shadowX+'px';
  inpShadowY.value=state.shadowY;    shadowYVal.textContent=state.shadowY+'px';
  inpShadowBlur.value=state.shadowBlur; shadowBlurVal.textContent=state.shadowBlur+'px';
  inpShadowColor.value=state.shadowColor; inpHexShadow.value=state.shadowColor;

  inpTextOn.checked = state.textOn;
  textCtrls.style.display = state.textOn ? '' : 'none';
  inpText.value = state.textStr;
  inpFont.value = state.textFont;
  setSegActive(segFontWeight, state.textWeight);
  inpFontSize.value=state.textSize; fontSizeVal.textContent=state.textSize+'px';
  setSegActive(segTextAlign, state.textAlign);
  inpTextColor.value=state.textColor; inpHexText.value=state.textColor; highlightSwatch('swatches-text',state.textColor);

  if (state.logoSrc) {
    pvLogo.src=state.logoSrc; pvLogo.style.display='';
    logoCtrls.style.display=''; nudgeHint.style.display='';
    inpLogoW.value=state.logoW; logoWVal.textContent=state.logoW+'px';
    state.logoLock = state.logoLock!==false;
    setSegActive(segLogoLock, state.logoLock?'locked':'free');
    logoHWrap.style.display=state.logoLock?'none':'';
    if(!state.logoLock&&state.logoH){inpLogoH.value=state.logoH;logoHHVal.textContent=state.logoH+'px';}
  } else {
    logoCtrls.style.display='none'; nudgeHint.style.display='none';
    pvLogo.style.display='none';
  }
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
// Build swatch rows
buildSwatches('swatches-color1',  inpColor1, inpHex1,   'color1');
buildSwatches('swatches-color2',  inpColor2, inpHex2,   'color2');
buildSwatches('swatches-accent1', inpAccent1,inpHexA1,  'accent1');
buildSwatches('swatches-accent2', inpAccent2,inpHexA2,  'accent2');
buildSwatches('swatches-text',    inpTextColor,inpHexText,'textColor');
// Highlight defaults
highlightSwatch('swatches-color1', state.color1);
highlightSwatch('swatches-color2', state.color2);
highlightSwatch('swatches-text',   state.textColor);

renderSidebar();
render();
