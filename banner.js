/* ═══════════════════════════════════════════════════
   BANNER CREATOR — banner.js
   Salesbuildr Design System v1.1
═══════════════════════════════════════════════════ */

const A4_W      = 794;
const A4_H      = 1123;  // A4 at 96dpi
const SCALE     = 3.125; // 300dpi export
const DPI       = 300;

let currentMode   = 'logo';   // 'logo' | 'header'
let canvasSize    = 'banner'; // 'banner' | 'a4'

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
const SWATCHES_TEXT = [{ hex: '#ffffff', label: 'White' }, ...SWATCHES];

/* ═══════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════ */
function defaultState() {
  return {
    mode:        'logo',
    canvasSize:  'banner',
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
    textSelected:false,
    subOn:       false,
    subStr:      '',
    subFont:     'Arial, sans-serif',
    subWeight:   '400',
    subSize:     20,
    subAlign:    'left',
    subColor:    '#dddddd',
    subX:        40,
    subY:        100,
    subSelected: false,
    layers:      [],   // unified image + shape layers
    _cleared:    true,
  };
}

let state = defaultState();

/* ── Layer helpers ──────────────────────────────── */
function defaultImageLayer() {
  return {
    id:       Date.now() + Math.random(),
    type:     'image',
    name:     'Image',
    src:      null,
    w:        200,
    h:        null,
    lock:     true,
    opacity:  100,
    x:        40,
    y:        40,
    selected: false,
  };
}
function defaultShapeLayer() {
  return {
    id:       Date.now() + Math.random(),
    type:     'shape',
    name:     'Shape',
    shape:    'rect',   // 'rect' | 'circle' | 'triangle'
    color:    '#2e74dc',
    opacity:  100,
    w:        120,
    h:        80,
    rotation: 0,
    x:        100,
    y:        100,
    selected: false,
  };
}
function getCanvasH() {
  return (state.canvasSize === 'a4') ? A4_H : state.height;
}

/* ═══════════════════════════════════════════════════
   DOM
═══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const inpCompany     = $('inp-company');
const segCanvasSize  = $('seg-canvas-size');
const heightSection  = $('height-section');
const inpHeight      = $('inp-height');
const heightVal      = $('height-val');
const inpRadius      = $('inp-radius');
const radiusVal      = $('radius-val');
const segBgTypeLogo  = $('seg-bg-type-logo');
const segBgTypeHdr   = $('seg-bg-type-header');
const gradDirWrap    = $('grad-dir-wrap');
const segGradDir     = $('seg-grad-dir');
const inpColor1      = $('inp-color1');
const inpHex1        = $('inp-hex1');
const color1Label    = $('color1-label');
const gradColorWrap  = $('grad-color-wrap');
const inpColor2      = $('inp-color2');
const inpHex2        = $('inp-hex2');
const color2Label    = $('color2-label');
const inpBorder      = $('inp-border');
const borderCtrls    = $('border-controls');
const inpBorderW     = $('inp-border-w');
const borderWVal     = $('border-w-val');
const inpBorderColor = $('inp-border-color');
const inpHexBorder   = $('inp-hex-border');
const accentSection  = $('accent-section');
const segAccent      = $('seg-accent');
const accentCtrls    = $('accent-controls');
const segAccentPos   = $('seg-accent-pos');
const inpAccent1     = $('inp-accent1');
const inpHexA1       = $('inp-hex-a1');
const inpAh1         = $('inp-ah1');
const ah1Val         = $('ah1-val');
const accent2Wrap    = $('accent2-wrap');
const inpAccent2     = $('inp-accent2');
const inpHexA2       = $('inp-hex-a2');
const inpAh2         = $('inp-ah2');
const ah2Val         = $('ah2-val');
const inpShadow      = $('inp-shadow');
const shadowCtrls    = $('shadow-controls');
const inpShadowX     = $('inp-shadow-x');
const shadowXVal     = $('shadow-x-val');
const inpShadowY     = $('inp-shadow-y');
const shadowYVal     = $('shadow-y-val');
const inpShadowBlur  = $('inp-shadow-blur');
const shadowBlurVal  = $('shadow-blur-val');
const inpShadowColor = $('inp-shadow-color');
const inpHexShadow   = $('inp-hex-shadow');
const inpTextOn      = $('inp-text-on');
const textCtrls      = $('text-controls');
const inpText        = $('inp-text');
const inpFont        = $('inp-font');
const segFontWeight  = $('seg-font-weight');
const inpFontSize    = $('inp-font-size');
const fontSizeVal    = $('font-size-val');
const segTextAlign   = $('seg-text-align');
const inpTextColor   = $('inp-text-color');
const inpHexText     = $('inp-hex-text');
const inpSubOn       = $('inp-sub-on');
const subCtrls       = $('sub-controls');
const inpSub         = $('inp-sub');
const inpSubFont     = $('inp-sub-font');
const segSubWeight   = $('seg-sub-weight');
const inpSubSize     = $('inp-sub-size');
const subSizeVal     = $('sub-size-val');
const segSubAlign    = $('seg-sub-align');
const inpSubColor    = $('inp-sub-color');
const inpHexSub      = $('inp-hex-sub');
const layersList     = $('layers-list');
const layerCountBadge= $('layer-count-badge');
const btnAddImage    = $('btn-add-image');
const btnAddShape    = $('btn-add-shape');
const pvBanner       = $('preview-banner');
const pvMain         = $('pv-main');
const pvLayersEl     = $('pv-layers');
const pvText         = $('pv-text');
const pvSub          = $('pv-sub');
const pvBorderEl     = $('pv-border');
const previewOuter   = $('preview-outer');
const previewScroll  = $('preview-scroll');
const previewDims    = $('preview-dims');
const btnSave        = $('btn-save');
const btnClear       = $('btn-clear');
const btnUndo        = $('btn-undo');
const btnDownload    = $('btn-download');
const recentList     = $('recent-list');
const tabLogo        = $('tab-logo');
const tabHeader      = $('tab-header');

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
let toastTimer;
function toast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ═══════════════════════════════════════════════════
   UNDO
═══════════════════════════════════════════════════ */
const UNDO_LIMIT = 30;
const undoStack  = [];
let   undoPaused = false;

function pushHistory() {
  if (undoPaused) return;
  undoStack.push(JSON.parse(JSON.stringify(state)));
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  updateUndoBtn();
}
function updateUndoBtn() {
  if (btnUndo) btnUndo.disabled = undoStack.length === 0;
}
function doUndo() {
  if (!undoStack.length) return;
  undoPaused = true;
  Object.assign(state, undoStack.pop());
  currentMode  = state.mode || 'logo';
  canvasSize   = state.canvasSize || 'banner';
  syncUIFromState();
  rebuildLayerPreviews();
  undoPaused = false;
  render();
  updateUndoBtn();
  toast('↩ Undone');
}
btnUndo.addEventListener('click', doUndo);
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
});

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
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
function syncColor(picker, hexInp, key, swatchId) {
  const upd = v => {
    pushHistory();
    state[key] = v; state._cleared = false;
    picker.value = v; hexInp.value = v;
    if (swatchId) highlightSwatch(swatchId, v);
    render();
  };
  picker.addEventListener('input', () => upd(picker.value));
  hexInp.addEventListener('input', () => { if (/^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) upd(hexInp.value.trim()); });
}
function buildSwatches(containerId, picker, hexInp, key, list) {
  const row = $(containerId); if (!row) return;
  (list || SWATCHES).forEach(sw => {
    const btn = document.createElement('button');
    btn.className = 'swatch'; btn.title = sw.label;
    btn.dataset.hex = sw.hex; btn.style.background = sw.hex;
    btn.addEventListener('click', () => {
      pushHistory(); state[key] = sw.hex; state._cleared = false;
      picker.value = sw.hex; hexInp.value = sw.hex;
      highlightSwatch(containerId, sw.hex); render(true);
    });
    row.appendChild(btn);
  });
}
function highlightSwatch(containerId, hex) {
  const row = $(containerId); if (!row) return;
  row.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.hex.toLowerCase() === (hex||'').toLowerCase())
  );
}
function sliderHistory(el) {
  if (!el) return;
  el.addEventListener('mousedown', () => pushHistory());
  el.addEventListener('touchstart', () => pushHistory(), { passive: true });
}

/* ═══════════════════════════════════════════════════
   MODE + CANVAS SIZE
═══════════════════════════════════════════════════ */
function setMode(mode) {
  currentMode = mode; state.mode = mode;
  tabLogo.classList.toggle('active',   mode === 'logo');
  tabHeader.classList.toggle('active', mode === 'header');
  segBgTypeLogo.style.display  = mode === 'logo'   ? '' : 'none';
  segBgTypeHdr.style.display   = mode === 'header' ? '' : 'none';
  accentSection.style.display  = mode === 'logo'   ? '' : 'none';
  $('size-section').style.display = mode === 'logo' ? '' : 'none';
  $('layers-section').style.display = mode === 'logo' ? '' : 'none';
  if (mode === 'logo' && (state.bgType === 'spotlight' || state.bgType === 'streaks')) {
    state.bgType = 'solid'; setSegActive(segBgTypeLogo, 'solid');
  }
  pvBanner.style.background = ''; pvMain.style.background = '';
  state._cleared = true;
  updateBgControls(); render();
}
tabLogo.addEventListener('click',   () => setMode('logo'));
tabHeader.addEventListener('click', () => setMode('header'));

initSeg(segCanvasSize, val => {
  canvasSize = val; state.canvasSize = val;
  heightSection.style.display = val === 'a4' ? 'none' : '';
  render();
});

function updateBgControls() {
  const t = state.bgType;
  gradColorWrap.style.display = (t === 'gradient' || t === 'spotlight') ? '' : 'none';
  gradDirWrap.style.display   = (t === 'gradient') ? '' : 'none';
  if (t === 'spotlight')      { color1Label.textContent = 'Base Color'; color2Label.textContent = 'Highlight Color'; }
  else if (t === 'gradient')  { color1Label.textContent = 'Gradient Start'; color2Label.textContent = 'Gradient End'; }
  else                        { color1Label.textContent = 'Main Color'; }
}

/* ═══════════════════════════════════════════════════
   CONTROL WIRING
═══════════════════════════════════════════════════ */
inpCompany.addEventListener('input', () => { state.company = inpCompany.value; });

sliderHistory(inpHeight); sliderHistory(inpRadius); sliderHistory(inpBorderW);
sliderHistory(inpAh1); sliderHistory(inpAh2);
sliderHistory(inpShadowX); sliderHistory(inpShadowY); sliderHistory(inpShadowBlur);
sliderHistory(inpFontSize); sliderHistory(inpSubSize);

inpHeight.addEventListener('input', () => { state.height = +inpHeight.value; heightVal.textContent = state.height + 'px'; render(); });
inpRadius.addEventListener('input', () => { state.radius = +inpRadius.value; radiusVal.textContent = state.radius + 'px'; render(); });

initSeg(segBgTypeLogo, v => { state.bgType = v; updateBgControls(); render(); });
initSeg(segBgTypeHdr,  v => { state.bgType = v; updateBgControls(); render(); });
initSeg(segGradDir,    v => { state.gradDir = v; render(); });
syncColor(inpColor1, inpHex1, 'color1', 'swatches-color1');
syncColor(inpColor2, inpHex2, 'color2', 'swatches-color2');

inpBorder.addEventListener('change', () => { pushHistory(); state.borderOn = inpBorder.checked; borderCtrls.style.display = state.borderOn ? '' : 'none'; render(); });
inpBorderW.addEventListener('input', () => { state.borderW = +inpBorderW.value; borderWVal.textContent = state.borderW + 'px'; render(); });
syncColor(inpBorderColor, inpHexBorder, 'borderColor', 'swatches-border');

initSeg(segAccent, v => { state.accentMode = v; accentCtrls.style.display = v === 'none' ? 'none' : ''; accent2Wrap.style.display = v === 'double' ? '' : 'none'; render(); });
initSeg(segAccentPos, v => { state.accentPos = v; render(); });
syncColor(inpAccent1, inpHexA1, 'accent1', 'swatches-accent1');
syncColor(inpAccent2, inpHexA2, 'accent2', 'swatches-accent2');
inpAh1.addEventListener('input', () => { state.accent1H = +inpAh1.value; ah1Val.textContent = state.accent1H + 'px'; render(); });
inpAh2.addEventListener('input', () => { state.accent2H = +inpAh2.value; ah2Val.textContent = state.accent2H + 'px'; render(); });

inpShadow.addEventListener('change', () => { pushHistory(); state.shadowOn = inpShadow.checked; shadowCtrls.style.display = state.shadowOn ? '' : 'none'; render(); });
inpShadowX.addEventListener('input', () => { state.shadowX = +inpShadowX.value; shadowXVal.textContent = state.shadowX + 'px'; render(); });
inpShadowY.addEventListener('input', () => { state.shadowY = +inpShadowY.value; shadowYVal.textContent = state.shadowY + 'px'; render(); });
inpShadowBlur.addEventListener('input', () => { state.shadowBlur = +inpShadowBlur.value; shadowBlurVal.textContent = state.shadowBlur + 'px'; render(); });
syncColor(inpShadowColor, inpHexShadow, 'shadowColor', null);

inpTextOn.addEventListener('change', () => { pushHistory(); state.textOn = inpTextOn.checked; if (state.textOn) state._cleared = false; textCtrls.style.display = state.textOn ? '' : 'none'; render(); });
inpText.addEventListener('input', () => { pushHistory(); state.textStr = inpText.value; render(); });
inpText.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); });
inpFont.addEventListener('change', () => { pushHistory(); state.textFont = inpFont.value; render(); });
initSeg(segFontWeight, v => { state.textWeight = v; render(); });
inpFontSize.addEventListener('input', () => { state.textSize = +inpFontSize.value; fontSizeVal.textContent = state.textSize + 'px'; render(); });
initSeg(segTextAlign, v => { state.textAlign = v; state.textX = 0; render(); });
syncColor(inpTextColor, inpHexText, 'textColor', 'swatches-text');

inpSubOn.addEventListener('change', () => { pushHistory(); state.subOn = inpSubOn.checked; if (state.subOn) state._cleared = false; subCtrls.style.display = state.subOn ? '' : 'none'; render(); });
inpSub.addEventListener('input', () => { pushHistory(); state.subStr = inpSub.value; render(); });
inpSub.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault(); });
inpSubFont.addEventListener('change', () => { pushHistory(); state.subFont = inpSubFont.value; render(); });
initSeg(segSubWeight, v => { state.subWeight = v; render(); });
inpSubSize.addEventListener('input', () => { state.subSize = +inpSubSize.value; subSizeVal.textContent = state.subSize + 'px'; render(); });
initSeg(segSubAlign, v => { state.subAlign = v; state.subX = 0; render(); });
syncColor(inpSubColor, inpHexSub, 'subColor', 'swatches-sub');

/* ═══════════════════════════════════════════════════
   LAYER CARDS — unified image + shape
═══════════════════════════════════════════════════ */
btnAddImage.addEventListener('click', () => {
  pushHistory();
  state.layers.push(defaultImageLayer());
  state._cleared = false;
  rebuildLayerCards();
  rebuildLayerPreviews();
  render();
  // Scroll to bottom of controls to show new layer
  $('controls').scrollTop = $('controls').scrollHeight;
});

btnAddShape.addEventListener('click', () => {
  pushHistory();
  state.layers.push(defaultShapeLayer());
  state._cleared = false;
  rebuildLayerCards();
  rebuildLayerPreviews();
  render();
  $('controls').scrollTop = $('controls').scrollHeight;
});

// Rebuild all layer cards from state
function rebuildLayerCards() {
  layersList.innerHTML = '';
  layerCountBadge.textContent = state.layers.length;
  state.layers.forEach((layer, idx) => {
    const card = buildLayerCard(layer, idx);
    layersList.appendChild(card);
  });
}

function buildLayerCard(layer, idx) {
  const card = document.createElement('div');
  card.className = 'layer-card' + (layer.src || layer.type === 'shape' ? ' has-content' : '');
  card.id = `layer-card-${layer.id}`;

  // Header
  const header = document.createElement('div');
  header.className = 'layer-header';

  const num = document.createElement('div');
  num.className = 'layer-num'; num.textContent = idx + 1;

  const badge = document.createElement('span');
  badge.className = `layer-type-badge ${layer.type}`;
  badge.textContent = layer.type === 'image' ? 'IMG' : 'SHAPE';

  const nameEl = document.createElement('div');
  nameEl.className = 'layer-name';
  nameEl.textContent = layer.type === 'image'
    ? (layer.name || 'Image')
    : (layer.shape ? layer.shape.charAt(0).toUpperCase() + layer.shape.slice(1) : 'Shape');

  const thumb = document.createElement('img');
  thumb.className = 'layer-thumb';
  if (layer.src) { thumb.src = layer.src; thumb.style.display = 'block'; }

  const toggle = document.createElement('span');
  toggle.className = 'layer-toggle'; toggle.textContent = '▼';

  header.append(num, badge, nameEl, thumb, toggle);

  // Body
  const body = document.createElement('div');
  body.className = 'layer-body';

  // Order buttons
  const orderRow = document.createElement('div'); orderRow.className = 'layer-order-row';
  const btnBack  = document.createElement('button'); btnBack.className  = 'btn-layer-order'; btnBack.textContent  = '↓ Back';
  const btnFwd   = document.createElement('button'); btnFwd.className   = 'btn-layer-order'; btnFwd.textContent   = '↑ Forward';
  const btnTop   = document.createElement('button'); btnTop.className   = 'btn-layer-order'; btnTop.textContent   = '⤒ Top';
  orderRow.append(btnBack, btnFwd, btnTop);

  // Opacity slider (all layers)
  const opRow = makeSliderRow('Opacity', layer.opacity + '%', 0, 100, layer.opacity, v => {
    pushHistory(); state.layers[getLayerIdx(layer.id)].opacity = +v; render();
  });

  let typeBody;
  if (layer.type === 'image') {
    typeBody = buildImageLayerBody(layer, thumb, nameEl, card);
  } else {
    typeBody = buildShapeLayerBody(layer);
  }

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-layer-remove'; removeBtn.textContent = '✕ Remove Layer';

  body.append(orderRow, opRow, typeBody, removeBtn);
  card.append(header, body);

  // ── Events ──
  header.addEventListener('click', () => {
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    toggle.textContent = open ? '▶' : '▼';
  });

  btnBack.addEventListener('click', e => { e.stopPropagation(); swapLayers(getLayerIdx(layer.id), getLayerIdx(layer.id) - 1); });
  btnFwd.addEventListener('click',  e => { e.stopPropagation(); swapLayers(getLayerIdx(layer.id), getLayerIdx(layer.id) + 1); });
  btnTop.addEventListener('click',  e => {
    e.stopPropagation();
    pushHistory();
    const i = getLayerIdx(layer.id);
    if (i < state.layers.length - 1) {
      const l = state.layers.splice(i, 1)[0];
      state.layers.push(l);
      rebuildLayerCards(); rebuildLayerPreviews(); render();
    }
  });

  removeBtn.addEventListener('click', () => {
    pushHistory();
    state.layers = state.layers.filter(l => l.id !== layer.id);
    rebuildLayerCards(); rebuildLayerPreviews(); render();
    toast('Layer removed');
  });

  return card;
}

function buildImageLayerBody(layer, thumb, nameEl, card) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';

  // Drop zone
  const dropLabel = document.createElement('label'); dropLabel.className = 'file-drop';
  const fileInp   = document.createElement('input'); fileInp.type = 'file'; fileInp.accept = 'image/*';
  const dropText  = document.createElement('span');
  dropText.textContent = layer.src ? layer.name : 'Click or drag image here';
  dropLabel.append(fileInp, dropText);

  // Width slider
  const wRow = makeSliderRow('Width', layer.w + 'px', 40, 900, layer.w, v => {
    pushHistory(); state.layers[getLayerIdx(layer.id)].w = +v; render();
  });

  // Aspect lock
  const lockRow = document.createElement('div'); lockRow.className = 'ctrl-group';
  const lockLbl = document.createElement('label'); lockLbl.className = 'ctrl-label'; lockLbl.textContent = 'Height';
  const lockSeg = document.createElement('div'); lockSeg.className = 'seg-control';
  const lockBtn = document.createElement('button'); lockBtn.className = 'seg' + (layer.lock !== false ? ' active' : ''); lockBtn.dataset.val = 'locked'; lockBtn.textContent = '⛓ Locked';
  const freeBtn = document.createElement('button'); freeBtn.className = 'seg' + (layer.lock === false ? ' active' : ''); freeBtn.dataset.val = 'free'; freeBtn.textContent = 'Free';
  lockSeg.append(lockBtn, freeBtn);
  lockRow.append(lockLbl, lockSeg);

  const hWrap = document.createElement('div'); hWrap.style.display = layer.lock !== false ? 'none' : '';
  const hRow = makeSliderRow('Free Height', (layer.h || 100) + 'px', 20, 900, layer.h || 100, v => {
    pushHistory(); state.layers[getLayerIdx(layer.id)].h = +v; render();
  });
  hWrap.appendChild(hRow);

  [lockBtn, freeBtn].forEach(btn => {
    btn.addEventListener('click', () => {
      [lockBtn, freeBtn].forEach(b => b.classList.remove('active')); btn.classList.add('active');
      pushHistory();
      state.layers[getLayerIdx(layer.id)].lock = btn.dataset.val === 'locked';
      hWrap.style.display = btn.dataset.val === 'locked' ? 'none' : '';
      render();
    });
  });

  // File events
  fileInp.addEventListener('change', e => { if (e.target.files[0]) loadImageToLayer(e.target.files[0], layer.id, dropText, thumb, nameEl, card); });
  dropLabel.addEventListener('dragover', e => { e.preventDefault(); dropLabel.style.borderColor = 'var(--accent)'; });
  dropLabel.addEventListener('dragleave', () => { dropLabel.style.borderColor = ''; });
  dropLabel.addEventListener('drop', e => {
    e.preventDefault(); dropLabel.style.borderColor = '';
    if (e.dataTransfer.files[0]) loadImageToLayer(e.dataTransfer.files[0], layer.id, dropText, thumb, nameEl, card);
  });

  wrap.append(dropLabel, wRow, lockRow, hWrap);
  return wrap;
}

function buildShapeLayerBody(layer) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '8px';

  // Shape selector
  const shapeRow = document.createElement('div'); shapeRow.className = 'ctrl-group';
  const shapeLbl = document.createElement('label'); shapeLbl.className = 'ctrl-label'; shapeLbl.textContent = 'Shape';
  const shapeSeg = document.createElement('div'); shapeSeg.className = 'seg-control';
  ['rect','circle','triangle'].forEach(s => {
    const btn = document.createElement('button'); btn.className = 'seg' + (layer.shape === s ? ' active' : '');
    btn.textContent = s.charAt(0).toUpperCase() + s.slice(1);
    btn.addEventListener('click', () => {
      shapeSeg.querySelectorAll('.seg').forEach(b => b.classList.remove('active')); btn.classList.add('active');
      pushHistory(); state.layers[getLayerIdx(layer.id)].shape = s; render();
    });
    shapeSeg.appendChild(btn);
  });
  shapeRow.append(shapeLbl, shapeSeg);

  // Color
  const colorRow = document.createElement('div'); colorRow.className = 'ctrl-group';
  const colorLbl = document.createElement('label'); colorLbl.className = 'ctrl-label'; colorLbl.textContent = 'Color';
  const swRow = document.createElement('div'); swRow.className = 'layer-swatch-row';
  const picker = document.createElement('input'); picker.type = 'color'; picker.value = layer.color;
  const hexInp = document.createElement('input'); hexInp.type = 'text'; hexInp.value = layer.color; hexInp.className = 'hex-inp'; hexInp.maxLength = 7;
  const cr = document.createElement('div'); cr.className = 'color-row'; cr.append(picker, hexInp);

  SWATCHES.forEach(sw => {
    const s = document.createElement('button'); s.className = 'layer-swatch'; s.style.background = sw.hex; s.title = sw.label;
    if (layer.color === sw.hex) s.classList.add('active');
    s.addEventListener('click', () => {
      pushHistory();
      const i = getLayerIdx(layer.id);
      state.layers[i].color = sw.hex;
      picker.value = sw.hex; hexInp.value = sw.hex;
      swRow.querySelectorAll('.layer-swatch').forEach(el => el.classList.toggle('active', el.style.background === sw.hex || el.style.backgroundColor === sw.hex));
      render();
    });
    swRow.appendChild(s);
  });
  picker.addEventListener('input', () => {
    pushHistory(); state.layers[getLayerIdx(layer.id)].color = picker.value; hexInp.value = picker.value; render();
  });
  hexInp.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) {
      pushHistory(); state.layers[getLayerIdx(layer.id)].color = hexInp.value.trim(); picker.value = hexInp.value.trim(); render();
    }
  });
  colorRow.append(colorLbl, swRow, cr);

  // Width, Height, Rotation
  const wRow = makeSliderRow('Width',    layer.w + 'px',  20, 900, layer.w,        v => { pushHistory(); state.layers[getLayerIdx(layer.id)].w = +v; render(); });
  const hRow = makeSliderRow('Height',   layer.h + 'px',  20, 900, layer.h,        v => { pushHistory(); state.layers[getLayerIdx(layer.id)].h = +v; render(); });
  const rRow = makeSliderRow('Rotation', layer.rotation + '°', 0, 360, layer.rotation, v => { pushHistory(); state.layers[getLayerIdx(layer.id)].rotation = +v; render(); });

  wrap.append(shapeRow, colorRow, wRow, hRow, rRow);
  return wrap;
}

function makeSliderRow(label, initVal, min, max, value, onChange) {
  const wrap = document.createElement('div'); wrap.className = 'ctrl-group';
  const lbl  = document.createElement('label'); lbl.className = 'ctrl-label';
  const badge = document.createElement('span'); badge.className = 'val-badge'; badge.textContent = initVal;
  lbl.textContent = label + ' '; lbl.appendChild(badge);
  const slider = document.createElement('input'); slider.type = 'range';
  slider.min = min; slider.max = max; slider.value = value;
  slider.addEventListener('mousedown', () => pushHistory());
  slider.addEventListener('input', () => { badge.textContent = slider.value + (label === 'Opacity' ? '%' : label === 'Rotation' ? '°' : 'px'); onChange(slider.value); });
  wrap.append(lbl, slider);
  return wrap;
}

function getLayerIdx(id) { return state.layers.findIndex(l => l.id === id); }

function swapLayers(a, b) {
  if (b < 0) { toast('Already at bottom (back)'); return; }
  if (b >= state.layers.length) { toast('Already at top (front)'); return; }
  pushHistory();
  [state.layers[a], state.layers[b]] = [state.layers[b], state.layers[a]];
  rebuildLayerCards(); rebuildLayerPreviews(); render();
  toast('Layer moved ' + (b > a ? 'forward ↑' : 'back ↓'));
}

function loadImageToLayer(file, layerId, dropText, thumb, nameEl, card) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const i = getLayerIdx(layerId);
      if (i < 0) return;
      const layer = state.layers[i];
      layer.src  = ev.target.result;
      layer.name = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
      layer.w    = Math.min(200, img.naturalWidth);
      layer.h    = null; layer.lock = true;
      layer.x    = 40;
      layer.y    = Math.round((getCanvasH() - layer.w / (img.naturalWidth / img.naturalHeight)) / 2);
      state._cleared = false;
      dropText.textContent = layer.name;
      thumb.src = ev.target.result; thumb.style.display = 'block';
      nameEl.textContent = layer.name;
      card.classList.add('has-content');
      rebuildLayerPreviews(); render();
      toast('Image loaded');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════
   PREVIEW ELEMENTS — one DOM el per layer
═══════════════════════════════════════════════════ */
// Map: layerId → {el, svgEl}
const layerEls = new Map();

function rebuildLayerPreviews() {
  // Remove els for deleted layers
  layerEls.forEach((obj, id) => {
    if (!state.layers.find(l => l.id === id)) {
      if (obj.el.parentNode) obj.el.parentNode.removeChild(obj.el);
      layerEls.delete(id);
    }
  });
  // Add els for new layers
  state.layers.forEach(layer => {
    if (!layerEls.has(layer.id)) {
      const el = document.createElement('div');
      el.className = 'pv-layer-el';
      el.dataset.lid = layer.id;
      layerEls.set(layer.id, { el });
      // Wire drag
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        selectLayer(layer.id);
        startLayerDrag(e, layer.id);
      });
    }
  });
  // ── Reorder DOM to match state.layers order (bottom→top = first→last child) ──
  pvLayersEl.innerHTML = '';
  state.layers.forEach(layer => {
    const obj = layerEls.get(layer.id);
    if (obj) pvLayersEl.appendChild(obj.el);
  });
}

function selectLayer(id) {
  state.layers.forEach(l => { l.selected = l.id === id; });
  state.textSelected = false; state.subSelected = false;
  pvText.classList.remove('selected'); pvSub.classList.remove('selected');
  layerEls.forEach((obj, lid) => obj.el.classList.toggle('selected', lid === id));
  // highlight card
  document.querySelectorAll('.layer-card').forEach(c => c.classList.remove('selected-layer'));
  const card = $(`layer-card-${id}`);
  if (card) card.classList.add('selected-layer');
}

/* ═══════════════════════════════════════════════════
   DRAG + NUDGE
═══════════════════════════════════════════════════ */
let dragging = false, dragCtx = null;
let dragSX, dragSY, dragOX, dragOY;

function startLayerDrag(e, id) {
  dragging = true;
  const layer = state.layers.find(l => l.id === id);
  dragCtx  = { type: 'layer', id };
  dragSX   = e.clientX; dragSY = e.clientY;
  dragOX   = layer.x;  dragOY = layer.y;
}

pvText.addEventListener('mousedown', e => {
  if (!state.textOn || !state.textStr) return;
  state.textSelected = true; state.subSelected = false;
  state.layers.forEach(l => { l.selected = false; });
  pvText.classList.add('selected'); pvSub.classList.remove('selected');
  layerEls.forEach(obj => obj.el.classList.remove('selected'));
  document.querySelectorAll('.layer-card').forEach(c => c.classList.remove('selected-layer'));
  dragging = true; dragCtx = { type: 'text' };
  dragSX = e.clientX; dragSY = e.clientY; dragOX = state.textX; dragOY = state.textY;
  pvText.style.cursor = 'grabbing'; e.preventDefault();
});

pvSub.addEventListener('mousedown', e => {
  if (!state.subOn || !state.subStr) return;
  state.subSelected = true; state.textSelected = false;
  state.layers.forEach(l => { l.selected = false; });
  pvSub.classList.add('selected'); pvText.classList.remove('selected');
  layerEls.forEach(obj => obj.el.classList.remove('selected'));
  document.querySelectorAll('.layer-card').forEach(c => c.classList.remove('selected-layer'));
  dragging = true; dragCtx = { type: 'sub' };
  dragSX = e.clientX; dragSY = e.clientY; dragOX = state.subX; dragOY = state.subY;
  pvSub.style.cursor = 'grabbing'; e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!dragging || !dragCtx) return;
  const sc = getScale();
  const dx = Math.round((e.clientX - dragSX) / sc);
  const dy = Math.round((e.clientY - dragSY) / sc);
  if (dragCtx.type === 'layer') {
    const i = getLayerIdx(dragCtx.id);
    if (i < 0) return;
    state.layers[i].x = dragOX + dx;
    state.layers[i].y = dragOY + dy;
    positionLayerEl(state.layers[i]);
  } else if (dragCtx.type === 'text') {
    state.textX = dragOX + dx; state.textY = dragOY + dy; positionText();
  } else if (dragCtx.type === 'sub') {
    state.subX = dragOX + dx; state.subY = dragOY + dy; positionSub();
  }
});

document.addEventListener('mouseup', () => {
  if (dragging && dragCtx) {
    if (dragCtx.type === 'text') pvText.style.cursor = 'grab';
    else if (dragCtx.type === 'sub') pvSub.style.cursor = 'grab';
    else {
      const obj = layerEls.get(dragCtx.id);
      if (obj) obj.el.style.cursor = 'grab';
    }
  }
  dragging = false; dragCtx = null;
});

pvBanner.addEventListener('mousedown', e => {
  if (!e.target.classList.contains('pv-layer-el') && e.target !== pvText && e.target !== pvSub) {
    state.layers.forEach(l => { l.selected = false; });
    state.textSelected = false; state.subSelected = false;
    pvText.classList.remove('selected'); pvSub.classList.remove('selected');
    layerEls.forEach(obj => obj.el.classList.remove('selected'));
    document.querySelectorAll('.layer-card').forEach(c => c.classList.remove('selected-layer'));
  }
});

document.addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
    const step = e.shiftKey ? 10 : 1;
    const selLayer = state.layers.find(l => l.selected);
    if (selLayer) {
      switch(e.key) { case 'ArrowLeft': selLayer.x-=step; break; case 'ArrowRight': selLayer.x+=step; break; case 'ArrowUp': selLayer.y-=step; break; case 'ArrowDown': selLayer.y+=step; break; }
      positionLayerEl(selLayer); e.preventDefault();
    } else if (state.textSelected && state.textOn) {
      switch(e.key) { case 'ArrowLeft': state.textX-=step; break; case 'ArrowRight': state.textX+=step; break; case 'ArrowUp': state.textY-=step; break; case 'ArrowDown': state.textY+=step; break; }
      positionText(); e.preventDefault();
    } else if (state.subSelected && state.subOn) {
      switch(e.key) { case 'ArrowLeft': state.subX-=step; break; case 'ArrowRight': state.subX+=step; break; case 'ArrowUp': state.subY-=step; break; case 'ArrowDown': state.subY+=step; break; }
      positionSub(); e.preventDefault();
    }
  }
});

function getScale() {
  const m = previewOuter.style.transform.match(/scale\(([^)]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}
function positionLayerEl(layer) {
  const obj = layerEls.get(layer.id); if (!obj) return;
  obj.el.style.left = layer.x + 'px'; obj.el.style.top = layer.y + 'px';
}
function positionText() {
  const bi = state.borderOn ? state.borderW + 16 : 16;
  pvText.style.width = (A4_W - bi * 2) + 'px'; pvText.style.top = state.textY + 'px';
  pvText.style.left  = (bi + state.textX) + 'px';
}
function positionSub() {
  const bi = state.borderOn ? state.borderW + 16 : 16;
  pvSub.style.width  = (A4_W - bi * 2) + 'px'; pvSub.style.top = state.subY + 'px';
  pvSub.style.left   = (bi + state.subX) + 'px';
}

/* ═══════════════════════════════════════════════════
   BACKGROUND DRAWING
═══════════════════════════════════════════════════ */
function drawBackground(ctx, w, h, s) {
  switch (s.bgType) {
    case 'solid':
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h); break;
    case 'gradient': {
      const deg = parseFloat(s.gradDir || 135);
      const rad = (deg - 90) * Math.PI / 180;
      const cx = w/2, cy = h/2;
      const len = Math.abs(w*Math.sin(rad)) + Math.abs(h*Math.cos(rad));
      const g = ctx.createLinearGradient(cx-Math.cos(rad)*len/2, cy-Math.sin(rad)*len/2, cx+Math.cos(rad)*len/2, cy+Math.sin(rad)*len/2);
      g.addColorStop(0, s.color1); g.addColorStop(1, s.color2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); break;
    }
    case 'spotlight': {
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h);
      const gr = ctx.createRadialGradient(w*.65,h*.4,0,w*.65,h*.4,Math.max(w,h)*.75);
      gr.addColorStop(0,hexRgba(s.color2,.75)); gr.addColorStop(.4,hexRgba(s.color2,.25)); gr.addColorStop(1,hexRgba(s.color2,0));
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); break;
    }
    case 'streaks': {
      ctx.fillStyle = s.color1; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w*1.1, h*.5);
      for (let i=0;i<14;i++) {
        const angle=((i/14)-.5)*Math.PI*.7, spread=.012+Math.random()*.018, len2=Math.max(w,h)*1.6, bright=.08+Math.random()*.22;
        const hShift = i%3===0?shiftHue(s.color2,30):i%3===1?s.color2:shiftHue(s.color2,-25);
        ctx.save(); ctx.rotate(angle);
        const sg=ctx.createLinearGradient(0,0,-len2,0);
        sg.addColorStop(0,hexRgba(hShift,bright)); sg.addColorStop(.4,hexRgba(hShift,bright*.5)); sg.addColorStop(1,hexRgba(hShift,0));
        ctx.fillStyle=sg;
        const hw=len2*spread;
        ctx.beginPath();ctx.moveTo(0,-1);ctx.lineTo(-len2,-hw);ctx.lineTo(-len2,hw);ctx.lineTo(0,1);ctx.closePath();ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      const vg=ctx.createRadialGradient(w*.5,h*.5,h*.2,w*.5,h*.5,Math.max(w,h)*.9);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.45)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,w,h); break;
    }
  }
}
function hexRgba(hex, a) { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function shiftHue(hex,deg) {
  let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0,s=max===0?0:d/max,v=max;
  if(d!==0){if(max===r)h=((g-b)/d+6)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}
  h=(h+(deg/360)+1)%1;
  const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t2=v*(1-(1-f)*s);
  let nr,ng,nb;
  switch(i%6){case 0:nr=v;ng=t2;nb=p;break;case 1:nr=q;ng=v;nb=p;break;case 2:nr=p;ng=v;nb=t2;break;case 3:nr=p;ng=q;nb=v;break;case 4:nr=t2;ng=p;nb=v;break;default:nr=v;ng=p;nb=q;}
  return '#'+[nr,ng,nb].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

/* Draw a shape onto canvas ctx */
function drawShape(ctx, layer, sc) {
  const x = Math.round(layer.x * sc);
  const y = Math.round(layer.y * sc);
  const w = Math.round(layer.w * sc);
  const h = Math.round(layer.h * sc);
  ctx.save();
  ctx.globalAlpha = (layer.opacity ?? 100) / 100;
  ctx.fillStyle = layer.color || '#2e74dc';
  // Rotate around center
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
  ctx.beginPath();
  if (layer.shape === 'circle') {
    ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
  } else if (layer.shape === 'triangle') {
    ctx.moveTo(0, -h/2); ctx.lineTo(w/2, h/2); ctx.lineTo(-w/2, h/2); ctx.closePath();
  } else {
    ctx.rect(-w/2, -h/2, w, h);
  }
  ctx.fill();
  ctx.restore();
}

/* Draw shape for preview (SVG in div) */
function renderShapeToEl(el, layer) {
  const w = layer.w, h = layer.h;
  let shapeStr = '';
  if (layer.shape === 'circle') {
    shapeStr = `<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}" fill="${layer.color}" />`;
  } else if (layer.shape === 'triangle') {
    shapeStr = `<polygon points="${w/2},0 ${w},${h} 0,${h}" fill="${layer.color}" />`;
  } else {
    shapeStr = `<rect width="${w}" height="${h}" fill="${layer.color}" />`;
  }
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="display:block">${shapeStr}</svg>`;
  el.style.opacity  = (layer.opacity ?? 100) / 100;
  el.style.transform = `rotate(${layer.rotation || 0}deg)`;
  el.style.transformOrigin = 'center center';
  el.style.width  = w + 'px';
  el.style.height = h + 'px';
}

/* Preview bg canvas → dataURL */
function renderPreviewBg() {
  const H = getCanvasH();
  const canvas = document.createElement('canvas'); canvas.width = A4_W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (currentMode === 'logo') {
    const accH1 = state.accentMode !== 'none'  ? state.accent1H : 0;
    const accH2 = state.accentMode === 'double' ? state.accent2H : 0;
    const mainH = H - accH1 - accH2;
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
    drawBackground(ctx, A4_W, H, state);
  }
  return canvas.toDataURL('image/png');
}

/* ═══════════════════════════════════════════════════
   CLEAR
═══════════════════════════════════════════════════ */
btnClear.addEventListener('click', () => {
  const savedMode = currentMode, savedSize = canvasSize;
  pushHistory();
  state = defaultState(); state._cleared = true; state.mode = savedMode; state.canvasSize = savedSize;
  currentMode = savedMode; canvasSize = savedSize;
  layerEls.forEach(obj => { if (obj.el.parentNode) obj.el.parentNode.removeChild(obj.el); });
  layerEls.clear();
  rebuildLayerCards();
  syncUIFromState(); render(); toast('Canvas cleared');
});

/* ═══════════════════════════════════════════════════
   RENDER PREVIEW
═══════════════════════════════════════════════════ */
function render(force) {
  if (force) state._cleared = false;
  const H = getCanvasH();
  const hasContent = state.layers.some(l => l.src || l.type === 'shape');
  const isEmpty = state._cleared && !hasContent && !state.textOn && !state.subOn && state.accentMode === 'none' && !state.shadowOn && !state.borderOn;

  pvBanner.style.width        = A4_W + 'px';
  pvBanner.style.height       = H + 'px';
  pvBanner.style.borderRadius = state.radius + 'px';
  pvBanner.style.overflow     = 'hidden';
  pvBanner.style.flexDirection = 'column';
  pvBanner.style.filter       = state.shadowOn ? `drop-shadow(${state.shadowX}px ${state.shadowY}px ${state.shadowBlur}px ${state.shadowColor})` : 'none';
  pvBanner.style.boxShadow    = isEmpty ? 'none' : '0 8px 40px rgba(0,0,0,.18)';
  pvBanner.classList.toggle('empty', isEmpty);

  if (!isEmpty) {
    pvBanner.style.background     = `url(${renderPreviewBg()}) center/100% 100% no-repeat`;
    pvBanner.style.backgroundSize = '100% 100%';
  } else {
    pvBanner.style.background = '';
  }

  // Border
  if (state.borderOn && !isEmpty) {
    pvBorderEl.style.border       = `${state.borderW}px solid ${state.borderColor}`;
    pvBorderEl.style.borderRadius = state.radius + 'px';
    pvBorderEl.style.display      = '';
  } else { pvBorderEl.style.display = 'none'; }

  // Layers
  state.layers.forEach(layer => {
    const obj = layerEls.get(layer.id); if (!obj) return;
    const el = obj.el;
    el.style.left    = layer.x + 'px';
    el.style.top     = layer.y + 'px';
    el.style.opacity = (layer.opacity ?? 100) / 100;
    el.classList.toggle('selected', layer.selected);

    if (layer.type === 'image') {
      if (layer.src) {
        el.style.display = '';
        el.style.width   = layer.w + 'px';
        el.style.height  = (layer.lock || !layer.h) ? 'auto' : layer.h + 'px';
        el.style.transform = '';
        if (!el.querySelector('img')) {
          const img = document.createElement('img'); img.className = 'pv-layer-img';
          img.draggable = false; el.appendChild(img);
        }
        el.querySelector('img').src = layer.src;
        el.querySelector('img').style.width  = '100%';
        el.querySelector('img').style.height = 'auto';
      } else { el.style.display = 'none'; }
    } else {
      el.style.display = '';
      renderShapeToEl(el, layer);
    }
  });

  // Heading text
  if (state.textOn && state.textStr) {
    pvText.style.display    = '';
    pvText.style.fontFamily = state.textFont;
    pvText.style.fontWeight = state.textWeight;
    pvText.style.fontSize   = state.textSize + 'px';
    pvText.style.color      = state.textColor;
    pvText.style.textAlign  = state.textAlign;
    pvText.style.whiteSpace = 'pre-wrap';
    pvText.style.lineHeight = '1.25';
    pvText.classList.toggle('selected', state.textSelected);
    positionText();
    pvText.textContent = state.textStr;
  } else { pvText.style.display = 'none'; }

  // Sub-heading text
  if (state.subOn && state.subStr) {
    pvSub.style.display    = '';
    pvSub.style.fontFamily = state.subFont;
    pvSub.style.fontWeight = state.subWeight;
    pvSub.style.fontSize   = state.subSize + 'px';
    pvSub.style.color      = state.subColor;
    pvSub.style.textAlign  = state.subAlign;
    pvSub.style.whiteSpace = 'pre-wrap';
    pvSub.style.lineHeight = '1.25';
    pvSub.classList.toggle('selected', state.subSelected);
    positionSub();
    pvSub.textContent = state.subStr;
  } else { pvSub.style.display = 'none'; }

  scalePreview();
  updateDimLabel();
}

function scalePreview() {
  const H = getCanvasH();
  const avW = previewScroll.clientWidth - 48, avH = previewScroll.clientHeight - 48;
  const scale = Math.min(avW / A4_W, avH / H, 1);
  previewOuter.style.transform       = `scale(${scale})`;
  previewOuter.style.width           = A4_W + 'px';
  previewOuter.style.height          = H + 'px';
  previewOuter.style.transformOrigin = 'top left';
  previewOuter.style.marginBottom    = ((H * scale) - H) + 'px';
  previewOuter.style.marginRight     = ((A4_W * scale) - A4_W) + 'px';
}
window.addEventListener('resize', scalePreview);

function updateDimLabel() {
  const H = getCanvasH();
  const outW = Math.round(A4_W * SCALE), outH = Math.round(H * SCALE);
  previewDims.textContent = `preview ${A4_W}\u00d7${H}px  \u2502  export ${outW}\u00d7${outH}px @ ${DPI}dpi`;
}

/* ═══════════════════════════════════════════════════
   EXPORT — 300 dpi canvas
═══════════════════════════════════════════════════ */
async function exportToPNG() {
  const sc   = SCALE;
  const H    = getCanvasH();
  const outW = Math.round(A4_W * sc), outH = Math.round(H * sc);
  const r    = Math.round(state.radius * sc);

  // Content canvas
  const content = document.createElement('canvas'); content.width = outW; content.height = outH;
  const cc = content.getContext('2d');
  cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high';

  if (r > 0) { cc.beginPath(); cc.roundRect(0, 0, outW, outH, r); cc.clip(); }

  // Background
  if (currentMode === 'logo') {
    const accH1 = state.accentMode !== 'none'  ? Math.round(state.accent1H*sc) : 0;
    const accH2 = state.accentMode === 'double' ? Math.round(state.accent2H*sc) : 0;
    const mainH = outH - accH1 - accH2;
    const mainY = state.accentPos === 'above' ? accH1+accH2 : 0;
    cc.save(); cc.beginPath(); cc.rect(0, mainY, outW, mainH); cc.clip();
    drawBackground(cc, outW, mainH, state); cc.restore();
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

  // Layers (bottom to top)
  for (const layer of state.layers) {
    if (layer.type === 'image' && layer.src) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const dw = Math.round(layer.w * sc);
          const dh = (layer.lock || !layer.h) ? Math.round(img.naturalHeight * (dw / img.naturalWidth)) : Math.round(layer.h * sc);
          cc.save(); cc.globalAlpha = (layer.opacity ?? 100) / 100;
          cc.drawImage(img, Math.round(layer.x*sc), Math.round(layer.y*sc), dw, dh);
          cc.restore(); resolve();
        };
        img.onerror = resolve; img.src = layer.src;
      });
    } else if (layer.type === 'shape') {
      drawShape(cc, layer, sc);
    }
  }

  // Heading
  if (state.textOn && state.textStr) {
    const bi = state.borderOn ? Math.round((state.borderW+16)*sc) : Math.round(16*sc);
    cc.font = `${state.textWeight} ${Math.round(state.textSize*sc)}px ${state.textFont}`;
    cc.fillStyle = state.textColor; cc.textAlign = state.textAlign; cc.textBaseline = 'top';
    const lh = Math.round(state.textSize*sc*1.25);
    const tx = state.textAlign==='center' ? outW/2+Math.round(state.textX*sc) : state.textAlign==='right' ? outW-bi-Math.round(state.textX*sc) : bi+Math.round(state.textX*sc);
    state.textStr.split('\n').forEach((line, i) => cc.fillText(line, tx, Math.round(state.textY*sc)+i*lh));
  }

  // Sub-heading
  if (state.subOn && state.subStr) {
    const bi = state.borderOn ? Math.round((state.borderW+16)*sc) : Math.round(16*sc);
    cc.font = `${state.subWeight} ${Math.round(state.subSize*sc)}px ${state.subFont}`;
    cc.fillStyle = state.subColor; cc.textAlign = state.subAlign; cc.textBaseline = 'top';
    const lh = Math.round(state.subSize*sc*1.25);
    const tx = state.subAlign==='center' ? outW/2+Math.round(state.subX*sc) : state.subAlign==='right' ? outW-bi-Math.round(state.subX*sc) : bi+Math.round(state.subX*sc);
    state.subStr.split('\n').forEach((line, i) => cc.fillText(line, tx, Math.round(state.subY*sc)+i*lh));
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
  const canvas = document.createElement('canvas'); canvas.width = outW+pad*2; canvas.height = outH+pad*2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (state.shadowOn) { ctx.shadowOffsetX=state.shadowX*sc; ctx.shadowOffsetY=state.shadowY*sc; ctx.shadowBlur=state.shadowBlur*sc; ctx.shadowColor=state.shadowColor; }
  ctx.drawImage(content, pad, pad);

  return injectPHYs(canvas.toDataURL('image/png', 1.0), DPI);
}

/* PNG pHYs DPI chunk */
function injectPHYs(dataUrl, dpi) {
  const b64=dataUrl.split(',')[1],bin=atob(b64),src=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) src[i]=bin.charCodeAt(i);
  const ppm=Math.round(dpi*39.3701);
  function u32be(n){return[(n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff];}
  const ct=new Uint32Array(256);
  for(let i=0;i<256;i++){let v=i;for(let j=0;j<8;j++)v=(v&1)?(0xEDB88320^(v>>>1)):(v>>>1);ct[i]=v;}
  function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=ct[(c^b[i])&0xff]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  const tb=[0x70,0x48,0x59,0x73],da=new Uint8Array([...u32be(ppm),...u32be(ppm),1]);
  const cv=crc32(new Uint8Array([...tb,...da])),ch=new Uint8Array([...u32be(9),...tb,...da,...u32be(cv)]);
  const out=new Uint8Array(src.length+ch.length);
  out.set(src.slice(0,33));out.set(ch,33);out.set(src.slice(33),33+ch.length);
  let s='';for(let i=0;i<out.length;i++)s+=String.fromCharCode(out[i]);
  return 'data:image/png;base64,'+btoa(s);
}

/* ═══════════════════════════════════════════════════
   DOWNLOAD + SAVE
═══════════════════════════════════════════════════ */
const LS_KEY = 'bannerCreator_recents', MAX_RECENTS = 5;
function getSaved(){try{return JSON.parse(localStorage.getItem(LS_KEY))||[];}catch{return[];}}

btnDownload.addEventListener('click', async () => {
  btnDownload.textContent = '⏳ Generating…'; btnDownload.disabled = true;
  try {
    const dataUrl = await exportToPNG();
    const a = document.createElement('a');
    const name = (state.company||'banner').replace(/[^a-z0-9_\-]/gi,'_').toLowerCase();
    const sizeTag = state.canvasSize === 'a4' ? 'a4' : 'banner';
    a.download = `${name}_${sizeTag}_${DPI}dpi.png`; a.href = dataUrl; a.click();
    const H = getCanvasH();
    toast(`Downloaded ${Math.round(A4_W*SCALE)}\u00d7${Math.round(H*SCALE)}px @ ${DPI}dpi`);
  } catch(err){ console.error(err); toast('Export failed — see console');
  } finally { btnDownload.textContent = '⬇ Download PNG 300dpi'; btnDownload.disabled = false; }
});

btnSave.addEventListener('click', async () => {
  const company = state.company.trim() || 'Untitled';
  btnSave.textContent = '⏳ Saving…'; btnSave.disabled = true;
  try {
    // Generate a small thumbnail (max 400px wide) for the sidebar — not full 300dpi
    const thumb = await exportThumbnail();
    const recents = getSaved().filter(r => r.company !== company);
    recents.unshift({ company, savedAt: Date.now(), thumb, mode: currentMode, canvasSize, state: JSON.stringify(state) });
    if (recents.length > MAX_RECENTS) recents.length = MAX_RECENTS;
    localStorage.setItem(LS_KEY, JSON.stringify(recents));
    renderSidebar(); toast(`"${company}" saved`);
  } catch(err){ console.error(err); toast('Save failed — ' + err.message);
  } finally { btnSave.textContent = '💾 Save'; btnSave.disabled = false; }
});

/* Small thumbnail for sidebar — max 400px wide, keeps aspect ratio */
async function exportThumbnail() {
  const H    = getCanvasH();
  const sc   = Math.min(400 / A4_W, 200 / H); // never larger than 400×200
  const outW = Math.round(A4_W * sc);
  const outH = Math.round(H    * sc);

  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const cc = canvas.getContext('2d');
  cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high';

  // Background only — fast, no image loading needed for a thumbnail
  if (currentMode === 'logo') {
    const accH1 = state.accentMode !== 'none'  ? Math.round(state.accent1H*sc) : 0;
    const accH2 = state.accentMode === 'double' ? Math.round(state.accent2H*sc) : 0;
    const mainH = outH - accH1 - accH2;
    const mainY = state.accentPos === 'above' ? accH1+accH2 : 0;
    cc.save(); cc.beginPath(); cc.rect(0, mainY, outW, mainH); cc.clip();
    drawBackground(cc, outW, mainH, state); cc.restore();
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

  // Draw layers at thumbnail scale
  for (const layer of state.layers) {
    if (layer.type === 'image' && layer.src) {
      await new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const dw = Math.round(layer.w * sc);
          const dh = (layer.lock || !layer.h) ? Math.round(img.naturalHeight * (dw / img.naturalWidth)) : Math.round(layer.h * sc);
          cc.save(); cc.globalAlpha = (layer.opacity ?? 100) / 100;
          cc.drawImage(img, Math.round(layer.x*sc), Math.round(layer.y*sc), dw, dh);
          cc.restore(); resolve();
        };
        img.onerror = resolve; img.src = layer.src;
      });
    } else if (layer.type === 'shape') {
      drawShape(cc, layer, sc);
    }
  }

  return canvas.toDataURL('image/jpeg', 0.7); // JPEG for smaller size
}

function loadEntry(entry) {
  const saved = JSON.parse(entry.state);
  if (!saved.layers) saved.layers = [];
  Object.assign(state, saved);
  currentMode = state.mode || 'logo'; canvasSize = state.canvasSize || 'banner';
  layerEls.forEach(obj => { if (obj.el.parentNode) obj.el.parentNode.removeChild(obj.el); });
  layerEls.clear();
  rebuildLayerCards(); rebuildLayerPreviews();
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
    mTag.style.cssText='font-size:9px;font-family:JetBrains Mono,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);margin-bottom:3px';
    mTag.textContent = (entry.canvasSize==='a4'?'A4 Page':entry.mode==='header'?'✦ Header':'🖼 Logo Banner');
    const thumb = document.createElement('img'); thumb.className='recent-card-thumb'; thumb.src=entry.thumb; thumb.alt=entry.company;
    const name  = document.createElement('div'); name.className='recent-card-name'; name.textContent=entry.company;
    const date  = document.createElement('div'); date.className='recent-card-date';
    date.textContent=new Date(entry.savedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    card.append(del,mTag,thumb,name,date);
    card.addEventListener('click',()=>loadEntry(entry));
    recentList.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════
   SYNC UI FROM STATE
═══════════════════════════════════════════════════ */
function syncUIFromState() {
  tabLogo.classList.toggle('active',   currentMode==='logo');
  tabHeader.classList.toggle('active', currentMode==='header');
  segBgTypeLogo.style.display  = currentMode==='logo'   ? '' : 'none';
  segBgTypeHdr.style.display   = currentMode==='header' ? '' : 'none';
  accentSection.style.display  = currentMode==='logo'   ? '' : 'none';
  $('size-section').style.display    = currentMode==='logo' ? '' : 'none';
  $('layers-section').style.display  = currentMode==='logo' ? '' : 'none';

  setSegActive(segCanvasSize, canvasSize);
  heightSection.style.display = canvasSize === 'a4' ? 'none' : '';

  inpCompany.value = state.company;
  inpHeight.value  = state.height;  heightVal.textContent = state.height+'px';
  inpRadius.value  = state.radius;  radiusVal.textContent = state.radius+'px';

  if (currentMode==='logo') setSegActive(segBgTypeLogo, state.bgType);
  else setSegActive(segBgTypeHdr, state.bgType);
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
  inpText.value=state.textStr||''; inpFont.value=state.textFont;
  setSegActive(segFontWeight,state.textWeight); inpFontSize.value=state.textSize; fontSizeVal.textContent=state.textSize+'px';
  setSegActive(segTextAlign,state.textAlign);
  inpTextColor.value=state.textColor; inpHexText.value=state.textColor; highlightSwatch('swatches-text',state.textColor);

  inpSubOn.checked=state.subOn; subCtrls.style.display=state.subOn?'':'none';
  inpSub.value=state.subStr||''; inpSubFont.value=state.subFont;
  setSegActive(segSubWeight,state.subWeight); inpSubSize.value=state.subSize; subSizeVal.textContent=state.subSize+'px';
  setSegActive(segSubAlign,state.subAlign);
  inpSubColor.value=state.subColor; inpHexSub.value=state.subColor; highlightSwatch('swatches-sub',state.subColor);

  rebuildLayerCards();
}

/* ═══════════════════════════════════════════════════
   BRAND EXTRACTOR
═══════════════════════════════════════════════════ */
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
let beExtracted = {};

beExtractBtn.addEventListener('click', async () => {
  const url = beUrlInp.value.trim(); if (!url) { showBeStatus('Please enter a URL', true); return; }
  beExtractBtn.disabled = true; beExtractBtn.textContent = '⏳ Extracting…';
  beResults.style.display = 'none'; showBeStatus('Analysing brand colors…');
  try {
    const resp = await fetch('/.netlify/functions/extract-brand', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url}) });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error||'Failed');
    beExtracted = data; showBeResults(data); beStatus.style.display = 'none';
  } catch(err) { showBeStatus(err.message, true);
  } finally { beExtractBtn.disabled=false; beExtractBtn.textContent='✦ Extract Brand'; }
});

beReset.addEventListener('click', () => { beResults.style.display='none'; beStatus.style.display='none'; beUrlInp.value=''; beExtracted={}; });

function showBeStatus(msg, isErr) { beStatus.textContent=msg; beStatus.className=isErr?'error':''; beStatus.style.display=''; }

function showBeResults(data) {
  beColorsRow.innerHTML = '';
  [data.primaryColor&&{hex:data.primaryColor,label:'Primary'}, data.secondaryColor&&{hex:data.secondaryColor,label:'Secondary'}].filter(Boolean).forEach((c,i) => {
    const card=document.createElement('div'); card.className='be-color-card'+(i===0?' selected':'');
    const sw=document.createElement('div'); sw.className='be-color-swatch'; sw.style.background=c.hex;
    const hx=document.createElement('div'); hx.className='be-color-hex'; hx.textContent=c.hex;
    const lb=document.createElement('div'); lb.className='be-color-label'; lb.textContent=c.label;
    card.append(sw,hx,lb);
    const co=c;
    card.addEventListener('click',()=>{
      beColorsRow.querySelectorAll('.be-color-card').forEach(el=>el.classList.remove('selected')); card.classList.add('selected');
      pushHistory(); state.color1=co.hex; state._cleared=false;
      inpColor1.value=co.hex; inpHex1.value=co.hex; highlightSwatch('swatches-color1',co.hex); render();
      toast(`Applied ${co.label}: ${co.hex}`);
    });
    beColorsRow.appendChild(card);
  });
  if (data.logoUrl) {
    beLogoImg.src=data.logoUrl; beLogoImg.onerror=()=>{beLogoWrap.style.display='none';}; beLogoImg.onload=()=>{beLogoWrap.style.display='';};
    beLogoWrap.style.display=''; beApplyAll.style.display='';
  } else { beLogoWrap.style.display='none'; beApplyAll.style.display='none'; }
  beNotes.innerHTML=`<span class="be-confidence ${data.confidence||'medium'}">${data.confidence||'medium'}</span>${data.notes||''}`;
  beResults.style.display='';
}

beApplyAll.addEventListener('click', () => {
  if (beExtracted.logoUrl && currentMode==='logo') {
    pushHistory(); state._cleared=false;
    loadLogoFromUrl(beExtracted.logoUrl);
  } else if (currentMode!=='logo') { toast('Switch to Logo Banner to load a logo'); }
});

function loadLogoFromUrl(url) {
  const img=new Image(); img.crossOrigin='anonymous';
  img.onload=()=>{
    const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
    c.getContext('2d').drawImage(img,0,0);
    try { applyLogoAsLayer(c.toDataURL('image/png'), img.naturalWidth, img.naturalHeight, url); }
    catch(e) { loadLogoViaProxy(url); }
  };
  img.onerror=()=>loadLogoViaProxy(url); img.src=url;
}
function applyLogoAsLayer(dataUrl, nw, nh, origUrl) {
  const layer = defaultImageLayer();
  layer.src  = dataUrl; layer.name = 'Logo';
  layer.w    = Math.min(200, nw); layer.h = null; layer.lock = true;
  layer.x    = 40; layer.y = Math.round((getCanvasH() - layer.w/(nw/nh))/2);
  state.layers.push(layer); state._cleared = false;
  rebuildLayerCards(); rebuildLayerPreviews(); render();
  toast('Logo loaded as Image Layer 1');
}
async function loadLogoViaProxy(url) {
  try {
    showBeStatus('Loading via proxy…');
    const resp=await fetch('/.netlify/functions/extract-brand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({proxyUrl:url})});
    if(!resp.ok) throw new Error('Proxy failed');
    const data=await resp.json(); if(!data.dataUrl) throw new Error('No data');
    const img2=new Image();
    img2.onload=()=>{ applyLogoAsLayer(data.dataUrl,img2.naturalWidth,img2.naturalHeight,url); beStatus.style.display='none'; };
    img2.onerror=()=>showBeStatus('Logo could not load — upload manually',true);
    img2.src=data.dataUrl;
  } catch(err) { showBeStatus('Logo could not load — upload manually',true); }
}

/* ═══════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════ */
buildSwatches('swatches-color1',  inpColor1,     inpHex1,      'color1');
buildSwatches('swatches-color2',  inpColor2,     inpHex2,      'color2');
buildSwatches('swatches-accent1', inpAccent1,    inpHexA1,     'accent1');
buildSwatches('swatches-accent2', inpAccent2,    inpHexA2,     'accent2');
buildSwatches('swatches-border',  inpBorderColor,inpHexBorder, 'borderColor');
buildSwatches('swatches-text',    inpTextColor,  inpHexText,   'textColor', SWATCHES_TEXT);
buildSwatches('swatches-sub',     inpSubColor,   inpHexSub,    'subColor',  SWATCHES_TEXT);
highlightSwatch('swatches-color1',  state.color1);
highlightSwatch('swatches-color2',  state.color2);
highlightSwatch('swatches-border',  state.borderColor);
highlightSwatch('swatches-text',    state.textColor);
highlightSwatch('swatches-sub',     state.subColor);
renderSidebar();
syncUIFromState();
render();
