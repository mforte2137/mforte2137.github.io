/* =========================================================
   First Impression — first-impression.js
   ========================================================= */

const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

// ── State ─────────────────────────────────────────────────
let generatedImageUrl  = '';
let selectedTemplate   = 'chevron';
let autoResults        = {};   // templateId → imageUrl
let autoSelectedId     = null;
let autoCompanyName    = '';
let autoBrandColor     = '#1a4da0';
let autoLogoUrl        = null;
let autoPhotoUrl       = '';
let autoPhoto2Url      = '';
let autoCategoryMap    = {};   // templateId → category
let autoPhotoBase      = '';
let autoPhotoCount     = 12;
let autoCurrentPhotos  = {};   // templateId → current photoUrl (for exclude on refresh)

// ── DOM — Views ───────────────────────────────────────────
const formView       = document.getElementById('form-view');
const workingView    = document.getElementById('working-view');
const resultAutoView = document.getElementById('result-auto-view');
const resultView     = document.getElementById('result-view');
const workTitle      = document.getElementById('working-title');
const workSub        = document.getElementById('working-sub');

// ── DOM — Auto mode ───────────────────────────────────────
const autoWebsiteInput   = document.getElementById('auto-website');
const autoBtn            = document.getElementById('auto-btn');
const autoError          = document.getElementById('auto-error');
const resultAutoTitle    = document.getElementById('result-auto-title');
const coversGrid         = document.getElementById('covers-grid');
const selectedCoverActions = document.getElementById('selected-cover-actions');
const selectedCoverImg   = document.getElementById('selected-cover-img');
const autoDownloadBtn    = document.getElementById('auto-download-btn');
const restartAutoBtn     = document.getElementById('restart-auto-btn');
const refreshAllBtn      = document.getElementById('refresh-all-btn');
const logoMissingBanner  = document.getElementById('logo-missing-banner');
const logoMissingInput   = document.getElementById('logo-missing-input');
const logoMissingBtn     = document.getElementById('logo-missing-btn');
const manualToggleBtn    = document.getElementById('manual-toggle-btn');
const manualSection      = document.getElementById('manual-section');


// ── DOM — Manual mode ─────────────────────────────────────
const companyInput   = document.getElementById('company-name');
const websiteInput   = document.getElementById('website-url');
const extractBtn     = document.getElementById('extract-btn');
const extractStatus  = document.getElementById('extract-status');
const colorPicker    = document.getElementById('brand-color-picker');
const colorHex       = document.getElementById('brand-color-hex');
const colorPreview   = document.getElementById('color-preview');
const logoUrlInput   = document.getElementById('logo-url');
const previewLogoBtn = document.getElementById('preview-logo-btn');
const logoPreviewArea= document.getElementById('logo-preview-area');
const logoPreviewImg = document.getElementById('logo-preview-img');
const logoClearBtn   = document.getElementById('logo-preview-clear');
const industrySelect   = document.getElementById('industry');
const findPhotosBtn    = document.getElementById('find-photos-btn');
const photoPicker      = document.getElementById('photo-picker');
const photoGrid        = document.getElementById('photo-grid');
const morePhotosBtn    = document.getElementById('more-photos-btn');
const photoLoading     = document.getElementById('photo-loading');
const photoCredit      = document.getElementById('photo-credit');
let   selectedPhotoUrl = '';
let   photoPage        = 1;
let   photoFocalPoint  = 0.5;
const focalControl    = document.getElementById('focal-control');
const focalSlider     = document.getElementById('focal-slider');
const focalValueLabel = document.getElementById('focal-value-label');
const focalPreviewImg = document.getElementById('focal-preview-img');
const focalViewport   = document.getElementById('focal-viewport');
const generateBtn    = document.getElementById('generate-btn');
const formError      = document.getElementById('form-error');
const restartBtn     = document.getElementById('restart-btn');
const coverPreview   = document.getElementById('cover-preview');
const resultTitle    = document.getElementById('result-title');
const downloadBtn    = document.getElementById('download-btn');

// ── Text editor DOM refs ──────────────────────────────────
const textEditorView    = document.getElementById('text-editor-view');
const textEditorBackBtn = document.getElementById('text-editor-back-btn');
const autoAddTextBtn    = document.getElementById('auto-add-text-btn');
const manualAddTextBtn  = document.getElementById('manual-add-text-btn');
const textCanvas        = document.getElementById('text-canvas');
const txtHeading        = document.getElementById('txt-heading');
const txtSubheading     = document.getElementById('txt-subheading');
const txtFont           = document.getElementById('txt-font');
const txtSize           = document.getElementById('txt-size');
const txtSizeVal        = document.getElementById('txt-size-val');
const txtSubSize        = document.getElementById('txt-sub-size');
const txtSubSizeVal     = document.getElementById('txt-sub-size-val');
const txtColor          = document.getElementById('txt-color');
const txtColorHex       = document.getElementById('txt-color-hex');
const txtSubColor       = document.getElementById('txt-sub-color');
const txtSubColorHex    = document.getElementById('txt-sub-color-hex');
const txtShadow         = document.getElementById('txt-shadow');
const txtShadowBlur     = document.getElementById('txt-shadow-blur');
const txtResetPosBtn    = document.getElementById('txt-reset-pos-btn');
const txtDownloadBtn    = document.getElementById('txt-download-btn');

// Text editor state
let teSourceUrl  = '';    // Placid image URL being edited
let teReturnView = '';    // which view to go back to
let teX          = 0.5;  // heading position as fraction of canvas width
let teY          = 0.6;  // heading position as fraction of canvas height
let teDragging   = false;
let teDragStartX = 0;
let teDragStartY = 0;
let teDragTeXStart = 0;
let teDragTeYStart = 0;
let teImg        = null; // loaded HTMLImageElement
let teCanvasW    = 500;  // display canvas width in px

// ── Init ──────────────────────────────────────────────────
function init() {
  // No credentials to restore — push removed
}

// ── View switching ────────────────────────────────────────
function showView(name) {
  formView.hidden         = name !== 'form';
  workingView.hidden      = name !== 'working';
  resultAutoView.hidden   = name !== 'result-auto';
  resultView.hidden       = name !== 'result';
  textEditorView.hidden   = name !== 'text-editor';
}

// ── Colour picker sync ────────────────────────────────────
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

colorPicker.addEventListener('input', () => {
  colorHex.value           = colorPicker.value.toUpperCase();
  colorPreview.style.background = colorPicker.value;
  updateTemplatePreview(colorPicker.value);
});
colorHex.addEventListener('input', () => {
  const v = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  if (isValidHex(v)) {
    colorPicker.value             = v;
    colorPreview.style.background = v;
    updateTemplatePreview(v);
  }
});

function updateTemplatePreview() {
  // Template thumbnails use a fixed neutral — they show layout shape, not brand colour
}

// ── Manual section toggle ─────────────────────────────────
manualToggleBtn.addEventListener('click', () => {
  const open = !manualSection.hidden;
  manualSection.hidden = open;
  manualToggleBtn.textContent = open ? '⚙ Customise manually ▼' : '⚙ Customise manually ▲';
});

// ── Auto mode ─────────────────────────────────────────────
function showAutoError(msg) {
  autoError.textContent = msg;
  autoError.hidden = false;
}
function clearAutoError() { autoError.hidden = true; }

const TEMPLATE_NAMES = {
  chevron:     'Chevron',
  half_circle: 'Half Circle',
  corporate:   'Corporate',
  modern:      'Modern'
};

autoBtn.addEventListener('click', async () => {
  clearAutoError();
  const url = autoWebsiteInput.value.trim();
  if (!url) {
    showAutoError('Please enter their website URL.');
    autoWebsiteInput.focus();
    return;
  }

  autoBtn.disabled = true;
  showView('working');

  try {
    // Step 1 — analyse website
    workTitle.textContent = 'Scanning their website…';
    workSub.textContent   = 'Extracting brand colour, logo and photos';

    const analyseRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'analyse', websiteUrl: url })
    });
    const analyseData = await analyseRes.json();
    if (!analyseRes.ok || !analyseData.ok) throw new Error(analyseData.error || 'Could not scan website.');

    const { brandColor, logoUrl: foundLogoUrl, photoUrl, photo2Url, photoByTemplate, categoryMap, photoBase, photoCount } = analyseData;
    autoBrandColor  = brandColor;
    autoPhotoUrl    = photoUrl;
    autoPhoto2Url   = photo2Url || photoUrl;
    autoLogoUrl     = foundLogoUrl || null;
    autoCategoryMap = categoryMap || {};
    autoPhotoBase   = photoBase || '';
    autoPhotoCount  = photoCount || 12;
    autoCurrentPhotos = { ...photoByTemplate };

    // Extract company name from URL for display
    try {
      autoCompanyName = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      autoCompanyName = autoCompanyName.charAt(0).toUpperCase() + autoCompanyName.slice(1);
    } catch (e) { autoCompanyName = url; }

    if (!photoUrl) throw new Error('Could not find a suitable photo. Try the manual mode instead.');

    // Step 2 — fire all 4 Placid renders
    workTitle.textContent = 'Rendering all four templates…';
    workSub.textContent   = 'Applying their branding to each design — usually 15–20 seconds';

    const startRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'start-all', brandColor, logoUrl: autoLogoUrl, photoUrl, photo2Url, photoByTemplate })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Could not start rendering.');

    const renders = startData.renders;

    // Step 3 — show result grid immediately, poll for each image
    resultAutoTitle.textContent = autoCompanyName;
    coversGrid.innerHTML = '';
    selectedCoverActions.hidden = true;
    autoResults = {};

    // Show logo missing banner if no logo was found
    if (!autoLogoUrl) {
      logoMissingBanner.hidden = false;
      logoMissingInput.value   = '';
      logoMissingBtn.disabled  = false;
      logoMissingBtn.textContent = 'Add Logo & Re-render →';
    } else {
      logoMissingBanner.hidden = true;
    }

    // Build tiles — show spinner until each image is ready
    renders.forEach(({ templateId, name, imageId, imageUrl }) => {
      const tile = document.createElement('div');
      tile.className = 'cover-tile';
      tile.dataset.templateId = templateId;
      tile.innerHTML = `
        <div class="cover-tile-spinner"><div class="spinner-sm"></div></div>
        <div class="cover-tile-footer">
          <span class="cover-tile-label">${name}</span>
          <div class="cover-tile-btns">
            <button type="button" class="cover-tile-undo" title="Undo refresh" hidden>↩</button>
            <button type="button" class="cover-tile-refresh" title="Try a different photo">↺</button>
          </div>
        </div>
        <div class="cover-tile-check">✓</div>
      `;
      tile.querySelector('.cover-tile-refresh').addEventListener('click', (e) => {
        e.stopPropagation();
        refreshTile(templateId);
      });
      tile.querySelector('.cover-tile-undo').addEventListener('click', (e) => {
        e.stopPropagation();
        undoTile(templateId);
      });
      tile.addEventListener('click', () => selectCover(templateId));
      coversGrid.appendChild(tile);

      if (imageUrl) {
        setTileImage(tile, imageUrl);
        autoResults[templateId] = imageUrl;
        autoCurrentPhotos[templateId] = photoByTemplate?.[templateId] || '';
      }
    });

    showView('result-auto');

    // Step 4 — poll for any not-yet-ready renders
    const pending = renders.filter(r => !r.imageUrl);
    if (pending.length > 0) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes  = await fetch('/api/generate-cover', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            action:   'poll-all',
            imageIds: pending
              .filter(r => !autoResults[r.templateId])
              .map(r => ({ templateId: r.templateId, imageId: r.imageId }))
          })
        });
        const pollData = await pollRes.json();
        if (pollData.ok) {
          pollData.renders.forEach(({ templateId, ready, imageUrl }) => {
            if (ready && imageUrl && !autoResults[templateId]) {
              autoResults[templateId] = imageUrl;
              const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
              if (tile) setTileImage(tile, imageUrl);
            }
          });
        }
        if (Object.keys(autoResults).length === renders.length) break;
      }
    }

  } catch (err) {
    showView('form');
    showAutoError(err.message || 'Something went wrong. Please try again.');
  } finally {
    autoBtn.disabled = false;
  }
});

function setTileImage(tile, imageUrl) {
  const spinner = tile.querySelector('.cover-tile-spinner');
  if (spinner) {
    const img = document.createElement('img');
    img.className = 'cover-tile-img';
    img.src = imageUrl;
    img.alt = '';
    spinner.replaceWith(img);
  }
}

// ── Per-tile and all-tile refresh ─────────────────────────
const autoPreviousPhotos = {}; // templateId → previous imageUrl (one level undo)

async function refreshTile(templateId) {
  const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
  if (!tile) return;

  // Store current image for undo before replacing
  const prevUrl = autoResults[templateId];
  if (prevUrl) autoPreviousPhotos[templateId] = prevUrl;

  // Show spinner
  const existingImg = tile.querySelector('.cover-tile-img');
  if (existingImg) {
    const spinner = document.createElement('div');
    spinner.className = 'cover-tile-spinner';
    spinner.innerHTML = '<div class="spinner-sm"></div>';
    existingImg.replaceWith(spinner);
  }
  tile.classList.remove('is-selected');
  if (autoSelectedId === templateId) {
    selectedCoverActions.hidden = true;
    autoSelectedId = null;
  }

  const refreshBtn = tile.querySelector('.cover-tile-refresh');
  const undoBtn    = tile.querySelector('.cover-tile-undo');
  if (refreshBtn) refreshBtn.disabled = true;
  if (undoBtn)    undoBtn.hidden = true;

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:     'refresh-tile',
        templateId,
        brandColor: autoBrandColor,
        logoUrl:    autoLogoUrl,
        category:   autoCategoryMap[templateId] || null,
        excludeUrl: autoCurrentPhotos[templateId] || null
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Refresh failed.');

    // Poll until ready
    let imageUrl = data.imageUrl;
    if (!imageUrl && data.imageId) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes  = await fetch('/api/generate-cover', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'poll', imageId: data.imageId })
        });
        const pollData = await pollRes.json();
        if (pollData.ready && pollData.imageUrl) { imageUrl = pollData.imageUrl; break; }
      }
    }
    if (!imageUrl) throw new Error('Timed out.');

    autoResults[templateId]       = imageUrl;
    autoCurrentPhotos[templateId] = data.photoUrl || '';
    setTileImage(tile, imageUrl);

    // Show undo button now that we have something to go back to
    if (undoBtn && prevUrl) undoBtn.hidden = false;

  } catch (e) {
    // Restore previous image if refresh failed
    if (prevUrl) setTileImage(tile, prevUrl);
    delete autoPreviousPhotos[templateId];
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

function undoTile(templateId) {
  const prevUrl = autoPreviousPhotos[templateId];
  if (!prevUrl) return;

  const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
  if (!tile) return;

  // Restore previous image
  autoResults[templateId] = prevUrl;
  setTileImage(tile, prevUrl);
  delete autoPreviousPhotos[templateId];

  // Hide undo button — only one level of undo
  const undoBtn = tile.querySelector('.cover-tile-undo');
  if (undoBtn) undoBtn.hidden = true;

  // If this tile was selected, update the preview
  if (autoSelectedId === templateId) selectCover(templateId);
}

async function refreshAll() {
  refreshAllBtn.disabled    = true;
  refreshAllBtn.textContent = '↺ Refreshing…';
  selectedCoverActions.hidden = true;
  autoSelectedId = null;

  const templateIds = Object.keys(TEMPLATE_NAMES);
  await Promise.all(templateIds.map(id => refreshTile(id)));

  refreshAllBtn.disabled    = false;
  refreshAllBtn.textContent = '↺ New Photos';
}

refreshAllBtn.addEventListener('click', refreshAll);

function selectCover(templateId) {
  const imageUrl = autoResults[templateId];
  if (!imageUrl) return;

  // Update tile selection
  coversGrid.querySelectorAll('.cover-tile').forEach(t => t.classList.remove('is-selected'));
  const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
  if (tile) tile.classList.add('is-selected');

  autoSelectedId = templateId;

  // Show actions panel
  selectedCoverImg.src         = imageUrl;
  autoDownloadBtn.href         = imageUrl;
  autoDownloadBtn.download     = `${autoCompanyName}-${templateId}-cover.png`;
  autoDownloadBtn.textContent  = '⬇ Download Cover Page';
  selectedCoverActions.hidden  = false;
  selectedCoverActions.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Restart from auto result
restartAutoBtn.addEventListener('click', () => {
  autoResults       = {};
  autoSelectedId    = null;
  autoPhotoUrl      = '';
  autoPhoto2Url     = '';
  autoCategoryMap   = {};
  autoCurrentPhotos = {};
  autoLogoUrl       = null;
  coversGrid.innerHTML        = '';
  selectedCoverActions.hidden = true;
  logoMissingBanner.hidden    = true;
  showView('form');
});

// Logo missing — re-render all covers with the pasted logo URL
logoMissingBtn.addEventListener('click', async () => {
  const logoUrl = logoMissingInput.value.trim();
  if (!logoUrl) { logoMissingInput.focus(); return; }

  logoMissingBtn.disabled    = true;
  logoMissingBtn.textContent = 'Re-rendering…';

  // Get the photoUrls from the existing renders — reuse same photos
  // We need to re-fire start-all with the new logo
  // Pull photoUrl from the working view state isn't available, so store it
  try {
    const startRes = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:    'start-all',
        brandColor: autoBrandColor,
        logoUrl,
        photoUrl:   autoPhotoUrl,
        photo2Url:  autoPhoto2Url
      })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Re-render failed.');

    // Reset grid spinners
    autoResults = {};
    selectedCoverActions.hidden = true;
    coversGrid.querySelectorAll('.cover-tile').forEach(tile => {
      const label = tile.querySelector('.cover-tile-label').textContent;
      tile.innerHTML = `
        <div class="cover-tile-spinner"><div class="spinner-sm"></div></div>
        <div class="cover-tile-label">${label}</div>
        <div class="cover-tile-check">✓</div>
      `;
      tile.classList.remove('is-selected');
      tile.addEventListener('click', () => selectCover(tile.dataset.templateId));
    });

    logoMissingBanner.hidden = true;

    // Poll for results
    const pending = startData.renders.filter(r => !r.imageUrl);
    startData.renders.forEach(r => {
      if (r.imageUrl) {
        autoResults[r.templateId] = r.imageUrl;
        const tile = coversGrid.querySelector(`[data-template-id="${r.templateId}"]`);
        if (tile) setTileImage(tile, r.imageUrl);
      }
    });

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const stillPending = pending.filter(r => !autoResults[r.templateId]);
      if (!stillPending.length) break;
      const pollRes  = await fetch('/api/generate-cover', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'poll-all', imageIds: stillPending.map(r => ({ templateId: r.templateId, imageId: r.imageId })) })
      });
      const pollData = await pollRes.json();
      if (pollData.ok) {
        pollData.renders.forEach(({ templateId, ready, imageUrl }) => {
          if (ready && imageUrl && !autoResults[templateId]) {
            autoResults[templateId] = imageUrl;
            const tile = coversGrid.querySelector(`[data-template-id="${templateId}"]`);
            if (tile) setTileImage(tile, imageUrl);
          }
        });
      }
    }

  } catch (e) {
    logoMissingBtn.disabled    = false;
    logoMissingBtn.textContent = 'Add Logo & Re-render →';
    logoMissingBanner.querySelector('.logo-missing-body strong').textContent = `✕ ${e.message} —`;
  }
});

// ── Focal point slider ────────────────────────────────────
// Updates the live crop preview thumbnail to show exactly what
// portion of the photo will appear in the portrait cover canvas.
function updateFocalPreview(sliderVal) {
  const vpW = focalViewport.offsetWidth  || 80;
  const vpH = focalViewport.offsetHeight || 110;
  const imgNW = focalPreviewImg.naturalWidth  || 1;
  const imgNH = focalPreviewImg.naturalHeight || 1;

  // Strategy: scale so the image is tall enough to scroll meaningfully.
  // Scale by width first; if the result isn't taller than the viewport, scale by height instead.
  const scaleByW   = vpW / imgNW;
  const heightIfW  = imgNH * scaleByW;

  let renderW, renderH;
  if (heightIfW >= vpH * 1.3) {
    // Portrait-ish image — width-fill gives enough height to scroll
    renderW = vpW;
    renderH = heightIfW;
  } else {
    // Landscape image — scale so height is 2× the viewport so scrolling is obvious
    const scaleByH = (vpH * 2) / imgNH;
    renderW = imgNW * scaleByH;
    renderH = vpH * 2;
  }

  const maxOffset = renderH - vpH;
  const topOffset = -(maxOffset * (sliderVal / 100));

  focalPreviewImg.style.width  = renderW + 'px';
  focalPreviewImg.style.height = renderH + 'px';
  focalPreviewImg.style.top    = topOffset + 'px';
  // Centre horizontally if wider than viewport
  focalPreviewImg.style.left   = renderW > vpW ? ((vpW - renderW) / 2) + 'px' : '0px';
}

function focalLabel(v) {
  if (v <= 10) return 'Very Top';
  if (v <= 25) return 'Top';
  if (v <= 40) return 'Upper';
  if (v <= 60) return 'Centre';
  if (v <= 75) return 'Lower';
  if (v <= 90) return 'Bottom';
  return 'Very Bottom';
}

focalSlider.addEventListener('input', () => {
  const v         = parseInt(focalSlider.value);
  photoFocalPoint = v / 100;
  focalValueLabel.textContent = focalLabel(v);
  updateFocalPreview(v);
});


// ── Photo picker ──────────────────────────────────────────
const PHOTO_BASE  = 'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/photos/';
const PHOTO_COUNT = 12;
const CATEGORY_MAP = {
  office:     'office',
  team:       'team',
  datacenter: 'datacenter',
  network:    'network',
  security:   'security',
  abstract:   'abstract'
};

// Track which indices have been shown per category to avoid repeats
let shownIndices = {};

function getRandomPhotos(category, count = 4) {
  if (!shownIndices[category]) shownIndices[category] = [];
  const available = Array.from({length: PHOTO_COUNT}, (_, i) => i + 1)
    .filter(i => !shownIndices[category].includes(i));

  // If we've shown all, reset
  if (available.length < count) {
    shownIndices[category] = [];
    return getRandomPhotos(category, count);
  }

  // Pick `count` random from available
  const picked = [];
  const pool   = [...available];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  shownIndices[category].push(...picked);
  return picked.map(i => ({
    thumb: `${PHOTO_BASE}${category}-${i}.jpg`,
    full:  `${PHOTO_BASE}${category}-${i}.jpg`,
    alt:   `${category} photo ${i}`
  }));
}

async function fetchPhotos() {
  findPhotosBtn.disabled    = true;
  findPhotosBtn.textContent = 'Loading…';
  photoLoading.hidden       = false;
  photoPicker.hidden        = true;
  selectedPhotoUrl          = '';
  focalControl.hidden       = true;

  try {
    const category = industrySelect.value;
    const photos   = getRandomPhotos(category, 4);
    renderPhotos(photos);
    photoPicker.hidden = false;
  } catch (e) {
    showFormError('Could not load photos: ' + e.message);
  } finally {
    photoLoading.hidden       = true;
    findPhotosBtn.disabled    = false;
    findPhotosBtn.textContent = 'Find Photos →';
  }
}

function renderPhotos(photos) {
  photoGrid.innerHTML = '';
  selectedPhotoUrl    = '';
  photoCredit.textContent = '';
  photoLoading.hidden = true;

  photos.forEach(photo => {
    const tile = document.createElement('div');
    tile.className = 'photo-thumb';
    tile.innerHTML = `<img src="${photo.thumb}" alt="${photo.alt}" loading="lazy"><div class="photo-thumb-check">✓</div>`;

    tile.addEventListener('click', () => {
      document.querySelectorAll('.photo-thumb').forEach(t => t.classList.remove('is-selected'));
      tile.classList.add('is-selected');
      selectedPhotoUrl = photo.full;
      photoCredit.textContent = '';
      focalSlider.value   = 50;
      photoFocalPoint     = 0.5;
      focalValueLabel.textContent = 'Centre';
      focalPreviewImg.src = photo.thumb;
      focalPreviewImg.onload = () => updateFocalPreview(50);
      focalControl.hidden = false;
    });
    photoGrid.appendChild(tile);
  });
}

findPhotosBtn.addEventListener('click', () => { fetchPhotos(); });
morePhotosBtn.addEventListener('click', () => { fetchPhotos(); });
industrySelect.addEventListener('change', () => { photoPicker.hidden = true; selectedPhotoUrl = ''; shownIndices[industrySelect.value] = []; focalControl.hidden = true; });

// ── Website photos (extract.pics) ─────────────────────────
// ── Template selection ────────────────────────────────────
document.querySelectorAll('.template-tile:not(.is-soon)').forEach(tile => {
  tile.addEventListener('click', () => {
    document.querySelectorAll('.template-tile').forEach(t => t.classList.remove('is-selected'));
    tile.classList.add('is-selected');
    selectedTemplate = tile.dataset.template;
  });
});

// ── Extract brand colour ──────────────────────────────────
extractBtn.addEventListener('click', async () => {
  const url = websiteInput.value.trim();
  if (!url) { websiteInput.focus(); return; }

  extractBtn.disabled      = true;
  extractBtn.textContent   = 'Extracting…';
  extractStatus.hidden     = true;

  try {
    const res  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'extract-color', websiteUrl: url })
    });
    const data = await res.json();

    if (data.ok && data.color) {
      colorPicker.value             = data.color;
      colorHex.value                = data.color.toUpperCase();
      colorPreview.style.background = data.color;
      updateTemplatePreview(data.color);
      showExtractStatus(true, `Found: ${data.color.toUpperCase()}`);
    } else {
      showExtractStatus(false, 'Colour not found — pick one manually below.');
    }
  } catch (e) {
    showExtractStatus(false, 'Could not reach the website. Pick a colour manually.');
  } finally {
    extractBtn.disabled    = false;
    extractBtn.textContent = 'Extract colour →';
  }
});

function showExtractStatus(ok, msg) {
  extractStatus.textContent = ok ? '✓ ' + msg : '– ' + msg;
  extractStatus.className   = 'extract-status ' + (ok ? 'is-ok' : 'is-error');
  extractStatus.hidden      = false;
}

// ── Logo URL preview ──────────────────────────────────────
previewLogoBtn.addEventListener('click', async () => {
  const url = logoUrlInput.value.trim();
  if (!url) { logoUrlInput.focus(); return; }

  previewLogoBtn.disabled   = true;
  previewLogoBtn.textContent = 'Loading…';

  // Try direct load first
  const directOk = await new Promise((resolve) => {
    const tmp = new Image();
    tmp.onload  = () => resolve(true);
    tmp.onerror = () => resolve(false);
    tmp.src = url;
  });

  if (directOk) {
    logoPreviewImg.src     = url;
    logoPreviewArea.hidden = false;
  } else {
    // Fall back to server-side proxy (bypasses CORS)
    try {
      const res  = await fetch('/api/generate-cover', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'proxy-logo', logoUrl: url })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      logoPreviewImg.src     = data.dataUrl;
      logoPreviewArea.hidden = false;
    } catch (e) {
      logoPreviewArea.hidden = true;
      showFormError('Could not load logo from that URL. Check the address and try again.');
    }
  }

  previewLogoBtn.disabled   = false;
  previewLogoBtn.textContent = 'Preview';
});

logoClearBtn.addEventListener('click', () => {
  logoPreviewArea.hidden = true;
  logoUrlInput.value     = '';
});

// ── Logo file upload ──────────────────────────────────────

// ── Form error ────────────────────────────────────────────
function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden      = false;
  formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearFormError() { formError.hidden = true; }

// ── Validation ────────────────────────────────────────────
function validate() {
  clearFormError();
  if (!companyInput.value.trim()) {
    showFormError('Please enter the prospect\'s company name.');
    companyInput.focus(); return false;
  }
  const hex = colorHex.value.trim();
  if (!isValidHex(hex.startsWith('#') ? hex : '#' + hex)) {
    showFormError('Please enter a valid brand colour (e.g. #1a4da0).');
    colorHex.focus(); return false;
  }
  if (!logoUrlInput.value.trim()) {
    showFormError('Please provide the prospect\'s logo URL.');
    logoUrlInput.focus(); return false;
  }
  if (!selectedPhotoUrl) {
    showFormError('Please click "Find Photos" in Step 3 and select a background photo.');
    findPhotosBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return false;
  }
  return true;
}

// ── Generate ──────────────────────────────────────────────
generateBtn.addEventListener('click', async () => {
  if (!validate()) return;

  generateBtn.disabled = true;
  clearFormError();
  showView('working');

  const companyName    = companyInput.value.trim();
  const brandColor     = colorHex.value.trim().startsWith('#') ? colorHex.value.trim() : '#' + colorHex.value.trim();
  const industry       = industrySelect.value;
  const logoUrl        = logoUrlInput.value.trim();

  try {
    // Phase 1 — find photo + start Placid generation
    workTitle.textContent = 'Generating your cover page…';
    workSub.textContent   = 'Applying branding and compositing the image — usually 15 seconds';

    const startRes  = await fetch('/api/generate-cover', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        action:     'start',
        templateId: selectedTemplate,
        brandColor,
        logoUrl,
        photoUrl:   selectedPhotoUrl,
        industry,
        companyName
      })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) throw new Error(startData.error || 'Could not start generation.');

    // If Placid already finished synchronously (rare but possible)
    if (startData.imageUrl) {
      generatedImageUrl = startData.imageUrl;
    } else {
      // Phase 2 — poll until Placid finishes (client-side loop, each call < 1s)
      workTitle.textContent = 'Rendering your cover page…';
      workSub.textContent   = 'Placid is applying your branding — usually 10–15 seconds';

      const imageId = startData.imageId;
      let ready = false;

      for (let i = 0; i < 20; i++) {          // max 40 seconds
        await new Promise(r => setTimeout(r, 2000));
        const pollRes  = await fetch('/api/generate-cover', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'poll', imageId })
        });
        const pollData = await pollRes.json();
        if (pollData.ok && pollData.ready) {
          generatedImageUrl = pollData.imageUrl;
          ready = true;
          break;
        }
      }
      if (!ready) throw new Error('Generation timed out — please try again.');
    }

    // Show result
    resultTitle.textContent   = companyName;
    coverPreview.src          = generatedImageUrl;
    coverPreview.alt          = `${companyName} cover page`;

    // Set up download
    downloadBtn.href     = generatedImageUrl;
    downloadBtn.download = `${companyName.replace(/\s+/g,'-')}-cover-page.png`;
    downloadBtn.textContent = '⬇ Download Cover Page';

    showView('result');

  } catch (err) {
    showFormError(err.message || 'Something went wrong. Please try again.');
    showView('form');
  } finally {
    generateBtn.disabled = false;
  }
});

// ── Restart ───────────────────────────────────────────────
restartBtn.addEventListener('click', () => {
  generatedImageUrl = '';
  logoPreviewArea.hidden    = true;
  focalControl.hidden       = true;
  focalSlider.value         = 50;
  photoFocalPoint           = 0.5;
  clearFormError();
  showView('form');
});

// ── Text Overlay Editor ───────────────────────────────────

const CANVAS_W = 500; // display width — proportional height calculated from image

function teDrawCanvas() {
  if (!teImg) return;
  const ctx = textCanvas.getContext('2d');
  const w   = textCanvas.width;
  const h   = textCanvas.height;

  // Draw cover image
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(teImg, 0, 0, w, h);

  const heading    = txtHeading.value.trim();
  const subheading = txtSubheading.value.trim();
  if (!heading && !subheading) return;

  const font       = txtFont.value;
  const headSize   = parseInt(txtSize.value);
  const subSz      = parseInt(txtSubSize.value);
  const color      = txtColor.value    || '#ffffff';
  const subColor   = txtSubColor.value || '#ffffff';
  const shadow     = txtShadow.checked;
  const blur       = parseInt(txtShadowBlur.value);
  const scale      = w / teImg.naturalWidth;

  // Scale font sizes proportionally to canvas display size
  const hSz = Math.round(headSize * scale);
  const sSz = Math.round(subSz * scale);

  // Text position in canvas pixels
  const tx = teX * w;
  const ty = teY * h;

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';

  if (shadow) {
    ctx.shadowColor   = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur    = blur * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 2 * scale;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
  }

  let curY = ty;

  if (heading) {
    ctx.fillStyle = color;
    ctx.font = `700 ${hSz}px "${font}", sans-serif`;
    const words    = heading.split(' ');
    const maxWidth = w * 0.82;
    let   line     = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, tx, curY);
        curY += hSz * 1.2;
        line  = word;
      } else { line = test; }
    }
    if (line) { ctx.fillText(line, tx, curY); curY += hSz * 1.2; }
    curY += sSz * 0.4;
  }

  if (subheading) {
    ctx.fillStyle    = subColor;
    ctx.font         = `400 ${sSz}px "${font}", sans-serif`;
    ctx.shadowBlur   = shadow ? blur * scale * 0.6 : 0;
    const words    = subheading.split(' ');
    const maxWidth = w * 0.82;
    let   line     = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, tx, curY);
        curY += sSz * 1.3;
        line  = word;
      } else { line = test; }
    }
    if (line) ctx.fillText(line, tx, curY);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
}

function teOpenEditor(imageUrl, returnView) {
  teSourceUrl  = imageUrl;
  teReturnView = returnView;
  teX          = 0.06;
  teY          = 0.60;

  // Load image, size canvas proportionally
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    teImg = img;
    const ratio = img.naturalHeight / img.naturalWidth;
    textCanvas.width  = CANVAS_W;
    textCanvas.height = Math.round(CANVAS_W * ratio);
    teDrawCanvas();
  };
  img.onerror = () => {
    // Try without crossOrigin if CORS fails
    const img2 = new Image();
    img2.onload = () => {
      teImg = img2;
      const ratio = img2.naturalHeight / img2.naturalWidth;
      textCanvas.width  = CANVAS_W;
      textCanvas.height = Math.round(CANVAS_W * ratio);
      teDrawCanvas();
    };
    img2.src = imageUrl;
  };
  img.src = imageUrl;

  // Reset controls
  txtHeading.value      = '';
  txtSubheading.value   = '';
  txtFont.value         = 'Inter';
  txtSize.value         = '120';
  txtSizeVal.textContent = '120';
  txtSubSize.value      = '60';
  txtSubSizeVal.textContent = '60';
  txtColor.value        = '#ffffff';
  txtColorHex.value     = '#FFFFFF';
  txtSubColor.value     = '#ffffff';
  txtSubColorHex.value  = '#FFFFFF';
  txtShadow.checked     = true;
  txtShadowBlur.value   = '8';

  showView('text-editor');
  window.scrollTo(0, 0);
}

// Control event listeners
[txtHeading, txtSubheading, txtFont, txtShadow, txtShadowBlur].forEach(el => {
  el.addEventListener('input', teDrawCanvas);
});

txtSize.addEventListener('input', () => {
  txtSizeVal.textContent = txtSize.value;
  teDrawCanvas();
});
txtSubSize.addEventListener('input', () => {
  txtSubSizeVal.textContent = txtSubSize.value;
  teDrawCanvas();
});

txtColor.addEventListener('input', () => {
  txtColorHex.value = txtColor.value.toUpperCase();
  teDrawCanvas();
});
txtColorHex.addEventListener('input', () => {
  const v = txtColorHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) { txtColor.value = v; teDrawCanvas(); }
});
txtSubColor.addEventListener('input', () => {
  txtSubColorHex.value = txtSubColor.value.toUpperCase();
  teDrawCanvas();
});
txtSubColorHex.addEventListener('input', () => {
  const v = txtSubColorHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) { txtSubColor.value = v; teDrawCanvas(); }
});

// Drag to reposition
textCanvas.addEventListener('mousedown', (e) => {
  teDragging     = true;
  teDragStartX   = e.clientX;
  teDragStartY   = e.clientY;
  teDragTeXStart = teX;
  teDragTeYStart = teY;
  textCanvas.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', (e) => {
  if (!teDragging) return;
  const dx = (e.clientX - teDragStartX) / textCanvas.width;
  const dy = (e.clientY - teDragStartY) / textCanvas.height;
  teX = Math.max(0.02, Math.min(0.96, teDragTeXStart + dx));
  teY = Math.max(0.02, Math.min(0.96, teDragTeYStart + dy));
  teDrawCanvas();
});
window.addEventListener('mouseup', () => {
  teDragging = false;
  textCanvas.style.cursor = 'move';
});

// Touch support
textCanvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t      = e.touches[0];
  teDragging   = true;
  teDragStartX = t.clientX;
  teDragStartY = t.clientY;
  teDragTeXStart = teX;
  teDragTeYStart = teY;
}, { passive: false });
window.addEventListener('touchmove', (e) => {
  if (!teDragging) return;
  e.preventDefault();
  const t  = e.touches[0];
  const dx = (t.clientX - teDragStartX) / textCanvas.width;
  const dy = (t.clientY - teDragStartY) / textCanvas.height;
  teX = Math.max(0.02, Math.min(0.96, teDragTeXStart + dx));
  teY = Math.max(0.02, Math.min(0.96, teDragTeYStart + dy));
  teDrawCanvas();
}, { passive: false });
window.addEventListener('touchend', () => { teDragging = false; });

// Arrow key nudging
window.addEventListener('keydown', (e) => {
  if (textEditorView.hidden) return;
  const step = e.shiftKey ? 10 / textCanvas.width : 1 / textCanvas.width;
  const vstep = e.shiftKey ? 10 / textCanvas.height : 1 / textCanvas.height;
  if (e.key === 'ArrowLeft')  { e.preventDefault(); teX = Math.max(0.02, teX - step);  teDrawCanvas(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); teX = Math.min(0.96, teX + step);  teDrawCanvas(); }
  if (e.key === 'ArrowUp')    { e.preventDefault(); teY = Math.max(0.02, teY - vstep); teDrawCanvas(); }
  if (e.key === 'ArrowDown')  { e.preventDefault(); teY = Math.min(0.96, teY + vstep); teDrawCanvas(); }
});

txtResetPosBtn.addEventListener('click', () => {
  teX = 0.06; teY = 0.60;
  teDrawCanvas();
});

// Download at full resolution
txtDownloadBtn.addEventListener('click', () => {
  if (!teImg) return;
  // Render at full Placid resolution
  const hiCanvas    = document.createElement('canvas');
  hiCanvas.width    = teImg.naturalWidth;
  hiCanvas.height   = teImg.naturalHeight;
  const hiCtx       = hiCanvas.getContext('2d');
  hiCtx.drawImage(teImg, 0, 0);

  const font        = txtFont.value;
  const headSize    = parseInt(txtSize.value);
  const subSz       = parseInt(txtSubSize.value);
  const color       = txtColor.value    || '#ffffff';
  const subColor    = txtSubColor.value || '#ffffff';
  const shadow      = txtShadow.checked;
  const blur        = parseInt(txtShadowBlur.value);
  const w           = hiCanvas.width;
  const h           = hiCanvas.height;
  const tx          = teX * w;
  const ty          = teY * h;

  hiCtx.textAlign    = 'left';
  hiCtx.textBaseline = 'top';

  if (shadow) {
    hiCtx.shadowColor   = 'rgba(0,0,0,0.7)';
    hiCtx.shadowBlur    = blur;
    hiCtx.shadowOffsetX = 4;
    hiCtx.shadowOffsetY = 4;
  }

  let curY = ty;

  if (heading) {
    hiCtx.fillStyle = color;
    hiCtx.font = `700 ${headSize}px "${font}", sans-serif`;
    const words    = heading.split(' ');
    const maxWidth = w * 0.82;
    let   line     = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (hiCtx.measureText(test).width > maxWidth && line) {
        hiCtx.fillText(line, tx, curY);
        curY += headSize * 1.2;
        line  = word;
      } else { line = test; }
    }
    if (line) { hiCtx.fillText(line, tx, curY); curY += headSize * 1.2; }
    curY += subSz * 0.4;
  }

  if (subheading) {
    hiCtx.fillStyle  = subColor;
    hiCtx.font       = `400 ${subSz}px "${font}", sans-serif`;
    hiCtx.shadowBlur = shadow ? blur * 0.6 : 0;
    const words    = subheading.split(' ');
    const maxWidth = w * 0.82;
    let   line     = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (hiCtx.measureText(test).width > maxWidth && line) {
        hiCtx.fillText(line, tx, curY);
        curY += subSz * 1.3;
        line  = word;
      } else { line = test; }
    }
    if (line) hiCtx.fillText(line, tx, curY);
  }

  const link = document.createElement('a');
  link.download = 'cover-with-text.png';
  link.href = hiCanvas.toDataURL('image/png');
  link.click();
});

// Open editor buttons
autoAddTextBtn.addEventListener('click', () => {
  const imageUrl = autoResults[autoSelectedId];
  if (!imageUrl) return;
  teOpenEditor(imageUrl, 'result-auto');
});
manualAddTextBtn.addEventListener('click', () => {
  if (!generatedImageUrl) return;
  teOpenEditor(generatedImageUrl, 'result');
});

// Back button
textEditorBackBtn.addEventListener('click', () => {
  showView(teReturnView);
});

// ── Boot ──────────────────────────────────────────────────
init();
updateTemplatePreview(colorPicker.value);
