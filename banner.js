/* ═══════════════════════════════════════════════════
   BANNER CREATOR  — banner.js   Phase 3 (4 image layers)
   MSP Toolkit  |  PCG IT
═══════════════════════════════════════════════════ */

const A4_W = 794;
const NUM_LAYERS = 4;

const EXPORT_MODES = {
  print: { scale: 3.125, dpi: 300 },
  web:   { scale: 1,     dpi: 96  },
};
let exportMode = 'print';
let currentMode = 'logo';

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
const SWATCHES_TEXT = [{ hex: '#ffffff', label: 'White' }, ...SWATCHES];

/* ─────────────────────────────────────────────────
   IMAGE LAYER STATE
   Each layer: { src, w, h, lock, x, y, selected }
───────────────────────────────────────────────── */
function defaultLayer() {
  return { src: null, w: 200, h: null, lock: true, x: 40, y: 40, selected: false };
}

function defaultState() {
  return {
    mode:        'logo',
    company:     '',
    height:      280,
    radius:      0,
    bgType:      'solid',
    gradDir:     '135',
    color1:      '#1a3a5c',
    color2:      '#0d2035',
    borderOn:    false,
    borderW:     2,
    borderColor: '#f5a623',
    accentMode:  'none',
    accentPos:   'below',
    accent1:     '#f5a623',
    accent1H:    8,
    accent2:     '#c8c8c8',
    accent2H:    4,
    shadowOn:    false,
    shadowX:     4,
    shadowY:     4,
    shadowBlur:  12,
    shadowColor: '#000000',
    textOn:      false,
    textStr:     '',
    textFont:    'Arial, sans-serif',
    textWeight:  '700',
    textSize:    36,
    textAlign:   'left',
    textColor:   '#ffffff',
    textX:       40,
    textY:       40,
    textSelected: false,
    layers:      Array.from({ length: NUM_LAYERS }, defaultLayer),
    _cleared:    true,
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
const imageLayersList = $('image-layers-list');
const pvBanner        = $('preview-banner');
const pvMain          = $('pv-main');
const pvImages        = $('pv-images');
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
   UNDO HISTORY
   Snapshots are deep-copied state objects.
   Image data URLs are large but we cap at 30 steps.
───────────────────────────────────────────────── */
const UNDO_LIMIT = 30;
const undoStack  = [];
let   undoPaused = false; // prevent pushes during undo restore

function pushHistory() {
  if (undoPaused) return;
  // Deep copy — layers contain data URLs so use JSON round-trip
  const snap = JSON.parse(JSON.stringify(state));
  undoStack.push(snap);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  updateUndoBtn();
}

function updateUndoBtn() {
  const btn = $('btn-undo');
  if (!btn) return;
  btn.disabled = undoStack.length === 0;
}

function doUndo() {
  if (undoStack.length === 0) return;
  const snap = undoStack.pop();
  undoPaused = true;
  Object.assign(state, snap);
  currentMode = state.mode || 'logo';
  // Rebuild layer card UI to reflect restored image state
  layerUI.forEach((ui, i) => {
    const layer = state.layers[i];
    if (layer && layer.src) {
      ui.thumb.src = layer.src; ui.thumb.style.display = 'block';
      ui.controls.style.display = ''; ui.card.classList.add('has-image');
      ui.wSlider.value = layer.w; ui.wBadge.textContent = layer.w + 'px';
      ui.dropText.textContent = 'Image loaded';
      const lockVal = layer.lock !== false ? 'locked' : 'free';
      [ui.lockBtn, ui.freeBtn].forEach(b => b.classList.toggle('active', b.dataset.val === lockVal));
      ui.hWrap.style.display = layer.lock ? 'none' : '';
      if (!layer.lock && layer.h) { ui.hSlider.value = layer.h; ui.hBadge.textContent = layer.h + 'px'; }
    } else {
      ui.thumb.style.display = 'none'; ui.controls.style.display = 'none';
      ui.card.classList.remove('has-image', 'selected-layer');
      ui.dropText.textContent = 'Click or drag image here';
    }
  });
  syncUIFromState();
  undoPaused = false;
  render();
  updateUndoBtn();
  toast('↩ Undone');
}

// Keyboard shortcut
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); doUndo();
  }
});

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
function initSeg(el, onChange) {
  if (!el) return;
  el.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pushHistory();
      onChange(btn.dataset.val);
    });
  });
}
function setSegActive(el, val) {
  if (!el) return;
  el.querySelectorAll('.seg').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}
function syncColor(picker, hexInput, key, swatchRowId) {
  const update = val => {
    pushHistory(); // snapshot before mutation
    state[key] = val; state._cleared = false;
    picker.value = val; hexInput.value = val;
    if (swatchRowId) highlightSwatch(swatchRowId, val);
    render();
  };
  picker.addEventListener('input', () => update(picker.value));
  hexInput.addEventListener('input', () => {
    const v = hexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) update(v);
  });
}
function buildSwatches(containerId, pickerEl, hexEl, stateKey, swatchList) {
  const row = $(containerId); if (!row) return;
  (swatchList || SWATCHES).forEach(sw => {
    const btn = document.createElement('button');
    btn.className = 'swatch'; btn.title = sw.label;
    btn.dataset.hex = sw.hex; btn.style.background = sw.hex;
    btn.addEventListener('click', () => {
      pushHistory();
      state[stateKey] = sw.hex; state._cleared = false;
      pickerEl.value = sw.hex; hexEl.value = sw.hex;
      highlightSwatch(containerId, sw.hex); render(true);
    });
    row.appendChild(btn);
  });
}
function highlightSwatch(containerId, hex) {
  const row = $(containerId); if (!row) return;
  row.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.hex.toLowerCase() === hex.toLowerCase())
  );
}

/* ─────────────────────────────────────────────────
   IMAGE LAYER CARDS  — build UI for all 4 slots
───────────────────────────────────────────────── */
// Per-layer DOM refs for quick access
const layerUI = []; // { card, thumb, nameEl, drop, dropText, wSlider, wVal, lockSeg, hWrap, hSlider, hVal, removeBtn, body, toggle }

function buildLayerCards() {
  imageLayersList.innerHTML = '';
  layerUI.length = 0;

  for (let i = 0; i < NUM_LAYERS; i++) {
    const card = document.createElement('div');
    card.className = 'img-layer-card';
    card.id = `layer-card-${i}`;

    // Header
    const header = document.createElement('div');
    header.className = 'img-layer-header';

    const num = document.createElement('div');
    num.className = 'img-layer-num'; num.textContent = i + 1;

    const nameEl = document.createElement('div');
    nameEl.className = 'img-layer-name'; nameEl.textContent = `Image ${i + 1}`;

    const thumb = document.createElement('img');
    thumb.className = 'img-layer-thumb'; thumb.alt = '';

    const toggle = document.createElement('span');
    toggle.className = 'img-layer-toggle'; toggle.textContent = i === 0 ? '▼' : '▶';

    header.append(num, nameEl, thumb, toggle);

    // Body
    const body = document.createElement('div');
    body.className = 'img-layer-body';
    body.style.display = i === 0 ? '' : 'none';

    // Drop zone
    const dropLabel = document.createElement('label');
    dropLabel.className = 'img-layer-drop';
    const fileInp = document.createElement('input');
    fileInp.type = 'file'; fileInp.accept = 'image/*';
    const dropText = document.createElement('span');
    dropText.textContent = 'Click or drag image here';
    dropLabel.append(fileInp, dropText);

    // Controls (shown after upload)
    const controls = document.createElement('div');
    controls.className = 'img-layer-controls'; controls.style.display = 'none';

    // Width slider
    const wRow = document.createElement('div'); wRow.className = 'ctrl-group';
    const wLbl = document.createElement('label'); wLbl.className = 'ctrl-label';
    const wBadge = document.createElement('span'); wBadge.className = 'val-badge'; wBadge.textContent = '200px';
    wLbl.textContent = 'Width '; wLbl.appendChild(wBadge);
    const wSlider = document.createElement('input'); wSlider.type = 'range';
    wSlider.min = 40; wSlider.max = 700; wSlider.value = 200;
    wRow.append(wLbl, wSlider);

    // Lock toggle
    const lockRow = document.createElement('div'); lockRow.className = 'ctrl-group';
    const lockLbl = document.createElement('label'); lockLbl.className = 'ctrl-label'; lockLbl.textContent = 'Height';
    const lockSeg = document.createElement('div'); lockSeg.className = 'seg-control';
    const lockBtn  = document.createElement('button'); lockBtn.className = 'seg active'; lockBtn.dataset.val = 'locked'; lockBtn.textContent = '⛓ Locked';
    const freeBtn  = document.createElement('button'); freeBtn.className = 'seg'; freeBtn.dataset.val = 'free'; freeBtn.textContent = 'Free';
    lockSeg.append(lockBtn, freeBtn);
    lockRow.append(lockLbl, lockSeg);

    // Free height slider (hidden by default)
    const hWrap = document.createElement('div'); hWrap.className = 'ctrl-group'; hWrap.style.display = 'none';
    const hLbl = document.createElement('label'); hLbl.className = 'ctrl-label';
    const hBadge = document.createElement('span'); hBadge.className = 'val-badge'; hBadge.textContent = '100px';
    hLbl.textContent = 'H '; hLbl.appendChild(hBadge);
    const hSlider = document.createElement('input'); hSlider.type = 'range';
    hSlider.min = 20; hSlider.max = 500; hSlider.value = 100;
    hWrap.append(hLbl, hSlider);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'img-layer-remove'; removeBtn.textContent = '✕ Remove Image';

    // Layer order buttons
    const orderRow = document.createElement('div');
    orderRow.className = 'img-layer-row'; orderRow.style.marginTop = '4px';
    const btnBack = document.createElement('button');
    btnBack.className = 'btn-layer-order'; btnBack.textContent = '↓ Move Back';
    btnBack.title = 'Move this image one layer back (further behind)';
    const btnFront = document.createElement('button');
    btnFront.className = 'btn-layer-order'; btnFront.textContent = '↑ Move Forward';
    btnFront.title = 'Move this image one layer forward (closer to front)';
    orderRow.append(btnBack, btnFront);

    controls.append(wRow, lockRow, hWrap, orderRow, removeBtn);
    body.append(dropLabel, controls);
    card.append(header, body);
    imageLayersList.appendChild(card);

    const ui = { card, thumb, nameEl, drop: dropLabel, dropText, fileInp, wSlider, wBadge, lockSeg, lockBtn, freeBtn, hWrap, hSlider, hBadge, removeBtn, controls, body, toggle };
    layerUI.push(ui);

    // ── Wire events ──
    const idx = i; // capture

    // Move forward (swap with next layer toward front)
    btnFront.addEventListener('click', e => { e.stopPropagation(); swapLayers(idx, idx + 1); });
    // Move back (swap with previous layer toward back)
    btnBack.addEventListener('click',  e => { e.stopPropagation(); swapLayers(idx, idx - 1); });

    // Collapse/expand header
    header.addEventListener('click', () => {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : '';
      toggle.textContent = open ? '▶' : '▼';
    });

    // File upload
    fileInp.addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      loadLayerFile(f, idx);
    });

    // Drag-drop onto label
    dropLabel.addEventListener('dragover', e => { e.preventDefault(); dropLabel.style.borderColor = 'var(--accent)'; });
    dropLabel.addEventListener('dragleave', () => { dropLabel.style.borderColor = ''; });
    dropLabel.addEventListener('drop', e => {
      e.preventDefault(); dropLabel.style.borderColor = '';
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) loadLayerFile(f, idx);
    });

    // Width slider
    wSlider.addEventListener('input', () => {
      state.layers[idx].w = +wSlider.value;
      wBadge.textContent = wSlider.value + 'px';
      render();
    });

    // Lock toggle
    [lockBtn, freeBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        [lockBtn, freeBtn].forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.layers[idx].lock = btn.dataset.val === 'locked';
        hWrap.style.display = state.layers[idx].lock ? 'none' : '';
        if (!state.layers[idx].lock && !state.layers[idx].h) state.layers[idx].h = 100;
        render();
      });
    });

    // Height slider (free mode)
    hSlider.addEventListener('input', () => {
      state.layers[idx].h = +hSlider.value;
      hBadge.textContent = hSlider.value + 'px';
      render();
    });

    // Remove
    removeBtn.addEventListener('click', () => {
      state.layers[idx] = defaultLayer();
      dropText.textContent = 'Click or drag image here';
      fileInp.value = '';
      thumb.src = ''; thumb.style.display = 'none';
      controls.style.display = 'none';
      card.classList.remove('has-image', 'selected-layer');
      nameEl.textContent = `Image ${idx + 1}`;
      render();
    });
  }
}

function swapLayers(idxA, idxB) {
  if (idxB < 0 || idxB >= NUM_LAYERS) { toast('Already at ' + (idxB < 0 ? 'back' : 'front')); return; }
  // Swap state
  [state.layers[idxA], state.layers[idxB]] = [state.layers[idxB], state.layers[idxA]];
  // Rebuild card UI to reflect new order
  syncLayerCardsFromState();
  render();
  toast(`Image moved ${idxB > idxA ? 'forward' : 'back'}`);
}

function syncLayerCardsFromState() {
  state.layers.forEach((layer, i) => {
    const ui = layerUI[i];
    if (layer.src) {
      ui.thumb.src = layer.src; ui.thumb.style.display = 'block';
      ui.controls.style.display = ''; ui.card.classList.add('has-image');
      ui.wSlider.value = layer.w; ui.wBadge.textContent = layer.w + 'px';
      ui.nameEl.textContent = layer._name || `Image ${i + 1}`;
      ui.dropText.textContent = 'Image loaded';
      const lockVal = layer.lock !== false ? 'locked' : 'free';
      [ui.lockBtn, ui.freeBtn].forEach(b => b.classList.toggle('active', b.dataset.val === lockVal));
      ui.hWrap.style.display = layer.lock ? 'none' : '';
      if (!layer.lock && layer.h) { ui.hSlider.value = layer.h; ui.hBadge.textContent = layer.h + 'px'; }
    } else {
      ui.thumb.src = ''; ui.thumb.style.display = 'none';
      ui.controls.style.display = 'none';
      ui.card.classList.remove('has-image', 'selected-layer');
      ui.nameEl.textContent = `Image ${i + 1}`;
      ui.dropText.textContent = 'Click or drag image here';
    }
  });
}

function loadLayerFile(file, idx) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const layer = state.layers[idx];
      layer.src  = ev.target.result;
      layer.w    = Math.min(200, img.naturalWidth);
      layer.h    = null;
      layer.lock = true;
      layer.x    = 40;
      layer.y    = Math.round((state.height - layer.w / (img.naturalWidth / img.naturalHeight)) / 2);
      layer._name = file.name.replace(/\.[^.]+$/, '').slice(0, 18);
      state._cleared = false;

      // Update card UI
      const ui = layerUI[idx];
      ui.dropText.textContent = file.name;
      ui.thumb.src = ev.target.result;
      ui.thumb.style.display = 'block';
      ui.controls.style.display = '';
      ui.wSlider.value = layer.w;
      ui.wBadge.textContent = layer.w + 'px';
      ui.card.classList.add('has-image');
      ui.nameEl.textContent = file.name.replace(/\.[^.]+$/, '').slice(0, 18);
      render();
      toast(`Image ${idx + 1} loaded`);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function updateLayerCardSelectedState() {
  state.layers.forEach((layer, i) => {
    layerUI[i].card.classList.toggle('selected-layer', layer.selected);
  });
}

/* ─────────────────────────────────────────────────
   PREVIEW IMAGE ELEMENTS
   We keep a pool of <img> elements inside #pv-images
───────────────────────────────────────────────── */
const pvImgEls = [];
function buildPreviewImageEls() {
  pvImages.innerHTML = '';
  pvImgEls.length = 0;
  for (let i = 0; i < NUM_LAYERS; i++) {
    const el = document.createElement('img');
    el.className = 'pv-img-layer';
    el.draggable = false;
    el.alt = '';
    el.style.display = 'none';
    pvImages.appendChild(el);
    pvImgEls.push(el);

    const idx = i;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      // Deselect all, select this
      state.layers.forEach((l, j) => { l.selected = j === idx; });
      state.textSelected = false;
      pvText.classList.remove('selected');
      updateLayerCardSelectedState();
      pvImgEls.forEach((el2, j) => el2.classList.toggle('selected', j === idx));
      startImgDrag(e, idx);
    });
  }
}

/* ─────────────────────────────────────────────────
   DRAGGING  (images + text)
───────────────────────────────────────────────── */
let dragging = false;
let dragCtx  = null; // { type: 'img'|'text', idx?, xKey, yKey, el }
let dragStartX, dragStartY, dragOriginX, dragOriginY;

function startImgDrag(e, idx) {
  dragging = true;
  dragCtx  = { type: 'img', idx };
  dragStartX  = e.clientX; dragStartY = e.clientY;
  dragOriginX = state.layers[idx].x; dragOriginY = state.layers[idx].y;
  pvImgEls[idx].style.cursor = 'grabbing';
}

pvText.addEventListener('mousedown', e => {
  if (!state.textOn || !state.textStr) return;
  state.textSelected = true;
  state.layers.forEach(l => { l.selected = false; });
  pvText.classList.add('selected');
  pvImgEls.forEach(el => el.classList.remove('selected'));
  updateLayerCardSelectedState();
  dragging = true;
  dragCtx  = { type: 'text' };
  dragStartX  = e.clientX; dragStartY = e.clientY;
  dragOriginX = state.textX; dragOriginY = state.textY;
  pvText.style.cursor = 'grabbing';
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!dragging || !dragCtx) return;
  const sc = getScale();
  const dx = Math.round((e.clientX - dragStartX) / sc);
  const dy = Math.round((e.clientY - dragStartY) / sc);
  if (dragCtx.type === 'img') {
    state.layers[dragCtx.idx].x = dragOriginX + dx;
    state.layers[dragCtx.idx].y = dragOriginY + dy;
    pvImgEls[dragCtx.idx].style.left = state.layers[dragCtx.idx].x + 'px';
    pvImgEls[dragCtx.idx].style.top  = state.layers[dragCtx.idx].y + 'px';
  } else {
    state.textX = dragOriginX + dx;
    state.textY = dragOriginY + dy;
    positionText();
  }
});

document.addEventListener('mouseup', () => {
  if (dragging && dragCtx) {
    if (dragCtx.type === 'img') pvImgEls[dragCtx.idx].style.cursor = 'grab';
    else pvText.style.cursor = 'grab';
  }
  dragging = false; dragCtx = null;
});

pvBanner.addEventListener('mousedown', e => {
  const clickedImg = e.target.classList.contains('pv-img-layer');
  if (!clickedImg && e.target !== pvText) {
    state.layers.forEach(l => { l.selected = false; });
    state.textSelected = false;
    pvImgEls.forEach(el => el.classList.remove('selected'));
    pvText.classList.remove('selected');
    updateLayerCardSelectedState();
  }
});

document.addEventListener('keydown', e => {
  const step = e.shiftKey ? 10 : 1;
  let moved = false;
  const selIdx = state.layers.findIndex(l => l.selected);
  if (selIdx !== -1 && state.layers[selIdx].src) {
    moved = nudgeXY(e.key, step, selIdx);
    if (moved) {
      pvImgEls[selIdx].style.left = state.layers[selIdx].x + 'px';
      pvImgEls[selIdx].style.top  = state.layers[selIdx].y + 'px';
    }
  } else if (state.textSelected && state.textOn) {
    switch (e.key) {
      case 'ArrowLeft':  state.textX -= step; moved = true; break;
      case 'ArrowRight': state.textX += step; moved = true; break;
      case 'ArrowUp':    state.textY -= step; moved = true; break;
      case 'ArrowDown':  state.textY += step; moved = true; break;
    }
    if (moved) positionText();
  }
  if (moved) e.preventDefault();
});

function nudgeXY(key, step, idx) {
  switch(key) {
    case 'ArrowLeft':  state.layers[idx].x -= step; return true;
    case 'ArrowRight': state.layers[idx].x += step; return true;
    case 'ArrowUp':    state.layers[idx].y -= step; return true;
    case 'ArrowDown':  state.layers[idx].y += step; return true;
  }
  return false;
}

function getScale() {
  const m = previewOuter.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

/* ─────────────────────────────────────────────────
   MODE SWITCH
───────────────────────────────────────────────── */
function setMode(mode) {
  currentMode = mode; state.mode = mode;
  tabLogo.classList.toggle('active',   mode === 'logo');
  tabHeader.classList.toggle('active', mode === 'header');
  segBgTypeLogo.style.display   = mode === 'logo'   ? '' : 'none';
  segBgTypeHeader.style.display = mode === 'header' ? '' : 'none';
  accentSection.style.display   = mode === 'logo'   ? '' : 'none';
  logoSection.style.display     = mode === 'logo'   ? '' : 'none';
  if (mode === 'logo' && (state.bgType === 'spotlight' || state.bgType === 'streaks')) {
    state.bgType = 'solid'; setSegActive(segBgTypeLogo, 'solid');
  }
  pvBanner.style.background = ''; pvBanner.style.backgroundSize = '';
  pvMain.style.background   = ''; state._cleared = true;
  updateBgControls(); render();
}
tabLogo.addEventListener('click',   () => setMode('logo'));
tabHeader.addEventListener('click', () => setMode('header'));

function updateBgControls() {
  const t = state.bgType;
  gradColorWrap.style.display = (t === 'gradient' || t === 'spotlight') ? '' : 'none';
  gradDirWrap.style.display   = (t === 'gradient') ? '' : 'none';
  if (t === 'spotlight') { color1Label.textContent = 'Base Color'; color2Label.textContent = 'Highlight Color'; }
  else if (t === 'gradient') { color1Label.textContent = 'Gradient Start'; color2Label.textContent = 'Gradient End'; }
  else { color1Label.textContent = 'Main Color'; }
}

/* ─────────────────────────────────────────────────
   CLEAR
───────────────────────────────────────────────── */
btnClear.addEventListener('click', () => {
  const savedMode = currentMode;
  state = defaultState(); state._cleared = true; state.mode = savedMode;
  // Reset layer cards UI
  layerUI.forEach((ui, i) => {
    ui.dropText.textContent = 'Click or drag image here';
    ui.fileInp.value = '';
    ui.thumb.src = ''; ui.thumb.style.display = 'none';
    ui.controls.style.display = 'none';
    ui.card.classList.remove('has-image', 'selected-layer');
    ui.nameEl.textContent = `Image ${i + 1}`;
  });
  syncUIFromState(); render(); toast('Canvas cleared');
});

/* ─────────────────────────────────────────────────
   CONTROL WIRING
───────────────────────────────────────────────── */
inpCompany.addEventListener('input', () => { state.company = inpCompany.value; });
inpHeight.addEventListener('input', () => { pushHistory(); state.height = +inpHeight.value; heightVal.textContent = state.height + 'px'; render(); });
inpRadius.addEventListener('input', () => { pushHistory(); state.radius = +inpRadius.value; radiusVal.textContent = state.radius + 'px'; render(); });

initSeg(segBgTypeLogo,   val => { state.bgType = val; updateBgControls(); render(); });
initSeg(segBgTypeHeader, val => { state.bgType = val; updateBgControls(); render(); });
initSeg(segGradDir,      val => { state.gradDir = val; render(); });

syncColor(inpColor1, inpHex1, 'color1', 'swatches-color1');
syncColor(inpColor2, inpHex2, 'color2', 'swatches-color2');

inpBorder.addEventListener('change', () => { pushHistory(); state.borderOn = inpBorder.checked; borderCtrls.style.display = state.borderOn ? '' : 'none'; render(); });
inpBorderW.addEventListener('input', () => { pushHistory(); state.borderW = +inpBorderW.value; borderWVal.textContent = state.borderW + 'px'; render(); });
syncColor(inpBorderColor, inpHexBorder, 'borderColor', 'swatches-border');

initSeg(segAccent, val => { state.accentMode = val; accentCtrls.style.display = val === 'none' ? 'none' : ''; accent2Wrap.style.display = val === 'double' ? '' : 'none'; render(); });
initSeg(segAccentPos, val => { state.accentPos = val; render(); });
syncColor(inpAccent1, inpHexA1, 'accent1', 'swatches-accent1');
syncColor(inpAccent2, inpHexA2, 'accent2', 'swatches-accent2');
inpAh1.addEventListener('input', () => { pushHistory(); state.accent1H = +inpAh1.value; ah1Val.textContent = state.accent1H + 'px'; render(); });
inpAh2.addEventListener('input', () => { pushHistory(); state.accent2H = +inpAh2.value; ah2Val.textContent = state.accent2H + 'px'; render(); });

inpShadow.addEventListener('change', () => { pushHistory(); state.shadowOn = inpShadow.checked; shadowCtrls.style.display = state.shadowOn ? '' : 'none'; render(); });
inpShadowX.addEventListener('input', () => { pushHistory(); state.shadowX = +inpShadowX.value; shadowXVal.textContent = state.shadowX + 'px'; render(); });
inpShadowY.addEventListener('input', () => { pushHistory(); state.shadowY = +inpShadowY.value; shadowYVal.textContent = state.shadowY + 'px'; render(); });
inpShadowBlur.addEventListener('input', () => { pushHistory(); state.shadowBlur = +inpShadowBlur.value; shadowBlurVal.textContent = state.shadowBlur + 'px'; render(); });
syncColor(inpShadowColor, inpHexShadow, 'shadowColor', null);

inpTextOn.addEventListener('change', () => { pushHistory(); state.textOn = inpTextOn.checked; textCtrls.style.display = state.textOn ? '' : 'none'; pvText.style.display = (state.textOn && state.textStr) ? '' : 'none'; render(); });
inpText.addEventListener('input', () => { pushHistory(); state.textStr = inpText.value; render(); });
inpText.addEventListener('keydown', e => {
  // Allow Shift+Enter for newlines, prevent plain Enter submitting
  if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
});
inpFont.addEventListener('change', () => { pushHistory(); state.textFont = inpFont.value; render(); });
initSeg(segFontWeight, val => { pushHistory(); state.textWeight = val; render(); });
inpFontSize.addEventListener('input', () => { pushHistory(); state.textSize = +inpFontSize.value; fontSizeVal.textContent = state.textSize + 'px'; render(); });
initSeg(segTextAlign, val => { pushHistory(); state.textAlign = val; state.textX = 0; render(); });
syncColor(inpTextColor, inpHexText, 'textColor', 'swatches-text');

initSeg(segExport, val => { exportMode = val; updateDimLabel(); });

/* ─────────────────────────────────────────────────
   BACKGROUND DRAWING
───────────────────────────────────────────────── */
function drawBackground(ctx, w, h, s) {
  switch (s.bgType) {
    case 'solid':
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h); break;
    case 'gradient': {
      const deg = parseFloat(s.gradDir || 135);
      const rad = (deg - 90) * Math.PI / 180;
      const cx = w/2, cy = h/2;
      const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
      const x1 = cx - Math.cos(rad)*len/2, y1 = cy - Math.sin(rad)*len/2;
      const x2 = cx + Math.cos(rad)*len/2, y2 = cy + Math.sin(rad)*len/2;
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, s.color1); g.addColorStop(1, s.color2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break;
    }
    case 'spotlight': {
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h);
      const gr = ctx.createRadialGradient(w*.65, h*.4, 0, w*.65, h*.4, Math.max(w,h)*.75);
      gr.addColorStop(0, hexToRgba(s.color2, .75)); gr.addColorStop(.4, hexToRgba(s.color2, .25)); gr.addColorStop(1, hexToRgba(s.color2, 0));
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); break;
    }
    case 'streaks': {
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w*1.1, h*.5);
      for (let i = 0; i < 14; i++) {
        const angle = ((i/14)-.5)*Math.PI*.7, spread = .012+Math.random()*.018, len2 = Math.max(w,h)*1.6;
        const bright = .08+Math.random()*.22;
        const hShift = i%3===0 ? shiftHue(s.color2,30) : i%3===1 ? s.color2 : shiftHue(s.color2,-25);
        ctx.save(); ctx.rotate(angle);
        const sg = ctx.createLinearGradient(0,0,-len2,0);
        sg.addColorStop(0, hexToRgba(hShift,bright)); sg.addColorStop(.4, hexToRgba(hShift,bright*.5)); sg.addColorStop(1, hexToRgba(hShift,0));
        ctx.fillStyle = sg;
        const hw = len2*spread;
        ctx.beginPath(); ctx.moveTo(0,-1); ctx.lineTo(-len2,-hw); ctx.lineTo(-len2,hw); ctx.lineTo(0,1); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      const vg = ctx.createRadialGradient(w*.5,h*.5,h*.2,w*.5,h*.5,Math.max(w,h)*.9);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.45)');
      ctx.fillStyle = vg; ctx.fillRect(0,0,w,h); break;
    }
  }
}
function hexToRgba(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function shiftHue(hex, deg) {
  let r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
  if(d!==0){if(max===r)h=((g-b)/d+6)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}
  h=(h+(deg/360)+1)%1;
  const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t2=v*(1-(1-f)*s);
  let nr,ng,nb;
  switch(i%6){case 0:nr=v;ng=t2;nb=p;break;case 1:nr=q;ng=v;nb=p;break;case 2:nr=p;ng=v;nb=t2;break;case 3:nr=p;ng=q;nb=v;break;case 4:nr=t2;ng=p;nb=v;break;default:nr=v;ng=p;nb=q;}
  return '#'+[nr,ng,nb].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

/* ─────────────────────────────────────────────────
   PREVIEW BG (off-screen canvas)
───────────────────────────────────────────────── */
function renderPreviewBg() {
  const canvas = document.createElement('canvas');
  canvas.width = A4_W; canvas.height = state.height;
  const ctx = canvas.getContext('2d');

  if (state.mode === 'logo') {
    const accH1 = state.accentMode !== 'none' ? state.accent1H : 0;
    const accH2 = state.accentMode === 'double' ? state.accent2H : 0;
    const mainH = state.height - accH1 - accH2;
    const mainY = state.accentPos === 'above' ? accH1 + accH2 : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(0, mainY, A4_W, mainH); ctx.clip();
    drawBackground(ctx, A4_W, mainH, state); ctx.restore();
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
    drawBackground(ctx, A4_W, state.height, state);
  }
  return canvas.toDataURL('image/png');
}

/* ─────────────────────────────────────────────────
   TEXT POSITIONING (preview)
───────────────────────────────────────────────── */
function positionText() {
  const bInset = state.borderOn ? state.borderW + 16 : 16;
  pvText.style.width  = (A4_W - bInset * 2) + 'px';
  pvText.style.top    = state.textY + 'px';
  if (state.textAlign === 'left')       pvText.style.left = (bInset + state.textX) + 'px';
  else if (state.textAlign === 'right') pvText.style.left = (bInset - state.textX) + 'px';
  else                                  pvText.style.left = (bInset + state.textX) + 'px';
}

const btnUndo = $('btn-undo');
if (btnUndo) btnUndo.addEventListener('click', doUndo);

/* ─────────────────────────────────────────────────
   RENDER PREVIEW
───────────────────────────────────────────────── */
function render(force) {
  if (force) state._cleared = false;
  const hasImage = state.layers.some(l => l.src);
  const isEmpty  = state._cleared && !hasImage && !state.textOn && state.accentMode === 'none' && !state.shadowOn && !state.borderOn;

  pvBanner.style.width        = A4_W + 'px';
  pvBanner.style.height       = state.height + 'px';
  pvBanner.style.borderRadius = state.radius + 'px';
  pvBanner.style.overflow     = 'hidden';
  pvBanner.style.flexDirection = state.accentPos === 'above' ? 'column-reverse' : 'column';
  pvBanner.style.filter       = state.shadowOn ? `drop-shadow(${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${state.shadowColor})` : 'none';
  pvBanner.style.boxShadow    = isEmpty ? 'none' : '0 8px 40px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06)';
  pvBanner.classList.toggle('empty', isEmpty);

  if (!isEmpty) {
    pvBanner.style.background     = `url(${renderPreviewBg()}) center/100% 100% no-repeat`;
    pvBanner.style.backgroundSize = '100% 100%';
  } else {
    pvBanner.style.background = '';
  }
  pvBanner.querySelectorAll('.pv-accent').forEach(el => el.remove());

  // Border overlay
  if (state.borderOn && !isEmpty) {
    pvBorderEl.style.border       = `${state.borderW}px solid ${state.borderColor}`;
    pvBorderEl.style.borderRadius = state.radius + 'px';
    pvBorderEl.style.display      = '';
  } else { pvBorderEl.style.display = 'none'; }

  // Image layers
  state.layers.forEach((layer, i) => {
    const el = pvImgEls[i];
    if (layer.src && currentMode === 'logo') {
      el.src = layer.src;
      el.style.display = '';
      el.style.width  = layer.w + 'px';
      el.style.height = (layer.lock || !layer.h) ? 'auto' : layer.h + 'px';
      el.style.left   = layer.x + 'px';
      el.style.top    = layer.y + 'px';
      el.classList.toggle('selected', layer.selected);
    } else {
      el.style.display = 'none';
    }
  });

  // Text
  if (state.textOn && state.textStr) {
    pvText.style.display    = '';
    pvText.style.fontFamily = state.textFont;
    pvText.style.fontWeight = state.textWeight;
    pvText.style.fontSize   = state.textSize + 'px';
    pvText.style.color      = state.textColor;
    pvText.style.textAlign  = state.textAlign;
    pvText.style.whiteSpace = 'pre-wrap'; // enables \n line breaks
    pvText.style.lineHeight = '1.25';
    pvText.classList.toggle('selected', state.textSelected);
    positionText();
    pvText.textContent = state.textStr;
  } else { pvText.style.display = 'none'; }

  scalePreview();
  updateDimLabel();
}

function scalePreview() {
  const avW = previewScroll.clientWidth - 48, avH = previewScroll.clientHeight - 48;
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
  previewDims.textContent = `preview ${A4_W}\u00d7${state.height}px  \u2502  export ${Math.round(A4_W*m.scale)}\u00d7${Math.round(state.height*m.scale)}px @ ${m.dpi}dpi`;
}

/* ─────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────── */
async function exportToPNG(overrideMode) {
  const m  = EXPORT_MODES[overrideMode || exportMode];
  const sc = m.scale;
  const outW = Math.round(A4_W * sc), outH = Math.round(state.height * sc);
  const r = Math.round(state.radius * sc);

  // Content canvas (no shadow)
  const content = document.createElement('canvas');
  content.width = outW; content.height = outH;
  const cc = content.getContext('2d');
  cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high';

  if (r > 0) { cc.beginPath(); cc.roundRect(0,0,outW,outH,r); cc.clip(); }

  // Background
  if (state.mode === 'logo') {
    const accH1 = state.accentMode !== 'none'  ? Math.round(state.accent1H*sc) : 0;
    const accH2 = state.accentMode === 'double' ? Math.round(state.accent2H*sc) : 0;
    const mainH = outH - accH1 - accH2;
    const mainY = state.accentPos === 'above' ? accH1+accH2 : 0;
    cc.save(); cc.beginPath(); cc.rect(0,mainY,outW,mainH); cc.clip();
    drawBackground(cc, outW, mainH, state); cc.restore();
    if (state.accentMode !== 'none') {
      if (state.accentPos === 'below') {
        cc.fillStyle = state.accent1; cc.fillRect(0, mainH, outW, accH1);
        if (state.accentMode === 'double') { cc.fillStyle = state.accent2; cc.fillRect(0, mainH+accH1, outW, accH2); }
      } else {
        cc.fillStyle = state.accent1; cc.fillRect(0,0,outW,accH1);
        if (state.accentMode === 'double') { cc.fillStyle = state.accent2; cc.fillRect(0,accH1,outW,accH2); }
      }
    }
  } else {
    drawBackground(cc, outW, outH, state);
  }

  // Image layers (1 = back, 4 = front — already in order)
  if (state.mode === 'logo') {
    for (const layer of state.layers) {
      if (!layer.src) continue;
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const dw = Math.round(layer.w * sc);
          const dh = (layer.lock || !layer.h)
            ? Math.round(img.naturalHeight * (dw / img.naturalWidth))
            : Math.round(layer.h * sc);
          cc.drawImage(img, Math.round(layer.x*sc), Math.round(layer.y*sc), dw, dh);
          resolve();
        };
        img.onerror = resolve; // skip broken images gracefully
        img.src = layer.src;
      });
    }
  }

  // Text — multi-line support
  if (state.textOn && state.textStr) {
    const bInset = state.borderOn ? Math.round((state.borderW+16)*sc) : Math.round(16*sc);
    cc.font = `${state.textWeight} ${Math.round(state.textSize*sc)}px ${state.textFont}`;
    cc.fillStyle = state.textColor; cc.textAlign = state.textAlign; cc.textBaseline = 'top';
    const lineH = Math.round(state.textSize * sc * 1.25);
    const tx = state.textAlign === 'center' ? outW/2 + Math.round(state.textX*sc)
             : state.textAlign === 'right'  ? outW - bInset - Math.round(state.textX*sc)
             : bInset + Math.round(state.textX*sc);
    const lines = state.textStr.split('\n');
    lines.forEach((line, i) => {
      cc.fillText(line, tx, Math.round(state.textY*sc) + i * lineH);
    });
  }

  // Border
  if (state.borderOn) {
    const bw = Math.round(state.borderW*sc);
    cc.strokeStyle = state.borderColor; cc.lineWidth = bw*2;
    if (r > 0) { cc.beginPath(); cc.roundRect(0,0,outW,outH,r); cc.stroke(); }
    else cc.strokeRect(0,0,outW,outH);
  }

  // Shadow compositing
  const pad = state.shadowOn ? Math.round((Math.abs(state.shadowX)+Math.abs(state.shadowY)+state.shadowBlur*2)*sc) : 0;
  const canvas = document.createElement('canvas');
  canvas.width = outW+pad*2; canvas.height = outH+pad*2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (state.shadowOn) {
    ctx.shadowOffsetX = state.shadowX*sc; ctx.shadowOffsetY = state.shadowY*sc;
    ctx.shadowBlur = state.shadowBlur*sc; ctx.shadowColor = state.shadowColor;
  }
  ctx.drawImage(content, pad, pad);
  return injectPHYs(canvas.toDataURL('image/png',1.0), m.dpi);
}

/* ─────────────────────────────────────────────────
   PNG pHYs DPI chunk
───────────────────────────────────────────────── */
function injectPHYs(dataUrl, dpi) {
  const b64=dataUrl.split(',')[1], bin=atob(b64), src=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) src[i]=bin.charCodeAt(i);
  const ppm=Math.round(dpi*39.3701);
  function u32be(n){return[(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff];}
  const ct=new Uint32Array(256);
  for(let i=0;i<256;i++){let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>>1)):(v>>>1);ct[i]=v;}
  function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=ct[(c^b[i])&0xff]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  const tb=[0x70,0x48,0x59,0x73], da=new Uint8Array([...u32be(ppm),...u32be(ppm),1]);
  const cv=crc32(new Uint8Array([...tb,...da])), ch=new Uint8Array([...u32be(9),...tb,...da,...u32be(cv)]);
  const out=new Uint8Array(src.length+ch.length);
  out.set(src.slice(0,33));out.set(ch,33);out.set(src.slice(33),33+ch.length);
  let s='';for(let i=0;i<out.length;i++)s+=String.fromCharCode(out[i]);
  return 'data:image/png;base64,'+btoa(s);
}

/* ─────────────────────────────────────────────────
   DOWNLOAD + SAVE
───────────────────────────────────────────────── */
btnDownload.addEventListener('click', async () => {
  const m = EXPORT_MODES[exportMode];
  btnDownload.textContent = '⏳ Generating…'; btnDownload.disabled = true;
  try {
    const dataUrl = await exportToPNG();
    const a = document.createElement('a');
    const name = (state.company||'banner').replace(/[^a-z0-9_\-]/gi,'_').toLowerCase();
    a.download = `${name}_${state.mode}_${m.dpi}dpi.png`;
    a.href = dataUrl; a.click();
    toast(`Downloaded ${Math.round(A4_W*m.scale)}\u00d7${Math.round(state.height*m.scale)}px @ ${m.dpi}dpi`);
  } catch(err){ console.error(err); toast('Export failed — see console');
  } finally { btnDownload.textContent = '⬇ Download PNG'; btnDownload.disabled = false; }
});

const LS_KEY = 'bannerCreator_recents', MAX_RECENTS = 5;
function getSaved(){try{return JSON.parse(localStorage.getItem(LS_KEY))||[];}catch{return[];}}

btnSave.addEventListener('click', async () => {
  if (!state.company.trim()) { toast('Enter a company name first'); return; }
  btnSave.textContent = '⏳ Saving…'; btnSave.disabled = true;
  try {
    const thumb = await exportToPNG('web');
    const recents = getSaved().filter(r => r.company !== state.company.trim());
    recents.unshift({ company: state.company.trim(), savedAt: Date.now(), thumb,
      mode: state.mode, state: JSON.stringify(state) });
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar(); toast(`"${state.company}" saved`);
  } catch(err){ console.error(err); toast('Save failed');
  } finally { btnSave.textContent = '💾 Save'; btnSave.disabled = false; }
});

function loadEntry(entry) {
  const saved = JSON.parse(entry.state);
  // Ensure layers array is full length
  if (!saved.layers || saved.layers.length < NUM_LAYERS) {
    saved.layers = Array.from({length: NUM_LAYERS}, (_, i) =>
      (saved.layers && saved.layers[i]) ? saved.layers[i] : defaultLayer()
    );
  }
  Object.assign(state, saved);
  currentMode = state.mode || 'logo';
  syncUIFromState(); render();
}
function deleteEntry(company) {
  localStorage.setItem(LS_KEY, JSON.stringify(getSaved().filter(r=>r.company!==company)));
  renderSidebar(); toast(`Deleted "${company}"`);
}
function renderSidebar() {
  const recents = getSaved(); recentList.innerHTML = '';
  if (!recents.length) { recentList.innerHTML = '<p class="empty-note">No saved banners yet.</p>'; return; }
  recents.forEach(entry => {
    const card = document.createElement('div'); card.className = 'recent-card';
    const del = document.createElement('button'); del.className='recent-card-del'; del.title='Delete'; del.textContent='\u2715';
    del.addEventListener('click', e=>{e.stopPropagation();deleteEntry(entry.company);});
    const mTag = document.createElement('div');
    mTag.style.cssText='font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:3px';
    mTag.textContent = entry.mode==='header'?'✦ Header':'🖼 Logo Banner';
    const thumb = document.createElement('img'); thumb.className='recent-card-thumb'; thumb.src=entry.thumb; thumb.alt=entry.company;
    const name  = document.createElement('div'); name.className='recent-card-name'; name.textContent=entry.company;
    const date  = document.createElement('div'); date.className='recent-card-date';
    date.textContent=new Date(entry.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    card.append(del,mTag,thumb,name,date);
    card.addEventListener('click',()=>loadEntry(entry));
    recentList.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────
   SYNC UI FROM STATE
───────────────────────────────────────────────── */
function syncUIFromState() {
  tabLogo.classList.toggle('active', currentMode==='logo');
  tabHeader.classList.toggle('active', currentMode==='header');
  segBgTypeLogo.style.display   = currentMode==='logo'   ? '' : 'none';
  segBgTypeHeader.style.display = currentMode==='header' ? '' : 'none';
  accentSection.style.display   = currentMode==='logo'   ? '' : 'none';
  logoSection.style.display     = currentMode==='logo'   ? '' : 'none';

  inpCompany.value = state.company;
  inpHeight.value  = state.height;  heightVal.textContent  = state.height+'px';
  inpRadius.value  = state.radius;  radiusVal.textContent  = state.radius+'px';

  if (currentMode==='logo') setSegActive(segBgTypeLogo, state.bgType);
  else setSegActive(segBgTypeHeader, state.bgType);
  setSegActive(segGradDir, state.gradDir||'135');
  updateBgControls();

  inpColor1.value=state.color1; inpHex1.value=state.color1; highlightSwatch('swatches-color1',state.color1);
  inpColor2.value=state.color2; inpHex2.value=state.color2; highlightSwatch('swatches-color2',state.color2);

  inpBorder.checked=state.borderOn; borderCtrls.style.display=state.borderOn?'':'none';
  inpBorderW.value=state.borderW; borderWVal.textContent=state.borderW+'px';
  inpBorderColor.value=state.borderColor; inpHexBorder.value=state.borderColor; highlightSwatch('swatches-border',state.borderColor);

  setSegActive(segAccent,state.accentMode); accentCtrls.style.display=state.accentMode==='none'?'none':''; accent2Wrap.style.display=state.accentMode==='double'?'':'none';
  setSegActive(segAccentPos,state.accentPos);
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

  // Sync layer cards
  state.layers.forEach((layer, i) => {
    const ui = layerUI[i];
    if (layer.src) {
      ui.thumb.src = layer.src; ui.thumb.style.display = 'block';
      ui.controls.style.display = '';
      ui.card.classList.add('has-image');
      ui.wSlider.value = layer.w; ui.wBadge.textContent = layer.w+'px';
      ui.dropText.textContent = 'Image loaded';
      const lockVal = layer.lock !== false ? 'locked' : 'free';
      [ui.lockBtn, ui.freeBtn].forEach(b => b.classList.toggle('active', b.dataset.val === lockVal));
      ui.hWrap.style.display = layer.lock ? 'none' : '';
      if (!layer.lock && layer.h) { ui.hSlider.value = layer.h; ui.hBadge.textContent = layer.h+'px'; }
    } else {
      ui.thumb.style.display = 'none'; ui.controls.style.display = 'none';
      ui.card.classList.remove('has-image','selected-layer');
      ui.dropText.textContent = 'Click or drag image here';
    }
  });
}

/* ─────────────────────────────────────────────────
   BRAND EXTRACTOR — right sidebar
───────────────────────────────────────────────── */
const beUrlInp     = $('be-url');
const beExtractBtn = $('be-extract-btn');
const beStatus     = $('be-status');
const beResults    = $('be-results');
const beColorsRow  = $('be-colors-row');
const beLogoWrap   = $('be-logo-preview-wrap');
const beLogoImg    = $('be-logo-preview');
const beNotes      = $('be-notes');
const beApplyAll   = $('be-apply-all');
const beReset      = $('be-reset');

let beExtracted = { primaryColor: null, secondaryColor: null, logoUrl: null };
let beSelectedColors = [];

beExtractBtn.addEventListener('click', async () => {
  const url = beUrlInp.value.trim();
  if (!url) { showBeStatus('Please enter a website URL', true); return; }
  beExtractBtn.disabled = true; beExtractBtn.textContent = '⏳ Extracting…';
  beResults.style.display = 'none';
  showBeStatus('Fetching website and analysing brand colors…');
  try {
    const resp = await fetch('/.netlify/functions/extract-brand', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error||'Extraction failed');
    beExtracted = data; showBeResults(data); beStatus.style.display = 'none';
  } catch(err) { showBeStatus('Could not extract brand data: '+err.message, true);
  } finally { beExtractBtn.disabled=false; beExtractBtn.textContent='✦ Extract Brand'; }
});

beReset.addEventListener('click', () => {
  beResults.style.display='none'; beStatus.style.display='none';
  beUrlInp.value=''; beExtracted={primaryColor:null,secondaryColor:null,logoUrl:null};
  beSelectedColors=[]; beUrlInp.focus();
});

function showBeStatus(msg, isError) {
  beStatus.textContent=msg; beStatus.className=isError?'error':''; beStatus.style.display='';
}

function showBeResults(data) {
  beColorsRow.innerHTML=''; beSelectedColors=[];
  const colors=[
    data.primaryColor   ? {hex:data.primaryColor,  label:'Primary'}   : null,
    data.secondaryColor ? {hex:data.secondaryColor,label:'Secondary'} : null,
  ].filter(Boolean);
  colors.forEach((c,i) => {
    const card=document.createElement('div'); card.className='be-color-card'+(i===0?' selected':'');
    if(i===0) beSelectedColors.push(c.hex);
    const swatch=document.createElement('div'); swatch.className='be-color-swatch'; swatch.style.background=c.hex;
    const hexEl=document.createElement('div'); hexEl.className='be-color-hex'; hexEl.textContent=c.hex;
    const lbl=document.createElement('div'); lbl.className='be-color-label'; lbl.textContent=c.label;
    card.append(swatch,hexEl,lbl);
    const colorObj=c;
    card.addEventListener('click',()=>{
      beColorsRow.querySelectorAll('.be-color-card').forEach(el=>el.classList.remove('selected'));
      card.classList.add('selected'); beSelectedColors=[colorObj.hex];
      state.color1=colorObj.hex; state._cleared=false;
      inpColor1.value=colorObj.hex; inpHex1.value=colorObj.hex;
      highlightSwatch('swatches-color1',colorObj.hex); render();
      toast(`Applied ${colorObj.label}: ${colorObj.hex}`);
    });
    beColorsRow.appendChild(card);
  });
  if (data.logoUrl) {
    beLogoImg.src=data.logoUrl;
    beLogoImg.onerror=()=>{beLogoWrap.style.display='none';};
    beLogoImg.onload=()=>{beLogoWrap.style.display='';};
    beLogoWrap.style.display=''; beApplyAll.style.display='';
  } else { beLogoWrap.style.display='none'; beApplyAll.style.display='none'; }
  const confClass=data.confidence||'medium';
  beNotes.innerHTML=`<span class="be-confidence ${confClass}">${confClass}</span>${data.notes||''}`;
  beResults.style.display='';
}

// Load logo into slot 1 (index 0)
beApplyAll.addEventListener('click', () => {
  if (beExtracted.logoUrl && currentMode==='logo') {
    state._cleared=false; loadLogoFromUrl(beExtracted.logoUrl, 0);
  } else if (currentMode!=='logo') {
    toast('Switch to Logo Banner mode to load a logo');
  }
});

function loadLogoFromUrl(url, layerIdx) {
  const img=new Image(); img.crossOrigin='anonymous';
  img.onload=()=>{
    const c=document.createElement('canvas');
    c.width=img.naturalWidth; c.height=img.naturalHeight;
    c.getContext('2d').drawImage(img,0,0);
    try { applyLogoDataUrl(c.toDataURL('image/png'), img.naturalWidth, img.naturalHeight, layerIdx); }
    catch(e) { loadLogoViaProxy(url, layerIdx); }
  };
  img.onerror=()=>loadLogoViaProxy(url, layerIdx);
  img.src=url;
}

function applyLogoDataUrl(dataUrl, nw, nh, layerIdx) {
  const layer = state.layers[layerIdx];
  layer.src  = dataUrl; layer.w = Math.min(200, nw); layer.h = null; layer.lock = true;
  layer.x    = 40; layer.y = Math.round((state.height - layer.w/(nw/nh))/2);
  state._cleared = false;
  const ui = layerUI[layerIdx];
  ui.thumb.src = dataUrl; ui.thumb.style.display = 'block';
  ui.controls.style.display = ''; ui.card.classList.add('has-image');
  ui.wSlider.value = layer.w; ui.wBadge.textContent = layer.w+'px';
  ui.dropText.textContent = 'Logo loaded from URL';
  // Expand that card
  ui.body.style.display = ''; ui.toggle.textContent = '▼';
  render(); toast(`Logo loaded into Image ${layerIdx+1}`);
}

async function loadLogoViaProxy(url, layerIdx) {
  try {
    showBeStatus('Loading logo via proxy…');
    const resp=await fetch('/.netlify/functions/extract-brand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({proxyUrl:url})});
    if(!resp.ok) throw new Error('Proxy fetch failed');
    const data=await resp.json();
    if(!data.dataUrl) throw new Error('No image data returned');
    const img2=new Image();
    img2.onload=()=>{ applyLogoDataUrl(data.dataUrl, img2.naturalWidth, img2.naturalHeight, layerIdx); beStatus.style.display='none'; };
    img2.onerror=()=>showBeStatus('Logo could not load — please upload manually',true);
    img2.src=data.dataUrl;
  } catch(err) { showBeStatus('Logo could not load — please upload manually',true); }
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
buildLayerCards();
buildPreviewImageEls();
buildSwatches('swatches-color1',  inpColor1,     inpHex1,      'color1');
buildSwatches('swatches-color2',  inpColor2,     inpHex2,      'color2');
buildSwatches('swatches-accent1', inpAccent1,    inpHexA1,     'accent1');
buildSwatches('swatches-accent2', inpAccent2,    inpHexA2,     'accent2');
buildSwatches('swatches-border',  inpBorderColor,inpHexBorder, 'borderColor');
buildSwatches('swatches-text',    inpTextColor,  inpHexText,   'textColor', SWATCHES_TEXT);
highlightSwatch('swatches-color1', state.color1);
highlightSwatch('swatches-color2', state.color2);
highlightSwatch('swatches-border', state.borderColor);
highlightSwatch('swatches-text',   state.textColor);
renderSidebar();
syncUIFromState();
render();
